import { caddyApi } from '@/lib/caddy/client'
import { summarizeRoute } from '@/lib/caddy/builders'
import type { CaddyConfig, HttpServer, Route, RouteSummary, ServerSummary } from '@/lib/caddy/types'

const DEFAULT_SERVER = 'srv0'

function emptyConfig(): CaddyConfig {
  return { apps: { http: { servers: {} } } }
}

function deepClone<T>(value: T): T {
  // The config is plain JSON. A JSON round-trip clones it and, crucially, reads
  // cleanly through Vue's reactive Proxy wrapper — structuredClone() throws
  // "could not be cloned" when handed a reactive proxy.
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Central reactive store + actions for the Caddy config. Mutations read the
 * current config, apply the change to a clone, and atomically POST /load, then
 * sync local state. This keeps the UI consistent and changes auditable.
 */
export function useCaddy() {
  const config = useState<CaddyConfig | null>('caddy-config', () => null)
  const loading = useState<boolean>('caddy-loading', () => false)
  const saving = useState<boolean>('caddy-saving', () => false)
  const error = useState<string | null>('caddy-error', () => null)
  const connected = useState<boolean>('caddy-connected', () => false)
  const lastSyncedAt = useState<number | null>('caddy-synced-at', () => null)

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const data = await caddyApi.getConfig()
      config.value = data ?? emptyConfig()
      connected.value = true
      lastSyncedAt.value = Date.now()
    } catch (e: any) {
      connected.value = false
      error.value = e?.data?.error || e?.message || 'Failed to load config from Caddy'
    } finally {
      loading.value = false
    }
  }

  async function save(next: CaddyConfig): Promise<void> {
    saving.value = true
    error.value = null
    try {
      await caddyApi.load(next)
      config.value = next
      connected.value = true
      lastSyncedAt.value = Date.now()
    } catch (e: any) {
      error.value = e?.data?.error || e?.message || 'Failed to save config to Caddy'
      throw e
    } finally {
      saving.value = false
    }
  }

  /** A mutable clone of the current config (or a fresh skeleton). */
  function draft(): CaddyConfig {
    return deepClone(config.value ?? emptyConfig())
  }

  function ensureServer(d: CaddyConfig, name = DEFAULT_SERVER): HttpServer {
    d.apps ??= {}
    d.apps.http ??= {}
    d.apps.http.servers ??= {}
    if (!d.apps.http.servers[name]) {
      d.apps.http.servers[name] = { listen: [':443'], routes: [] }
    }
    const server = d.apps.http.servers[name]
    server.routes ??= []
    return server
  }

  const servers = computed<ServerSummary[]>(() => {
    const map = config.value?.apps?.http?.servers ?? {}
    return Object.entries(map).map(([name, srv]) => ({
      name,
      listen: srv.listen ?? [],
      routeCount: srv.routes?.length ?? 0,
      httpsDisabled: srv.automatic_https?.disable === true,
      raw: srv,
    }))
  })

  const routes = computed<RouteSummary[]>(() => {
    const map = config.value?.apps?.http?.servers ?? {}
    const out: RouteSummary[] = []
    for (const [name, srv] of Object.entries(map)) {
      ;(srv.routes ?? []).forEach((route, index) => {
        out.push(summarizeRoute(name, index, route))
      })
    }
    return out
  })

  const gateways = computed(() => routes.value.filter((r) => r.kind === 'gateway'))
  const sites = computed(() => routes.value.filter((r) => r.kind === 'site'))
  const redirects = computed(() => routes.value.filter((r) => r.kind === 'redirect'))

  /* ---------------------------------------------------------------------- */
  /*  Granular mutations via the Caddy config API.                          */
  /*                                                                        */
  /*  Per https://caddyserver.com/docs/api we use traversal paths under     */
  /*  `config/...`: POST appends to an array, PATCH replaces an existing     */
  /*  array element (by index) or value, DELETE removes one. We only fall    */
  /*  back to POST /load to bootstrap structure that does not exist yet      */
  /*  (the granular endpoints fail if a parent path is missing). After each  */
  /*  change we re-read the config so local state mirrors Caddy exactly and  */
  /*  array indices stay accurate.                                           */
  /* ---------------------------------------------------------------------- */

  const SERVERS_PATH = 'config/apps/http/servers'

  function serverOf(name: string): HttpServer | undefined {
    return config.value?.apps?.http?.servers?.[name]
  }
  function httpServersExist(): boolean {
    return !!config.value?.apps?.http?.servers
  }
  function routesPath(serverName: string): string {
    return `${SERVERS_PATH}/${encodeURIComponent(serverName)}/routes`
  }

  async function bootstrap(mutate: (d: CaddyConfig) => void): Promise<void> {
    const d = draft()
    mutate(d)
    await save(d)
    await refresh()
  }

  async function addRoute(route: Route, serverName = DEFAULT_SERVER): Promise<void> {
    if (serverOf(serverName)) {
      // POST to an array appends (docs: "POST … appends").
      await caddyApi.post(routesPath(serverName), route)
      await refresh()
    } else {
      await bootstrap((d) => ensureServer(d, serverName).routes!.push(route))
    }
  }

  async function updateRoute(serverName: string, index: number, route: Route): Promise<void> {
    // PATCH strictly replaces an existing array element at the given index.
    await caddyApi.patch(`${routesPath(serverName)}/${index}`, route)
    await refresh()
  }

  async function deleteRoute(serverName: string, index: number): Promise<void> {
    await caddyApi.delete(`${routesPath(serverName)}/${index}`)
    await refresh()
  }

  function findRoute(id: string): RouteSummary | undefined {
    return routes.value.find((r) => r.id === id)
  }

  /* ---------------------------------------------------------------------- */
  /*  Server CRUD                                                           */
  /* ---------------------------------------------------------------------- */

  async function upsertServer(name: string, listen: string[]): Promise<void> {
    const key = encodeURIComponent(name)
    if (serverOf(name)) {
      // Replace just this server's listen array.
      await caddyApi.patch(`${SERVERS_PATH}/${key}/listen`, listen)
      await refresh()
    } else if (httpServersExist()) {
      // Create a brand-new server object (PUT strictly creates).
      await caddyApi.put(`${SERVERS_PATH}/${key}`, { listen, routes: [] })
      await refresh()
    } else {
      await bootstrap((d) => {
        const server = ensureServer(d, name)
        server.listen = listen
      })
    }
  }

  async function deleteServer(name: string): Promise<void> {
    await caddyApi.delete(`${SERVERS_PATH}/${encodeURIComponent(name)}`)
    await refresh()
  }

  return {
    // state
    config,
    loading,
    saving,
    error,
    connected,
    lastSyncedAt,
    // derived
    servers,
    routes,
    gateways,
    sites,
    redirects,
    // actions
    refresh,
    save,
    draft,
    addRoute,
    updateRoute,
    deleteRoute,
    findRoute,
    upsertServer,
    deleteServer,
    DEFAULT_SERVER,
  }
}
