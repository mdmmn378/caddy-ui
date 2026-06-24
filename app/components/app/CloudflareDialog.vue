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
import { Alert, AlertDescription } from '@/components/ui/alert'
import FormField from '@/components/app/FormField.vue'
import {
  buildCloudflarePolicy,
  dnsProviderOf,
  isEnvPlaceholder,
  toList,
} from '@/lib/caddy/builders'
import type { TlsPolicySummary } from '@/lib/caddy/types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ edit?: TlsPolicySummary | null }>()
const emit = defineEmits<{ saved: [] }>()

const { upsertTlsPolicy, saving } = useCaddy()

const form = reactive({
  subjects: '',
  token: '',
  useEnv: false,
  resolvers: '1.1.1.1',
})
const errors = reactive<Record<string, string>>({})
const isEdit = computed(() => !!props.edit)

function reset() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (props.edit) {
    const p = props.edit
    const provider = dnsProviderOf(p.raw)
    const token = provider?.api_token ?? ''
    form.subjects = p.subjects.join('\n')
    form.useEnv = isEnvPlaceholder(token)
    // For an {env.NAME} placeholder, edit just the NAME; otherwise the literal.
    form.token = form.useEnv ? token.replace(/^\{env\.(.+)\}$/, '$1') : token
    form.resolvers = p.resolvers.join(', ') || '1.1.1.1'
  } else {
    form.subjects = ''
    form.token = ''
    form.useEnv = false
    form.resolvers = '1.1.1.1'
  }
}

watch(open, (v) => {
  if (v) reset()
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.token.trim()) {
    errors.token = form.useEnv
      ? 'An environment variable name is required.'
      : 'An API token is required.'
  }
  return Object.keys(errors).length === 0
}

async function submit() {
  if (!validate()) return
  const apiToken = form.useEnv ? `{env.${form.token.trim()}}` : form.token.trim()
  const policy = buildCloudflarePolicy({
    subjects: toList(form.subjects),
    apiToken,
    resolvers: toList(form.resolvers),
  })
  try {
    await upsertTlsPolicy(props.edit ? props.edit.index : null, policy)
    toast.success(isEdit.value ? 'Cloudflare policy updated' : 'Cloudflare policy added')
    open.value = false
    emit('saved')
  } catch (e: any) {
    toast.error('Failed to save policy', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Edit Cloudflare DNS' : 'Add Cloudflare DNS' }}</DialogTitle>
        <DialogDescription>
          Obtain certificates via the ACME DNS-01 challenge using a Cloudflare API token — needed
          for wildcard certs or when ports 80/443 aren't publicly reachable.
        </DialogDescription>
      </DialogHeader>

      <Alert class="mb-1">
        <AlertDescription>
          Requires Caddy built with the
          <code class="font-mono text-xs">caddy-dns/cloudflare</code> plugin. Use a Cloudflare API
          token scoped to <strong>Zone → DNS → Edit</strong> for your zones.
        </AlertDescription>
      </Alert>

      <div class="grid gap-4 py-2">
        <FormField
          label="Domains (subjects)"
          hint="One per line or comma separated. Empty = apply to all certificates. e.g. *.example.com, example.com"
        >
          <Textarea v-model="form.subjects" rows="3" placeholder="*.example.com&#10;example.com" />
        </FormField>

        <div class="flex items-center justify-between rounded-lg border p-3">
          <div class="space-y-0.5">
            <div class="text-sm font-medium">Read token from environment</div>
            <div class="text-muted-foreground text-xs">
              Store <code class="font-mono">{env.NAME}</code> instead of the literal token.
            </div>
          </div>
          <Switch v-model="form.useEnv" />
        </div>

        <FormField
          :label="form.useEnv ? 'Environment variable name' : 'Cloudflare API token'"
          :error="errors.token"
          :hint="
            form.useEnv
              ? 'Caddy reads the token from this env var at runtime.'
              : 'Stored in the Caddy config. Visible on the Raw Config page.'
          "
        >
          <Input
            v-model="form.token"
            :type="form.useEnv ? 'text' : 'password'"
            :placeholder="form.useEnv ? 'CLOUDFLARE_API_TOKEN' : 'token value'"
            autocomplete="off"
          />
        </FormField>

        <FormField
          label="Resolvers"
          hint="DNS resolvers used to verify propagation. Comma separated."
        >
          <Input v-model="form.resolvers" placeholder="1.1.1.1" />
        </FormField>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="open = false">Cancel</Button>
        <Button :disabled="saving" @click="submit">
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add policy' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
