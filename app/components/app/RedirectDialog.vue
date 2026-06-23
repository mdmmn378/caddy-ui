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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import FormField from '@/components/app/FormField.vue'
import { buildRedirectRoute, findHandler, toList } from '@/lib/caddy/builders'
import type { RouteSummary, StaticResponseHandler } from '@/lib/caddy/types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ edit?: RouteSummary | null }>()
const emit = defineEmits<{ saved: [] }>()

const { addRoute, updateRoute, servers, saving, DEFAULT_SERVER } = useCaddy()

const STATUS = ['301', '302', '307', '308']

const form = reactive({
  serverName: DEFAULT_SERVER,
  hosts: '',
  paths: '',
  to: '',
  statusCode: '302',
})

const errors = reactive<Record<string, string>>({})
const isEdit = computed(() => !!props.edit)

function reset() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (props.edit) {
    const sr = findHandler<StaticResponseHandler>(props.edit.raw, 'static_response')
    form.serverName = props.edit.serverName
    form.hosts = props.edit.hosts.join(', ')
    form.paths = props.edit.paths.join(', ')
    form.to = sr?.headers?.Location?.[0] ?? ''
    form.statusCode = String(sr?.status_code ?? 302)
  } else {
    form.serverName = servers.value[0]?.name ?? DEFAULT_SERVER
    form.hosts = ''
    form.paths = ''
    form.to = ''
    form.statusCode = '302'
  }
}

watch(open, (v) => {
  if (v) reset()
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.to.trim()) errors.to = 'A destination URL is required.'
  if (!toList(form.hosts).length && !toList(form.paths).length)
    errors.hosts = 'Provide at least a host or a path to match.'
  return Object.keys(errors).length === 0
}

async function submit() {
  if (!validate()) return
  const route = buildRedirectRoute({
    id: props.edit?.raw['@id'],
    hosts: toList(form.hosts),
    paths: toList(form.paths),
    to: form.to.trim(),
    statusCode: Number(form.statusCode),
  })
  try {
    if (props.edit) {
      await updateRoute(props.edit.serverName, props.edit.index, route)
      toast.success('Redirect updated')
    } else {
      await addRoute(route, form.serverName)
      toast.success('Redirect created')
    }
    open.value = false
    emit('saved')
  } catch (e: any) {
    toast.error('Failed to save redirect', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Edit Redirect' : 'New Redirect' }}</DialogTitle>
        <DialogDescription
          >Send matched requests to another URL with an HTTP redirect.</DialogDescription
        >
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Host(s)" hint="Comma separated" :error="errors.hosts">
            <Input v-model="form.hosts" placeholder="old.example.com" />
          </FormField>
          <FormField label="Path(s)" hint="Optional">
            <Input v-model="form.paths" placeholder="/old/*" />
          </FormField>
        </div>

        <FormField label="Redirect to" :error="errors.to">
          <Input v-model="form.to" placeholder="https://new.example.com{http.request.uri}" />
        </FormField>

        <FormField label="Status code">
          <Select v-model="form.statusCode">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="s in STATUS" :key="s" :value="s">{{ s }}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

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
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create redirect' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
