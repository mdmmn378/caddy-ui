<script setup lang="ts">
import { Plus, Lock, Cloud } from 'lucide-vue-next'
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import RowActions from '@/components/app/RowActions.vue'
import CloudflareDialog from '@/components/app/CloudflareDialog.vue'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import type { TlsPolicySummary } from '@/lib/caddy/types'

const { tlsPolicies, deleteTlsPolicy, saving } = useCaddy()

const dialogOpen = ref(false)
const editing = ref<TlsPolicySummary | null>(null)
const confirmOpen = ref(false)
const target = ref<TlsPolicySummary | null>(null)

function create() {
  editing.value = null
  dialogOpen.value = true
}
function edit(row: TlsPolicySummary) {
  editing.value = row
  dialogOpen.value = true
}
function askDelete(row: TlsPolicySummary) {
  target.value = row
  confirmOpen.value = true
}
async function confirmDelete() {
  if (!target.value) return
  try {
    await deleteTlsPolicy(target.value.index)
    toast.success('Policy deleted')
    confirmOpen.value = false
  } catch (e: any) {
    toast.error('Failed to delete', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="TLS & DNS"
      description="Certificate automation policies, including ACME DNS-01 challenge providers like Cloudflare."
    >
      <template #actions>
        <Button @click="create">
          <Plus class="size-4" />
          Add Cloudflare DNS
        </Button>
      </template>
    </PageHeader>

    <Alert class="mb-6">
      <Cloud />
      <AlertTitle>About DNS challenges</AlertTitle>
      <AlertDescription>
        A Cloudflare API token lets Caddy issue certificates (including
        <strong>wildcards</strong>) via DNS, without needing inbound ports 80/443. It requires Caddy
        built with the <code class="font-mono">caddy-dns/cloudflare</code> plugin.
      </AlertDescription>
    </Alert>

    <EmptyState
      v-if="!tlsPolicies.length"
      :icon="Lock"
      title="No TLS automation policies"
      description="Add a Cloudflare DNS token to enable DNS-01 certificate issuance for your domains."
    >
      <Button @click="create">
        <Plus class="size-4" />
        Add Cloudflare DNS
      </Button>
    </EmptyState>

    <Card v-else>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domains</TableHead>
              <TableHead>Challenge</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Resolvers</TableHead>
              <TableHead class="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty v-if="!tlsPolicies.length" :colspan="5">No policies</TableEmpty>
            <TableRow v-for="row in tlsPolicies" :key="row.index">
              <TableCell>
                <div v-if="row.subjects.length" class="flex flex-wrap gap-1">
                  <Badge v-for="s in row.subjects" :key="s" variant="secondary" class="font-mono">
                    {{ s }}
                  </Badge>
                </div>
                <span v-else class="text-muted-foreground text-xs">all certificates</span>
              </TableCell>
              <TableCell>
                <Badge v-if="row.challenge === 'dns'" variant="success">
                  DNS · {{ row.dnsProvider }}
                </Badge>
                <Badge v-else variant="outline">default (HTTP / TLS-ALPN)</Badge>
              </TableCell>
              <TableCell>
                <code v-if="row.tokenMasked" class="font-mono text-xs">{{ row.tokenMasked }}</code>
                <span v-else class="text-muted-foreground text-xs">—</span>
              </TableCell>
              <TableCell>
                <code class="text-muted-foreground font-mono text-xs">
                  {{ row.resolvers.join(', ') || '—' }}
                </code>
              </TableCell>
              <TableCell>
                <RowActions @edit="edit(row)" @delete="askDelete(row)" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <CloudflareDialog v-model:open="dialogOpen" :edit="editing" />
    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete TLS policy?"
      description="This removes the certificate automation policy. Affected domains fall back to the default policy."
      :loading="saving"
      @confirm="confirmDelete"
    />
  </div>
</template>
