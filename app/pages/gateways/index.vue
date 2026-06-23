<script setup lang="ts">
import { Plus, Waypoints } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/table'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import RowActions from '@/components/app/RowActions.vue'
import GatewayDialog from '@/components/app/GatewayDialog.vue'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import type { RouteSummary } from '@/lib/caddy/types'

const { gateways, deleteRoute, saving } = useCaddy()

const dialogOpen = ref(false)
const editing = ref<RouteSummary | null>(null)
const confirmOpen = ref(false)
const target = ref<RouteSummary | null>(null)

function create() {
  editing.value = null
  dialogOpen.value = true
}
function edit(row: RouteSummary) {
  editing.value = row
  dialogOpen.value = true
}
function askDelete(row: RouteSummary) {
  target.value = row
  confirmOpen.value = true
}
async function confirmDelete() {
  if (!target.value) return
  try {
    await deleteRoute(target.value.serverName, target.value.index)
    toast.success('Gateway deleted')
    confirmOpen.value = false
  } catch (e: any) {
    toast.error('Failed to delete', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="API Gateways"
      description="Reverse-proxy routes that forward traffic to backend services."
    >
      <template #actions>
        <Button @click="create">
          <Plus class="size-4" />
          New Gateway
        </Button>
      </template>
    </PageHeader>

    <EmptyState
      v-if="!gateways.length"
      :icon="Waypoints"
      title="No API gateways yet"
      description="Create a gateway to proxy requests matching a host or path to one or more upstream services."
    >
      <Button @click="create">
        <Plus class="size-4" />
        Create your first gateway
      </Button>
    </EmptyState>

    <Card v-else>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match</TableHead>
              <TableHead>Upstreams</TableHead>
              <TableHead>Server</TableHead>
              <TableHead class="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty v-if="!gateways.length" :colspan="4">No gateways</TableEmpty>
            <TableRow v-for="row in gateways" :key="row.id">
              <TableCell>
                <div class="font-medium">
                  {{ row.hosts.length ? row.hosts.join(', ') : 'any host' }}
                </div>
                <div class="text-muted-foreground font-mono text-xs">
                  {{ row.paths.join(' ') || '/*' }}
                </div>
              </TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-1">
                  <Badge v-for="u in row.upstreams" :key="u" variant="secondary" class="font-mono">
                    {{ u }}
                  </Badge>
                  <span v-if="!row.upstreams.length" class="text-muted-foreground text-xs">—</span>
                </div>
              </TableCell>
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

    <GatewayDialog v-model:open="dialogOpen" :edit="editing" />
    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete API gateway?"
      :description="`This removes the proxy route for ${target?.hosts.join(', ') || 'any host'}.`"
      :loading="saving"
      @confirm="confirmDelete"
    />
  </div>
</template>
