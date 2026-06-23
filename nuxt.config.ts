import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@nuxtjs/color-mode', '@vueuse/nuxt', 'shadcn-nuxt'],

  css: ['~/assets/css/tailwind.css', 'vue-sonner/style.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  shadcn: {
    // Prefix for shadcn-vue components, empty = no prefix (e.g. <Button />)
    prefix: '',
    // Directory that the registry components live in (relative to srcDir = app/)
    componentDir: '@/components/ui',
  },

  app: {
    head: {
      title: 'Caddy UI',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Admin UI for configuring Caddy via the Admin API' },
      ],
    },
  },

  runtimeConfig: {
    // Server-only. Override with NUXT_CADDY_ADMIN_URL at runtime.
    caddyAdminUrl: 'http://localhost:2019',
    public: {
      appName: 'Caddy UI',
    },
  },

  typescript: {
    typeCheck: false, // run explicitly via `bun run typecheck`
    strict: true,
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
