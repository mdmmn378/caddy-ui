# syntax=docker/dockerfile:1

# Caddy built with the `caddy-dns/cloudflare` plugin.
#
# The stock `caddy:2` image can NOT do ACME DNS-01 challenges via Cloudflare, so
# the UI's "TLS & DNS" page (wildcard certs / no inbound 80-443) would fail with
# the default image. We rebuild Caddy with xcaddy to bake the plugin in.
ARG CADDY_VERSION=2

FROM caddy:${CADDY_VERSION}-builder AS builder
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare

FROM caddy:${CADDY_VERSION}
# Replace the stock binary with our plugin-enabled build.
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
