<script setup lang="ts">
import { Plus, Server } from 'lucide-vue-next'
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
import ServerDialog from '@/components/app/ServerDialog.vue'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import type { ServerSummary } from '@/lib/caddy/types'

const { servers, deleteServer, saving } = useCaddy()

const dialogOpen = ref(false)
const editing = ref<ServerSummary | null>(null)
const confirmOpen = ref(false)
const target = ref<ServerSummary | null>(null)

function create() {
  editing.value = null
  dialogOpen.value = true
}
function edit(row: ServerSummary) {
  editing.value = row
  dialogOpen.value = true
}
function askDelete(row: ServerSummary) {
  target.value = row
  confirmOpen.value = true
}
async function confirmDelete() {
  if (!target.value) return
  try {
    await deleteServer(target.value.name)
    toast.success('Server deleted')
    confirmOpen.value = false
  } catch (e: any) {
    toast.error('Failed to delete', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <div>
    <PageHeader title="Servers" description="HTTP servers and their listen addresses.">
      <template #actions>
        <Button @click="create">
          <Plus class="size-4" />
          New Server
        </Button>
      </template>
    </PageHeader>

    <EmptyState
      v-if="!servers.length"
      :icon="Server"
      title="No servers defined"
      description="Create a server to start accepting connections on one or more addresses."
    >
      <Button @click="create">
        <Plus class="size-4" />
        Create a server
      </Button>
    </EmptyState>

    <Card v-else>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Listen</TableHead>
              <TableHead>Routes</TableHead>
              <TableHead>HTTPS</TableHead>
              <TableHead class="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty v-if="!servers.length" :colspan="5">No servers</TableEmpty>
            <TableRow v-for="row in servers" :key="row.name">
              <TableCell class="font-mono font-medium">{{ row.name }}</TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-1">
                  <Badge v-for="l in row.listen" :key="l" variant="secondary" class="font-mono">{{
                    l
                  }}</Badge>
                </div>
              </TableCell>
              <TableCell class="tabular-nums">{{ row.routeCount }}</TableCell>
              <TableCell>
                <Badge :variant="row.httpsDisabled ? 'outline' : 'success'">
                  {{ row.httpsDisabled ? 'disabled' : 'automatic' }}
                </Badge>
              </TableCell>
              <TableCell>
                <RowActions @edit="edit(row)" @delete="askDelete(row)" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <ServerDialog v-model:open="dialogOpen" :edit="editing" />
    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete server?"
      :description="`This removes server '${target?.name}' and all of its ${target?.routeCount} route(s).`"
      :loading="saving"
      @confirm="confirmDelete"
    />
  </div>
</template>
