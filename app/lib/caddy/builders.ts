import type {
  Route,
  Matcher,
  Handler,
  RouteSummary,
  RouteKind,
  ReverseProxyHandler,
  FileServerHandler,
  StaticResponseHandler,
} from './types'

/** Generate a stable, human-ish id used as the route `@id`. */
export function genId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${rand}`
}

/** Split a comma/space/newline separated string into a clean list. */
export function toList(value: string | string[] | undefined): string[] {
  if (!value) return []
  const arr = Array.isArray(value) ? value : value.split(/[\s,]+/)
  return arr.map((s) => s.trim()).filter(Boolean)
}

function buildMatcher(hosts: string[], paths: string[]): Matcher[] {
  const m: Matcher = {}
  if (hosts.length) m.host = hosts
  if (paths.length) m.path = paths
  return Object.keys(m).length ? [m] : []
}

/* -------------------------------------------------------------------------- */
/*  Inputs                                                                     */
/* -------------------------------------------------------------------------- */

export interface GatewayInput {
  id?: string
  hosts: string[]
  paths: string[]
  upstreams: string[]
  stripPathPrefix?: string
  loadBalancingPolicy?: string
  healthUri?: string
  healthInterval?: string
  preserveHost?: boolean
}

export interface SiteInput {
  id?: string
  hosts: string[]
  paths: string[]
  root: string
  browse?: boolean
  indexNames?: string[]
  compression?: boolean
}

export interface RedirectInput {
  id?: string
  hosts: string[]
  paths: string[]
  to: string
  statusCode?: number
}

/* -------------------------------------------------------------------------- */
/*  Builders                                                                   */
/* -------------------------------------------------------------------------- */

export function buildGatewayRoute(input: GatewayInput): Route {
  const handle: Handler[] = []

  if (input.stripPathPrefix) {
    handle.push({ handler: 'rewrite', strip_path_prefix: input.stripPathPrefix })
  }

  const proxy: ReverseProxyHandler = {
    handler: 'reverse_proxy',
    upstreams: input.upstreams.map((dial) => ({ dial })),
  }

  if (input.loadBalancingPolicy) {
    proxy.load_balancing = { selection_policy: { policy: input.loadBalancingPolicy } }
  }

  if (input.healthUri) {
    proxy.health_checks = {
      active: {
        uri: input.healthUri,
        interval: input.healthInterval || '30s',
        timeout: '5s',
      },
    }
  }

  if (input.preserveHost) {
    proxy.headers = { request: { set: { Host: ['{http.reverse_proxy.upstream.hostport}'] } } }
  }

  handle.push(proxy)

  return {
    '@id': input.id ?? genId('gw'),
    match: buildMatcher(input.hosts, input.paths),
    handle,
    terminal: true,
  }
}

export function buildSiteRoute(input: SiteInput): Route {
  const handle: Handler[] = []

  if (input.compression) {
    handle.push({ handler: 'encode', encodings: { gzip: {}, zstd: {} } })
  }

  const fileServer: FileServerHandler = { handler: 'file_server', root: input.root }
  if (input.browse) fileServer.browse = {}
  if (input.indexNames?.length) fileServer.index_names = input.indexNames
  handle.push(fileServer)

  return {
    '@id': input.id ?? genId('site'),
    match: buildMatcher(input.hosts, input.paths),
    handle,
    terminal: true,
  }
}

export function buildRedirectRoute(input: RedirectInput): Route {
  const status = input.statusCode ?? 302
  const handler: StaticResponseHandler = {
    handler: 'static_response',
    status_code: status,
    headers: { Location: [input.to] },
  }
  return {
    '@id': input.id ?? genId('redir'),
    match: buildMatcher(input.hosts, input.paths),
    handle: [handler],
    terminal: true,
  }
}

/* -------------------------------------------------------------------------- */
/*  Classification & summary                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Find the first handler with the given `handler` name, looking through
 * `subroute` wrappers (Caddy commonly nests handlers inside a subroute).
 * Generic so callers get the concrete handler type back.
 */
export function findHandler<T extends Handler = Handler>(
  route: Route,
  name: string,
): T | undefined {
  return flattenHandlers(route).find((h) => h.handler === name) as T | undefined
}

/** Caddy nests handlers inside `subroute`; flatten one level for inspection. */
function flattenHandlers(route: Route): Handler[] {
  const out: Handler[] = []
  for (const h of route.handle ?? []) {
    out.push(h)
    if (h.handler === 'subroute' && 'routes' in h && Array.isArray(h.routes)) {
      for (const sub of h.routes) out.push(...flattenHandlers(sub))
    }
  }
  return out
}

export function classifyRoute(route: Route): RouteKind {
  const handlers = flattenHandlers(route).map((h) => h.handler)
  if (handlers.includes('reverse_proxy')) return 'gateway'
  if (handlers.includes('file_server')) return 'site'
  if (handlers.includes('static_response')) {
    const sr = findHandler(route, 'static_response') as StaticResponseHandler | undefined
    const code = Number(sr?.status_code ?? 0)
    if (code >= 300 && code < 400) return 'redirect'
    return 'static'
  }
  return 'other'
}

function matchersOf(route: Route, key: 'host' | 'path'): string[] {
  const out: string[] = []
  for (const m of route.match ?? []) {
    const v = m[key]
    if (Array.isArray(v)) out.push(...(v as string[]))
  }
  return [...new Set(out)]
}

export function upstreamsOf(route: Route): string[] {
  const proxy = findHandler(route, 'reverse_proxy') as ReverseProxyHandler | undefined
  return (proxy?.upstreams ?? []).map((u) => u.dial ?? '').filter(Boolean)
}

export function summarizeRoute(serverName: string, index: number, route: Route): RouteSummary {
  const kind = classifyRoute(route)
  const hosts = matchersOf(route, 'host')
  const paths = matchersOf(route, 'path')
  const upstreams = upstreamsOf(route)

  let target = ''
  if (kind === 'gateway') {
    target = upstreams.join(', ')
  } else if (kind === 'site') {
    const fs = findHandler(route, 'file_server') as FileServerHandler | undefined
    target = fs?.root ?? '.'
  } else if (kind === 'redirect') {
    const sr = findHandler(route, 'static_response') as StaticResponseHandler | undefined
    target = sr?.headers?.Location?.[0] ?? ''
  }

  return {
    id: route['@id'] ?? `${serverName}#${index}`,
    serverName,
    index,
    kind,
    hosts,
    paths,
    target,
    upstreams,
    raw: route,
  }
}
