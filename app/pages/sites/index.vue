<script setup lang="ts">
import { Plus, Globe } from 'lucide-vue-next'
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
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import RowActions from '@/components/app/RowActions.vue'
import SiteDialog from '@/components/app/SiteDialog.vue'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import type { RouteSummary } from '@/lib/caddy/types'

const { sites, deleteRoute, saving } = useCaddy()

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
    toast.success('Site deleted')
    confirmOpen.value = false
  } catch (e: any) {
    toast.error('Failed to delete', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <div>
    <PageHeader title="Static Sites" description="Serve files from disk for a given host and path.">
      <template #actions>
        <Button @click="create">
          <Plus class="size-4" />
          New Site
        </Button>
      </template>
    </PageHeader>

    <EmptyState
      v-if="!sites.length"
      :icon="Globe"
      title="No static sites yet"
      description="Add a site to serve static files (HTML, assets, SPA builds) from a directory."
    >
      <Button @click="create">
        <Plus class="size-4" />
        Create your first site
      </Button>
    </EmptyState>

    <Card v-else>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match</TableHead>
              <TableHead>Root</TableHead>
              <TableHead>Server</TableHead>
              <TableHead class="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty v-if="!sites.length" :colspan="4">No sites</TableEmpty>
            <TableRow v-for="row in sites" :key="row.id">
              <TableCell>
                <div class="font-medium">
                  {{ row.hosts.length ? row.hosts.join(', ') : 'any host' }}
                </div>
                <div class="text-muted-foreground font-mono text-xs">
                  {{ row.paths.join(' ') || '/*' }}
                </div>
              </TableCell>
              <TableCell
                ><code class="font-mono text-xs">{{ row.target }}</code></TableCell
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

    <SiteDialog v-model:open="dialogOpen" :edit="editing" />
    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete static site?"
      :description="`This removes the file server for ${target?.hosts.join(', ') || 'any host'}.`"
      :loading="saving"
      @confirm="confirmDelete"
    />
  </div>
</template>
