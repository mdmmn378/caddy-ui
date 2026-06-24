/**
 * Minimal but practical TypeScript model of the Caddy JSON config.
 * Caddy's config is open-ended (modules register their own fields), so most
 * objects allow arbitrary extra keys via index signatures. We model the parts
 * this admin UI reads and writes precisely, and keep the rest permissive.
 *
 * Reference: https://caddyserver.com/docs/json/
 */

export interface CaddyConfig {
  admin?: AdminConfig
  apps?: AppsConfig
  logging?: Record<string, unknown>
  storage?: Record<string, unknown>
  [key: string]: unknown
}

export interface AdminConfig {
  disabled?: boolean
  listen?: string
  [key: string]: unknown
}

export interface AppsConfig {
  http?: HttpApp
  tls?: TlsApp
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*  TLS app — certificate automation (ACME), incl. DNS-01 challenge providers  */
/*  like Cloudflare. https://caddyserver.com/docs/json/apps/tls/               */
/* -------------------------------------------------------------------------- */

export interface TlsApp {
  automation?: TlsAutomation
  certificates?: Record<string, unknown>
  [key: string]: unknown
}

export interface TlsAutomation {
  policies?: AutomationPolicy[]
  [key: string]: unknown
}

export interface AutomationPolicy {
  /** Domain patterns this policy applies to. Empty = all certificates. */
  subjects?: string[]
  issuers?: Issuer[]
  [key: string]: unknown
}

export interface Issuer {
  module: string // 'acme' | 'zerossl' | 'internal' | ...
  challenges?: {
    dns?: DnsChallenge
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface DnsChallenge {
  provider?: DnsProvider
  /** DNS resolvers to use when checking propagation, e.g. ["1.1.1.1"]. */
  resolvers?: string[]
  [key: string]: unknown
}

/**
 * DNS provider for the ACME DNS-01 challenge. `name` selects the caddy-dns
 * module (e.g. "cloudflare"); the remaining fields are provider-specific
 * (Cloudflare uses `api_token`). Requires Caddy built with that DNS plugin.
 */
export interface DnsProvider {
  name: string
  api_token?: string
  [key: string]: unknown
}

export interface HttpApp {
  servers?: Record<string, HttpServer>
  [key: string]: unknown
}

export interface HttpServer {
  listen?: string[]
  routes?: Route[]
  automatic_https?: {
    disable?: boolean
    disable_redirects?: boolean
    [key: string]: unknown
  }
  /** Read timeout etc. live here in real configs; kept permissive. */
  [key: string]: unknown
}

export interface Route {
  '@id'?: string
  group?: string
  match?: Matcher[]
  handle?: Handler[]
  terminal?: boolean
  [key: string]: unknown
}

export interface Matcher {
  host?: string[]
  path?: string[]
  method?: string[]
  path_regexp?: { pattern?: string; name?: string }
  header?: Record<string, string[]>
  query?: Record<string, string[]>
  [key: string]: unknown
}

/** Discriminated by the `handler` field. We type the ones the UI manipulates. */
export type Handler =
  | ReverseProxyHandler
  | FileServerHandler
  | StaticResponseHandler
  | SubrouteHandler
  | RewriteHandler
  | HeadersHandler
  | EncodeHandler
  | GenericHandler

export interface GenericHandler {
  handler: string
  [key: string]: unknown
}

export interface ReverseProxyHandler {
  handler: 'reverse_proxy'
  upstreams?: Upstream[]
  load_balancing?: LoadBalancing
  health_checks?: HealthChecks
  headers?: {
    request?: HeaderOps
    response?: HeaderOps & { deferred?: boolean }
  }
  transport?: Record<string, unknown>
  [key: string]: unknown
}

export interface Upstream {
  dial?: string
  max_requests?: number
  [key: string]: unknown
}

export interface LoadBalancing {
  selection_policy?: { policy?: string; [key: string]: unknown }
  try_duration?: string
  try_interval?: string
  retries?: number
  [key: string]: unknown
}

export interface HealthChecks {
  active?: {
    uri?: string
    port?: number
    interval?: string
    timeout?: string
    expect_status?: number
    [key: string]: unknown
  }
  passive?: Record<string, unknown>
}

export interface HeaderOps {
  add?: Record<string, string[]>
  set?: Record<string, string[]>
  delete?: string[]
  [key: string]: unknown
}

export interface FileServerHandler {
  handler: 'file_server'
  root?: string
  browse?: Record<string, unknown> | boolean
  index_names?: string[]
  hide?: string[]
  [key: string]: unknown
}

export interface StaticResponseHandler {
  handler: 'static_response'
  status_code?: number | string
  headers?: Record<string, string[]>
  body?: string
  close?: boolean
  [key: string]: unknown
}

export interface RewriteHandler {
  handler: 'rewrite'
  uri?: string
  strip_path_prefix?: string
  strip_path_suffix?: string
  [key: string]: unknown
}

export interface HeadersHandler {
  handler: 'headers'
  request?: HeaderOps
  response?: HeaderOps
  [key: string]: unknown
}

export interface EncodeHandler {
  handler: 'encode'
  encodings?: Record<string, unknown>
  [key: string]: unknown
}

export interface SubrouteHandler {
  handler: 'subroute'
  routes?: Route[]
  [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/*  UI view-models — a friendlier shape the pages bind to.                     */
/* -------------------------------------------------------------------------- */

export type RouteKind = 'gateway' | 'site' | 'redirect' | 'static' | 'other'

/** A flattened, UI-friendly view of one route within a server. */
export interface RouteSummary {
  id: string
  serverName: string
  index: number
  kind: RouteKind
  hosts: string[]
  paths: string[]
  /** Primary target description: upstreams for gateway, root for site, etc. */
  target: string
  upstreams: string[]
  raw: Route
}

export interface ServerSummary {
  name: string
  listen: string[]
  routeCount: number
  httpsDisabled: boolean
  raw: HttpServer
}

export interface TlsPolicySummary {
  index: number
  subjects: string[]
  /** 'cloudflare' (or another caddy-dns provider) when a DNS-01 challenge is set. */
  dnsProvider: string | null
  challenge: 'dns' | 'default'
  resolvers: string[]
  /** Masked representation of the provider token, for display only. */
  tokenMasked: string | null
  /** True when the token is an `{env.X}` placeholder rather than a literal. */
  tokenFromEnv: boolean
  raw: AutomationPolicy
}
