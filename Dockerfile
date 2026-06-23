# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM oven/bun:1.3.14 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---- Runtime stage ----
FROM oven/bun:1.3.14-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0
# Point at the Caddy admin API reachable from the container.
ENV NUXT_CADDY_ADMIN_URL=http://host.docker.internal:2019

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["bun", "run", ".output/server/index.mjs"]
