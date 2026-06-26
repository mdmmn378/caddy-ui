<script setup lang="ts">
/**
 * Caddy UI brand mark. Builds on the original shield (security / HTTPS) by
 * placing a reverse-proxy routing glyph inside it — one client node branching to
 * two upstreams — the core thing this UI configures. Drawn in the lucide
 * line-icon style with `currentColor`, so it inherits the surrounding text color
 * (e.g. `text-primary-foreground` inside the sidebar badge) and theme.
 *
 * Sizing/colour come from forwarded attributes, e.g. `<Logo class="size-5" />`.
 */
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Shield -->
    <path
      d="M12 2.5 19.25 5.2 V11.2 C19.25 16 16.1 19.5 12 21.5 C7.9 19.5 4.75 16 4.75 11.2 V5.2 Z"
    />
    <!-- Reverse-proxy routing: client node -> two upstreams -->
    <path d="M9.4 11.6 H10.9" />
    <path d="M10.9 11.6 C 12.3 11.6 12.4 8.6 13.7 8.6" />
    <path d="M10.9 11.6 C 12.3 11.6 12.4 14.6 13.7 14.6" />
    <circle cx="8.5" cy="11.6" r="1" fill="currentColor" stroke="none" />
    <circle cx="14.6" cy="8.6" r="0.95" fill="currentColor" stroke="none" />
    <circle cx="14.6" cy="14.6" r="0.95" fill="currentColor" stroke="none" />
  </svg>
</template>
