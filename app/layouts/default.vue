<script setup lang="ts">
import { LayoutDashboard, Waypoints, Globe, Signpost, Server, Lock, Braces } from 'lucide-vue-next'
import { Separator } from '@/components/ui/separator'
import AppLogo from '@/components/app/Logo.vue'
import AppConnectionStatus from '@/components/app/ConnectionStatus.vue'
import AppThemeToggle from '@/components/app/ThemeToggle.vue'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/gateways', label: 'API Gateways', icon: Waypoints },
  { to: '/sites', label: 'Static Sites', icon: Globe },
  { to: '/routes', label: 'Routes', icon: Signpost },
  { to: '/servers', label: 'Servers', icon: Server },
  { to: '/tls', label: 'TLS & DNS', icon: Lock },
  { to: '/config', label: 'Raw Config', icon: Braces },
]

const config = useRuntimeConfig()
const appName = config.public.appName
</script>

<template>
  <div class="bg-background flex min-h-screen w-full">
    <!-- Sidebar -->
    <aside
      class="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex"
    >
      <div class="flex h-14 items-center gap-2 px-4">
        <div
          class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md"
        >
          <AppLogo class="size-5" />
        </div>
        <span class="text-sm font-semibold tracking-tight">{{ appName }}</span>
      </div>
      <Separator class="bg-sidebar-border" />
      <nav class="flex flex-1 flex-col gap-1 p-2">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          active-class="bg-sidebar-accent text-sidebar-accent-foreground"
          exact-active-class="bg-sidebar-accent text-sidebar-accent-foreground"
        >
          <component :is="item.icon" class="size-4" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <Separator class="bg-sidebar-border" />
      <div class="text-muted-foreground p-4 text-xs">Caddy Admin API console</div>
    </aside>

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:px-6"
      >
        <span class="flex items-center gap-2 text-sm font-semibold md:hidden">
          <span
            class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
          >
            <AppLogo class="size-4" />
          </span>
          {{ appName }}
        </span>
        <div class="ml-auto flex items-center gap-2">
          <AppConnectionStatus />
          <AppThemeToggle />
        </div>
      </header>

      <main class="flex-1 p-4 md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
