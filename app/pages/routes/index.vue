<script setup lang="ts">
import { Plus, Signpost } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import KindBadge from '@/components/app/KindBadge.vue'
import RowActions from '@/components/app/RowActions.vue'
import GatewayDialog from '@/components/app/GatewayDialog.vue'
import SiteDialog from '@/components/app/SiteDialog.vue'
import RedirectDialog from '@/components/app/RedirectDialog.vue'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import type { RouteSummary } from '@/lib/caddy/types'

const { routes, deleteRoute, saving } = useCaddy()

const gatewayOpen = ref(false)
const siteOpen = ref(false)
const redirectOpen = ref(false)
const editing = ref<RouteSummary | null>(null)

const confirmOpen = ref(false)
const target = ref<RouteSummary | null>(null)

function createGateway() {
  editing.value = null
  gatewayOpen.value = true
}
function createSite() {
  editing.value = null
  siteOpen.value = true
}
function createRedirect() {
  editing.value = null
  redirectOpen.value = true
}

function edit(row: RouteSummary) {
  editing.value = row
  if (row.kind === 'gateway') gatewayOpen.value = true
  else if (row.kind === 'site') siteOpen.value = true
  else if (row.kind === 'redirect') redirectOpen.value = true
  else toast.info('This route type can only be edited from the raw config.')
}

function askDelete(row: RouteSummary) {
  target.value = row
  confirmOpen.value = true
}
async function confirmDelete() {
  if (!target.value) return
  try {
    await deleteRoute(target.value.serverName, target.value.index)
    toast.success('Route deleted')
    confirmOpen.value = false
  } catch (e: any) {
    toast.error('Failed to delete', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Routes"
      description="All HTTP routes across every server, in evaluation order."
    >
      <template #actions>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button>
              <Plus class="size-4" />
              New Route
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="createGateway">API Gateway</DropdownMenuItem>
            <DropdownMenuItem @select="createSite">Static Site</DropdownMenuItem>
            <DropdownMenuItem @select="createRedirect">Redirect</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </PageHeader>

    <EmptyState
      v-if="!routes.length"
      :icon="Signpost"
      title="No routes configured"
      description="Routes define how Caddy matches and handles incoming requests."
    >
      <Button @click="createGateway">
        <Plus class="size-4" />
        Add a route
      </Button>
    </EmptyState>

    <Card v-else>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-10">#</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Server</TableHead>
              <TableHead class="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty v-if="!routes.length" :colspan="6">No routes</TableEmpty>
            <TableRow v-for="row in routes" :key="row.id">
              <TableCell class="text-muted-foreground tabular-nums">{{ row.index }}</TableCell>
              <TableCell><KindBadge :kind="row.kind" /></TableCell>
              <TableCell>
                <div class="font-medium">
                  {{ row.hosts.length ? row.hosts.join(', ') : 'any host' }}
                </div>
                <div class="text-muted-foreground font-mono text-xs">
                  {{ row.paths.join(' ') || '/*' }}
                </div>
              </TableCell>
              <TableCell
                ><code class="font-mono text-xs">{{ row.target || '—' }}</code></TableCell
              >
              <TableCell
                ><code class="text-muted-foreground font-mono text-xs">{{
                  row.serverName
                }}</code></TableCell
              >
              <TableCell>
                <RowActions @edit="edit(row)" @delete="askDelete(row)" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <GatewayDialog v-model:open="gatewayOpen" :edit="editing" />
    <SiteDialog v-model:open="siteOpen" :edit="editing" />
    <RedirectDialog v-model:open="redirectOpen" :edit="editing" />
    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete route?"
      :description="`This removes route #${target?.index} from server ${target?.serverName}.`"
      :loading="saving"
      @confirm="confirmDelete"
    />
  </div>
</template>
