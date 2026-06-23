<script setup lang="ts">
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import FormField from '@/components/app/FormField.vue'
import { buildGatewayRoute, findHandler, toList, upstreamsOf } from '@/lib/caddy/builders'
import type { RouteSummary, ReverseProxyHandler, RewriteHandler } from '@/lib/caddy/types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ edit?: RouteSummary | null }>()
const emit = defineEmits<{ saved: [] }>()

const { addRoute, updateRoute, servers, saving, DEFAULT_SERVER } = useCaddy()

const LB_POLICIES = ['round_robin', 'least_conn', 'random', 'ip_hash', 'first', 'header']

const form = reactive({
  serverName: DEFAULT_SERVER,
  hosts: '',
  paths: '/api/*',
  upstreams: '',
  stripPathPrefix: '',
  loadBalancingPolicy: 'round_robin',
  healthUri: '',
  preserveHost: false,
})

const errors = reactive<Record<string, string>>({})
const isEdit = computed(() => !!props.edit)

function reset() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (props.edit) {
    const r = props.edit.raw
    const proxy = findHandler<ReverseProxyHandler>(r, 'reverse_proxy')
    const rewrite = findHandler<RewriteHandler>(r, 'rewrite')
    form.serverName = props.edit.serverName
    form.hosts = props.edit.hosts.join(', ')
    form.paths = props.edit.paths.join(', ')
    form.upstreams = upstreamsOf(r).join('\n')
    form.stripPathPrefix = rewrite?.strip_path_prefix ?? ''
    form.loadBalancingPolicy = proxy?.load_balancing?.selection_policy?.policy ?? 'round_robin'
    form.healthUri = proxy?.health_checks?.active?.uri ?? ''
    form.preserveHost = !!proxy?.headers?.request?.set?.Host
  } else {
    form.serverName = servers.value[0]?.name ?? DEFAULT_SERVER
    form.hosts = ''
    form.paths = '/api/*'
    form.upstreams = ''
    form.stripPathPrefix = ''
    form.loadBalancingPolicy = 'round_robin'
    form.healthUri = ''
    form.preserveHost = false
  }
}

watch(open, (v) => {
  if (v) reset()
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!toList(form.upstreams).length) errors.upstreams = 'At least one upstream is required.'
  if (!toList(form.hosts).length && !toList(form.paths).length)
    errors.hosts = 'Provide at least a host or a path to match.'
  return Object.keys(errors).length === 0
}

async function submit() {
  if (!validate()) return
  const route = buildGatewayRoute({
    id: props.edit?.raw['@id'],
    hosts: toList(form.hosts),
    paths: toList(form.paths),
    upstreams: toList(form.upstreams),
    stripPathPrefix: form.stripPathPrefix || undefined,
    loadBalancingPolicy: form.loadBalancingPolicy || undefined,
    healthUri: form.healthUri || undefined,
    preserveHost: form.preserveHost,
  })
  try {
    if (props.edit) {
      await updateRoute(props.edit.serverName, props.edit.index, route)
      toast.success('API gateway updated')
    } else {
      await addRoute(route, form.serverName)
      toast.success('API gateway created')
    }
    open.value = false
    emit('saved')
  } catch (e: any) {
    toast.error('Failed to save gateway', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Edit API Gateway' : 'New API Gateway' }}</DialogTitle>
        <DialogDescription>
          Reverse-proxy matched requests to one or more backend upstreams.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Host(s)"
            hint="Comma separated. Empty = match any host."
            :error="errors.hosts"
          >
            <Input v-model="form.hosts" placeholder="api.example.com" />
          </FormField>
          <FormField label="Path(s)" hint="e.g. /api/*  (comma separated)">
            <Input v-model="form.paths" placeholder="/api/*" />
          </FormField>
        </div>

        <FormField
          label="Upstreams"
          hint="One host:port per line. e.g. localhost:8080"
          :error="errors.upstreams"
        >
          <Textarea
            v-model="form.upstreams"
            rows="3"
            placeholder="localhost:8080&#10;localhost:8081"
          />
        </FormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Load balancing">
            <Select v-model="form.loadBalancingPolicy">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in LB_POLICIES" :key="p" :value="p">{{ p }}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Strip path prefix" hint="Removed before proxying. e.g. /api">
            <Input v-model="form.stripPathPrefix" placeholder="/api" />
          </FormField>
        </div>

        <FormField label="Active health check URI" hint="Optional. e.g. /healthz">
          <Input v-model="form.healthUri" placeholder="/healthz" />
        </FormField>

        <div class="flex items-center justify-between rounded-lg border p-3">
          <div class="space-y-0.5">
            <div class="text-sm font-medium">Preserve Host header</div>
            <div class="text-muted-foreground text-xs">
              Forward the upstream's hostport as Host.
            </div>
          </div>
          <Switch v-model="form.preserveHost" />
        </div>

        <FormField v-if="!isEdit && servers.length > 1" label="Server">
          <Select v-model="form.serverName">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="s in servers" :key="s.name" :value="s.name">{{
                s.name
              }}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="open = false">Cancel</Button>
        <Button :disabled="saving" @click="submit">
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create gateway' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
