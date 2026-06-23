import http from 'node:http'
import https from 'node:https'

/**
 * Transparent proxy to the Caddy Admin API.
 *
 * The browser talks to `/api/caddy/<caddy-path>` and Nitro forwards the request
 * server-side to the configured Caddy admin endpoint (default
 * http://localhost:2019). This avoids CORS entirely.
 *
 * Why node:http instead of fetch():
 *   undici's fetch() automatically attaches `Sec-Fetch-Mode: cors` (and friends).
 *   Caddy's admin endpoint treats any request carrying browser fetch-metadata or
 *   an Origin header as a cross-origin browser request and enforces a strict
 *   origin allow-list (DNS-rebinding protection) — rejecting our server-side
 *   call with `403 origin ''`. node:http sends only the headers we specify, so
 *   Caddy sees a plain trusted client (like curl) and allows it.
 *
 * Examples:
 *   GET  /api/caddy/config/                      -> GET  :2019/config/
 *   POST /api/caddy/load                         -> POST :2019/load
 *   PATCH /api/caddy/config/apps/http/servers    -> PATCH :2019/config/apps/http/servers
 */
interface UpstreamResult {
  status: number
  body: string
  contentType: string | undefined
  etag: string | undefined
}

// Request headers we pass through to Caddy. `If-Match`/`If-None-Match` drive the
// Etag-based optimistic concurrency described in the admin API docs, and
// `Cache-Control: must-revalidate` forces POST /load to reload an identical
// config. Everything else (Origin, Sec-Fetch-*, cookies, …) is deliberately
// dropped so Caddy sees a plain trusted server-side client.
const FORWARDED_REQUEST_HEADERS = ['content-type', 'if-match', 'if-none-match', 'cache-control']

function forward(
  target: URL,
  method: string,
  headers: Record<string, string>,
  body: string | undefined,
): Promise<UpstreamResult> {
  const client = target.protocol === 'https:' ? https : http
  return new Promise<UpstreamResult>((resolve, reject) => {
    const req = client.request(target, { method, headers }, (res) => {
      res.setEncoding('utf8')
      let data = ''
      res.on('data', (chunk: string) => {
        data += chunk
      })
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 502,
          body: data,
          contentType: res.headers['content-type'],
          etag: res.headers['etag'],
        }),
      )
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

const ROUTE_PREFIX = '/api/caddy/'

export default defineEventHandler(async (event) => {
  const { caddyAdminUrl } = useRuntimeConfig(event)
  const url = getRequestURL(event)
  // Derive the forwarded path from the raw pathname rather than the router
  // param: the `[...path]` catch-all strips the trailing slash, but Caddy's
  // `GET /config/` endpoint requires it (without it Caddy 307-redirects to
  // `/config/`, which the browser then follows to the wrong origin).
  const path = (
    url.pathname.startsWith(ROUTE_PREFIX)
      ? url.pathname.slice(ROUTE_PREFIX.length)
      : (getRouterParam(event, 'path') ?? '')
  ).replace(/^\/+/, '')
  const search = url.search
  const base = String(caddyAdminUrl).replace(/\/+$/, '')

  let target: URL
  try {
    target = new URL(`${base}/${path}${search}`)
  } catch {
    setResponseStatus(event, 500)
    return { error: `Invalid NUXT_CADDY_ADMIN_URL: ${base}` }
  }

  const method = event.method
  const headers: Record<string, string> = {}
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = getHeader(event, name)
    if (value) headers[name] = value
  }

  let body: string | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    body = (await readRawBody(event, 'utf8')) ?? undefined
  }

  let upstream: UpstreamResult
  try {
    upstream = await forward(target, method, headers, body)
  } catch (err) {
    setResponseStatus(event, 502)
    setResponseHeader(event, 'content-type', 'application/json')
    return {
      error: `Could not reach Caddy admin API at ${base}. Is Caddy running?`,
      cause: err instanceof Error ? err.message : String(err),
    }
  }

  setResponseStatus(event, upstream.status)
  setResponseHeader(event, 'content-type', upstream.contentType ?? 'application/json')
  // Expose the Etag so clients can do If-Match optimistic concurrency.
  if (upstream.etag) setResponseHeader(event, 'etag', upstream.etag)

  // Caddy returns an empty body on successful writes (POST /load, PATCH, ...).
  if (!upstream.body) return null
  return upstream.body
})
