<script setup lang="ts">
import {
  Waypoints,
  Globe,
  Signpost,
  Server,
  Plus,
  ArrowRight,
  AlertTriangle,
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import PageHeader from '@/components/app/PageHeader.vue'
import StatCard from '@/components/app/StatCard.vue'
import KindBadge from '@/components/app/KindBadge.vue'
import GatewayDialog from '@/components/app/GatewayDialog.vue'

const { routes, gateways, sites, redirects, servers, connected, error, refresh, lastSyncedAt } =
  useCaddy()

const gatewayOpen = ref(false)

const recent = computed(() => routes.value.slice(-6).reverse())
const syncedLabel = computed(() =>
  lastSyncedAt.value ? new Date(lastSyncedAt.value).toLocaleTimeString() : '—',
)
</script>

<template>
  <div>
    <PageHeader title="Dashboard" description="Overview of your Caddy HTTP configuration.">
      <template #actions>
        <Button variant="outline" @click="refresh">Refresh</Button>
        <Button @click="gatewayOpen = true">
          <Plus class="size-4" />
          New Gateway
        </Button>
      </template>
    </PageHeader>

    <Alert v-if="error" variant="destructive" class="mb-6">
      <AlertTriangle />
      <AlertTitle>Not connected to Caddy</AlertTitle>
      <AlertDescription>
        {{ error }} Make sure Caddy is running with its admin API enabled, and that
        <code class="font-mono">NUXT_CADDY_ADMIN_URL</code> points to it.
      </AlertDescription>
    </Alert>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="API Gateways" :value="gateways.length" :icon="Waypoints" />
      <StatCard label="Static Sites" :value="sites.length" :icon="Globe" />
      <StatCard label="Redirects" :value="redirects.length" :icon="Signpost" />
      <StatCard
        label="Servers"
        :value="servers.length"
        :icon="Server"
        :hint="`Last synced ${syncedLabel}`"
      />
    </div>

    <div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent routes</CardTitle>
          <CardDescription>The most recently defined routes across all servers.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <div v-if="!recent.length" class="text-muted-foreground py-8 text-center text-sm">
            No routes configured yet.
          </div>
          <div
            v-for="r in recent"
            :key="r.id"
            class="hover:bg-muted/50 flex items-center gap-3 rounded-md border px-3 py-2"
          >
            <KindBadge :kind="r.kind" />
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">
                {{ r.hosts.length ? r.hosts.join(', ') : 'any host' }}
                <span class="text-muted-foreground">{{ r.paths.join(' ') }}</span>
              </div>
              <div class="text-muted-foreground truncate font-mono text-xs">
                {{ r.target || '—' }}
              </div>
            </div>
            <code class="text-muted-foreground hidden font-mono text-xs sm:block">{{
              r.serverName
            }}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Jump into common configuration tasks.</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-2">
          <Button as-child variant="outline" class="justify-between">
            <NuxtLink to="/gateways">
              <span class="flex items-center gap-2"
                ><Waypoints class="size-4" /> Manage API gateways</span
              >
              <ArrowRight class="size-4" />
            </NuxtLink>
          </Button>
          <Button as-child variant="outline" class="justify-between">
            <NuxtLink to="/sites">
              <span class="flex items-center gap-2"
                ><Globe class="size-4" /> Manage static sites</span
              >
              <ArrowRight class="size-4" />
            </NuxtLink>
          </Button>
          <Button as-child variant="outline" class="justify-between">
            <NuxtLink to="/servers">
              <span class="flex items-center gap-2"
                ><Server class="size-4" /> Configure servers</span
              >
              <ArrowRight class="size-4" />
            </NuxtLink>
          </Button>
          <Button as-child variant="ghost" class="justify-between">
            <NuxtLink to="/config">
              <span class="flex items-center gap-2">View raw JSON config</span>
              <ArrowRight class="size-4" />
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>
    </div>

    <p class="text-muted-foreground mt-6 text-center text-xs">
      {{ connected ? 'Live data from the Caddy admin API.' : 'Showing cached/empty data.' }}
    </p>

    <GatewayDialog v-model:open="gatewayOpen" />
  </div>
</template>
