import type { CaddyConfig } from './types'

/**
 * Low-level client for the Caddy Admin API, talking through the Nitro proxy at
 * `/api/caddy/**`. Every method maps 1:1 to a Caddy admin endpoint.
 *
 * Caddy config paths are slash-delimited traversals of the JSON config, e.g.
 * `config/apps/http/servers/srv0/routes`. See https://caddyserver.com/docs/api
 */
const PROXY = '/api/caddy'

function url(path: string): string {
  return `${PROXY}/${path.replace(/^\/+/, '')}`
}

export const caddyApi = {
  /** Full current config. Returns null when Caddy has no config loaded. */
  async getConfig(): Promise<CaddyConfig | null> {
    return (await ($fetch as any)(url('config/'))) as CaddyConfig | null
  },

  /** Replace the entire config atomically (POST /load). */
  async load(config: CaddyConfig): Promise<void> {
    await ($fetch as any)(url('load'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: config,
    })
  },

  /** Read a config sub-path, e.g. `config/apps/http/servers`. */
  async get<T = unknown>(path: string): Promise<T> {
    return (await ($fetch as any)(url(path))) as T
  },

  /** Replace the value at a config path. */
  async put(path: string, data: unknown): Promise<void> {
    await ($fetch as any)(url(path), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: data as Record<string, any>,
    })
  },

  /** POST to a config path. On arrays, appends; on objects, creates. */
  async post(path: string, data: unknown): Promise<void> {
    await ($fetch as any)(url(path), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: data as Record<string, any>,
    })
  },

  /** Merge/patch the value at a config path. */
  async patch(path: string, data: unknown): Promise<void> {
    await ($fetch as any)(url(path), {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: data as Record<string, any>,
    })
  },

  /** Delete the value at a config path. */
  async delete(path: string): Promise<void> {
    await ($fetch as any)(url(path), { method: 'DELETE' })
  },

  /** Access an object anywhere in the config by its `@id`. */
  async getById<T = unknown>(id: string): Promise<T> {
    return (await ($fetch as any)(url(`id/${id}`))) as T
  },

  /** Stop the Caddy process (admin `/stop`). Use with care. */
  async stop(): Promise<void> {
    await ($fetch as any)(url('stop'), { method: 'POST' })
  },
}

export type CaddyApi = typeof caddyApi
