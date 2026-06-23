# Caddy UI

An admin UI for configuring [Caddy](https://caddyserver.com) through its
[Admin API](https://caddyserver.com/docs/api). Manage **API gateways** (reverse
proxies), **static sites** (file servers), **redirects**, **routes**, and
**servers** — without hand-editing JSON.

Built with **Nuxt 4** (Vue 3 `<script setup>` composition API), **Bun**,
**Tailwind CSS v4**, and **shadcn-vue** (reka-ui).

> **Note on Nuxt version:** this scaffold uses Nuxt 4, the current stable release.
> It is the direct successor to Nuxt 3 and uses the identical Vue 3 composition
> API; the only notable change is the `app/` source directory.

---

## Features

- **Dashboard** — at-a-glance counts of gateways, sites, redirects and servers, plus recent routes.
- **API Gateways** — reverse-proxy a host/path to one or more upstreams, with load-balancing policy, path-prefix stripping, active health checks and Host-header preservation.
- **Static Sites** — serve files from disk with index files, directory browsing and compression.
- **Redirects** — 301/302/307/308 redirects via `static_response`.
- **Routes** — every route across all servers in evaluation order, edited by type.
- **Servers** — manage listen addresses.
- **Raw Config** — view and atomically apply the full Caddy JSON (`POST /load`).
- Light/dark theme, toast notifications, fully typed Caddy config model.

## How it works

```
Browser ──▶ Nuxt (Nitro) ──▶ /api/caddy/** proxy ──▶ Caddy Admin API (:2019)
```

The browser never talks to Caddy directly. A Nitro server route
(`server/api/caddy/[...path].ts`) forwards requests to the Caddy admin endpoint
**server-side**, which:

- avoids CORS entirely, and
- strips the browser `Origin`/`Host` headers that Caddy's admin endpoint rejects
  as DNS-rebinding protection.

The admin endpoint URL is configured with `NUXT_CADDY_ADMIN_URL` (default
`http://localhost:2019`) and is only ever read on the server.

### Following the Admin API

Mutations use the granular [config traversal endpoints](https://caddyserver.com/docs/api)
rather than rewriting the whole config:

- **Add route** → `POST /config/.../routes` (POST appends to an array)
- **Edit route** → `PATCH /config/.../routes/{index}` (replaces one element)
- **Delete route** → `DELETE /config/.../routes/{index}`
- **Create server** → `PUT /config/apps/http/servers/{name}` (PUT strictly creates)
- **Raw editor** → `POST /load` (atomic full-config replace)

`POST /load` is used only by the Raw Config page and to bootstrap structure that
doesn't exist yet. The proxy forwards the `If-Match` / `Cache-Control` request
headers and surfaces the `Etag` response header, so the Etag-based optimistic
concurrency from the docs works end-to-end (a stale `If-Match` returns `412`).

## Requirements

- [Bun](https://bun.sh) ≥ 1.3
- A running Caddy instance with the Admin API enabled (it is on by default at `localhost:2019`)
- Optional: [Task](https://taskfile.dev) and [lefthook](https://lefthook.dev) for tooling

## Quick start

```bash
# 1. Install deps + git hooks
task setup            # or: bun install && bunx lefthook install

# 2. Configure the Caddy admin endpoint (optional; defaults to localhost:2019)
cp .env.example .env

# 3. Run the dev server
task dev              # or: bun run dev
```

Open <http://localhost:3000>. If Caddy is running, the header shows
**Connected**.

### Run with Docker (Caddy + UI together)

```bash
docker compose up --build
```

- UI: <http://localhost:3000>
- Caddy: ports 80/443 published; the admin API (`:2019`) stays on the internal
  compose network and is reachable by the UI at `http://caddy:2019`.

## Project structure

```
app/
  assets/css/tailwind.css     # Tailwind v4 + shadcn theme tokens
  components/
    ui/                       # shadcn-vue components (button, card, dialog, …)
    app/                      # app components (dialogs, page header, etc.)
  composables/useCaddy.ts     # reactive store + CRUD actions
  layouts/default.vue         # sidebar shell
  lib/caddy/
    types.ts                  # typed Caddy JSON config model
    client.ts                 # low-level Admin API client
    builders.ts               # build/classify/summarize routes
  pages/                      # dashboard, gateways, sites, routes, servers, config
server/
  api/caddy/[...path].ts      # Nitro proxy to the Caddy Admin API
caddy/Caddyfile               # local dev Caddy config (admin enabled)
```

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `bun run dev`       | Start the dev server         |
| `bun run build`     | Production build             |
| `bun run preview`   | Preview the production build |
| `bun run typecheck` | `vue-tsc` type checking      |
| `bun run lint`      | ESLint                       |
| `bun run format`    | Prettier write               |

Or via Task: `task dev`, `task build`, `task check` (format + lint + typecheck), `task --list`.

## Tooling

- **Task** (`Taskfile.yml`) — task runner front-end for common commands.
- **lefthook** (`lefthook.yml`) — pre-commit (eslint + prettier on staged files) and pre-push (typecheck).
- **GitHub Actions** (`.github/workflows/ci.yml`) — install, prepare, format check, lint, typecheck, build.
- **ESLint** (`@nuxt/eslint`) and **Prettier**.

## Security notes

- Never expose the Caddy admin API (`:2019`) to untrusted networks. Keep it on
  loopback or an internal network, and put authentication in front of this UI if
  you deploy it.
- "Apply" on the Raw Config page replaces the **entire** running configuration.

## License

MIT
