# Caddy UI

A clean admin UI for configuring [Caddy](https://caddyserver.com) through its
[Admin API](https://caddyserver.com/docs/api). Manage **API gateways** (reverse
proxies), **static sites** (file servers), **redirects**, **routes** and
**servers** from the browser — no hand-editing JSON.

Built with **Nuxt 4** (Vue 3 `<script setup>`), **Bun**, **Tailwind CSS v4** and
**shadcn-vue**. Changes are applied to Caddy live, with zero-downtime reloads.

![CI](https://github.com/mdmmn378/caddy-ui/actions/workflows/ci.yml/badge.svg)
![Docker](https://github.com/mdmmn378/caddy-ui/actions/workflows/docker-publish.yml/badge.svg)
[![Docker Hub](https://img.shields.io/badge/docker%20hub-mdmmn378%2Fcaddy--ui-blue?logo=docker)](https://hub.docker.com/r/mdmmn378/caddy-ui)

---

## Quick start (Docker — recommended)

Runs **just the UI**, on the **host network**, pointed at a Caddy already running
on the host (admin API at `localhost:2019` — Caddy's default).

```bash
git clone https://github.com/mdmmn378/caddy-ui.git
cd caddy-ui
docker compose up
```

Then open **<http://localhost:2020>** — the header should show **Connected**.
This pulls the prebuilt image from Docker Hub (`mdmmn378/caddy-ui`), so there's
nothing to build.

> The stack uses `network_mode: host` (a Linux feature), so the container reaches
> the host's Caddy at `localhost:2019` and the UI binds directly to host port
> `2020` (next to Caddy's `2019`, to avoid the usual `3000`/`8080` clashes).

**Prerequisite:** a Caddy admin endpoint reachable at `localhost:2019`. That can
be a local Caddy, or a remote one exposed locally via an SSH tunnel:

```bash
ssh -L 2019:localhost:2019 your-server     # then localhost:2019 -> remote Caddy
```

### Point at a different Caddy endpoint / port

```bash
CADDY_ADMIN_URL=http://10.0.0.5:2019 UI_PORT=8088 docker compose up
```

## Quick start (local dev)

Requires [Bun](https://bun.sh) ≥ 1.3 and a reachable Caddy admin endpoint
(default `http://localhost:2019`, on by default in Caddy).

```bash
bun install
cp .env.example .env       # optional: set NUXT_CADDY_ADMIN_URL
bun run dev                # http://localhost:3000
```

Or with [Task](https://taskfile.dev): `task setup && task dev`.

## Features

- **Dashboard** — counts of gateways/sites/redirects/servers and recent routes.
- **API Gateways** — reverse-proxy a host/path to one or more upstreams, with
  load-balancing policy, path-prefix stripping, active health checks and
  Host-header preservation.
- **Static Sites** — file server with index files, directory browsing and
  compression.
- **Redirects** — 301/302/307/308 via `static_response`.
- **Routes** — every route across all servers, in evaluation order, edited by type.
- **Servers** — manage listen addresses.
- **Raw Config** — view and atomically apply the full Caddy JSON.
- Reads existing configs (including `subroute`-wrapped handlers), light/dark
  theme, toast notifications and a fully-typed Caddy config model.

## How it works

```
Browser ──▶ Nuxt (Nitro) ──▶ /api/caddy/** proxy ──▶ Caddy Admin API (:2019)
```

The browser never talks to Caddy directly. A Nitro server route
(`server/api/caddy/[...path].ts`) forwards requests to the Caddy admin endpoint
**server-side**. This:

- avoids CORS entirely, and
- sends a plain, trusted request — `fetch()`'s `Sec-Fetch-*`/`Origin` headers
  would otherwise trip Caddy's DNS-rebinding protection (`403 origin ''`).

The admin URL is read **only on the server** via `NUXT_CADDY_ADMIN_URL`.

### Faithful to the Admin API

Mutations use the granular [config traversal endpoints](https://caddyserver.com/docs/api),
not whole-config rewrites:

| Action        | Request                                            |
| ------------- | -------------------------------------------------- |
| Add route     | `POST /config/.../routes` (POST appends to arrays) |
| Edit route    | `PATCH /config/.../routes/{index}`                 |
| Delete route  | `DELETE /config/.../routes/{index}`                |
| Create server | `PUT /config/apps/http/servers/{name}`             |
| Raw editor    | `POST /load` (atomic full replace)                 |

The proxy also forwards `If-Match` / `Cache-Control` and surfaces the `Etag`
response header, so the docs' Etag-based optimistic concurrency works end-to-end
(a stale `If-Match` returns `412`).

## Good to know

- **No restart needed.** Saving applies immediately via Caddy's graceful reload.
  Invalid config is rejected and rolled back (the error shows in a toast). Caddy
  also auto-persists the new config to disk.
- **Static sites serve files from where _Caddy_ runs**, not from your browser's
  machine. If Caddy is on a remote host, the site root must exist and be readable
  **on that host** by Caddy's user. A `403` from a `file_server` almost always
  means Caddy's user can't traverse/read the root directory (e.g. a `0750` home
  directory) — serve from a path like `/var/www/...` or grant access.
- **HTTPS for a new public host** is provisioned on demand: the route is live
  instantly, but the first request to a brand-new domain may take a few seconds
  while Caddy obtains a certificate (DNS must point at the server; ports 80/443
  reachable). Local/internal hosts skip this.

## Configuration

| Env var                | Default                 | Description                             |
| ---------------------- | ----------------------- | --------------------------------------- |
| `NUXT_CADDY_ADMIN_URL` | `http://localhost:2019` | Caddy admin endpoint (server-side only) |
| `NUXT_PUBLIC_APP_NAME` | `Caddy UI`              | App name shown in the UI                |

Compose-only overrides: `UI_PORT` (default `2020`), `CADDY_ADMIN_URL`
(default `http://localhost:2019`), `CADDY_UI_IMAGE`, `APP_NAME`. The container
binds `0.0.0.0:$UI_PORT` on the host network — set `NITRO_HOST=127.0.0.1` (in
`docker-compose.yml`) to restrict the UI to localhost only.

## Project structure

```
app/
  components/ui/              # shadcn-vue components
  components/app/             # app components (dialogs, page header, …)
  composables/useCaddy.ts     # reactive store + granular CRUD actions
  layouts/default.vue         # sidebar shell
  lib/caddy/
    types.ts                  # typed Caddy JSON config model
    client.ts                 # low-level Admin API client
    builders.ts               # build / classify / summarize routes
  pages/                      # dashboard, gateways, sites, routes, servers, config
server/api/caddy/[...path].ts # Nitro proxy to the Caddy Admin API
caddy/Caddyfile               # example Caddy config (admin enabled) for reference
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

Via Task: `task dev`, `task build`, `task check` (format + lint + typecheck),
`task --list`.

## Building the image yourself

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build
```

## Publishing (maintainers)

`.github/workflows/docker-publish.yml` builds a multi-arch image
(`linux/amd64`, `linux/arm64`) and pushes to `mdmmn378/caddy-ui` on every push
to `master` (tagged `latest` + short SHA) and on `v*` tags (semver tags).

It requires two repository secrets:

- `DOCKERHUB_USERNAME` — your Docker Hub username (`mdmmn378`)
- `DOCKERHUB_TOKEN` — a Docker Hub [access token](https://hub.docker.com/settings/security)

## Tooling

- **Task** (`Taskfile.yml`) — task runner for common commands.
- **lefthook** (`lefthook.yml`) — pre-commit (eslint + prettier on staged files),
  pre-push (typecheck).
- **GitHub Actions** — `ci.yml` (lint/typecheck/build) and `docker-publish.yml`.
- **ESLint** + **Prettier**.

## Security notes

- Never expose Caddy's admin API (`:2019`) to untrusted networks. Keep it on
  loopback or behind an SSH tunnel.
- This UI has no authentication, and with host networking it binds to all host
  interfaces (`0.0.0.0:2020`). Don't expose it publicly without putting auth in
  front of it (e.g. behind Caddy with `basic_auth`), or set `NITRO_HOST=127.0.0.1`
  to keep it on localhost.
- "Apply" on the Raw Config page replaces the **entire** running configuration.

## License

MIT
