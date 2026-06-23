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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import FormField from '@/components/app/FormField.vue'
import { buildSiteRoute, findHandler, toList } from '@/lib/caddy/builders'
import type { RouteSummary, FileServerHandler } from '@/lib/caddy/types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ edit?: RouteSummary | null }>()
const emit = defineEmits<{ saved: [] }>()

const { addRoute, updateRoute, servers, saving, DEFAULT_SERVER } = useCaddy()

const form = reactive({
  serverName: DEFAULT_SERVER,
  hosts: '',
  paths: '',
  root: '/var/www/html',
  indexNames: 'index.html',
  browse: false,
  compression: true,
})

const errors = reactive<Record<string, string>>({})
const isEdit = computed(() => !!props.edit)

function reset() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (props.edit) {
    const r = props.edit.raw
    const fs = findHandler<FileServerHandler>(r, 'file_server')
    form.serverName = props.edit.serverName
    form.hosts = props.edit.hosts.join(', ')
    form.paths = props.edit.paths.join(', ')
    form.root = fs?.root ?? ''
    form.indexNames = (fs?.index_names ?? []).join(', ')
    form.browse = !!fs?.browse
    form.compression = !!findHandler(r, 'encode')
  } else {
    form.serverName = servers.value[0]?.name ?? DEFAULT_SERVER
    form.hosts = ''
    form.paths = ''
    form.root = '/var/www/html'
    form.indexNames = 'index.html'
    form.browse = false
    form.compression = true
  }
}

watch(open, (v) => {
  if (v) reset()
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.root.trim()) errors.root = 'A site root directory is required.'
  if (!toList(form.hosts).length && !toList(form.paths).length)
    errors.hosts = 'Provide at least a host or a path to match.'
  return Object.keys(errors).length === 0
}

async function submit() {
  if (!validate()) return
  const route = buildSiteRoute({
    id: props.edit?.raw['@id'],
    hosts: toList(form.hosts),
    paths: toList(form.paths),
    root: form.root.trim(),
    indexNames: toList(form.indexNames),
    browse: form.browse,
    compression: form.compression,
  })
  try {
    if (props.edit) {
      await updateRoute(props.edit.serverName, props.edit.index, route)
      toast.success('Site updated')
    } else {
      await addRoute(route, form.serverName)
      toast.success('Site created')
    }
    open.value = false
    emit('saved')
  } catch (e: any) {
    toast.error('Failed to save site', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Edit Static Site' : 'New Static Site' }}</DialogTitle>
        <DialogDescription>
          Serve files from a directory on disk for the matched host and path.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Host(s)"
            hint="Comma separated. Empty = any host."
            :error="errors.hosts"
          >
            <Input v-model="form.hosts" placeholder="example.com, www.example.com" />
          </FormField>
          <FormField label="Path(s)" hint="Optional. e.g. /docs/*">
            <Input v-model="form.paths" placeholder="" />
          </FormField>
        </div>

        <FormField label="Root directory" :error="errors.root">
          <Input v-model="form.root" placeholder="/var/www/html" />
        </FormField>

        <FormField label="Index files" hint="Comma separated">
          <Input v-model="form.indexNames" placeholder="index.html, index.htm" />
        </FormField>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div class="text-sm font-medium">Directory browsing</div>
            <Switch v-model="form.browse" />
          </div>
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div class="text-sm font-medium">Compression</div>
            <Switch v-model="form.compression" />
          </div>
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
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create site' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
