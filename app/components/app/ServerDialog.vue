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
import FormField from '@/components/app/FormField.vue'
import { toList } from '@/lib/caddy/builders'
import type { ServerSummary } from '@/lib/caddy/types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ edit?: ServerSummary | null }>()
const emit = defineEmits<{ saved: [] }>()

const { upsertServer, saving } = useCaddy()

const form = reactive({ name: '', listen: ':443' })
const errors = reactive<Record<string, string>>({})
const isEdit = computed(() => !!props.edit)

function reset() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (props.edit) {
    form.name = props.edit.name
    form.listen = props.edit.listen.join(', ')
  } else {
    form.name = ''
    form.listen = ':443'
  }
}

watch(open, (v) => {
  if (v) reset()
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) errors.name = 'A server name is required.'
  if (!/^[\w-]+$/.test(form.name.trim())) errors.name = 'Use letters, numbers, - or _ only.'
  if (!toList(form.listen).length) errors.listen = 'At least one listen address is required.'
  return Object.keys(errors).length === 0
}

async function submit() {
  if (!validate()) return
  try {
    await upsertServer(form.name.trim(), toList(form.listen))
    toast.success(isEdit.value ? 'Server updated' : 'Server created')
    open.value = false
    emit('saved')
  } catch (e: any) {
    toast.error('Failed to save server', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Edit Server' : 'New Server' }}</DialogTitle>
        <DialogDescription>
          A server binds one or more listen addresses and holds a list of routes.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <FormField label="Name" :error="errors.name" hint="Identifier within apps.http.servers">
          <Input v-model="form.name" :disabled="isEdit" placeholder="srv0" />
        </FormField>
        <FormField
          label="Listen addresses"
          :error="errors.listen"
          hint="Comma separated. e.g. :443, :80"
        >
          <Input v-model="form.listen" placeholder=":443" />
        </FormField>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="open = false">Cancel</Button>
        <Button :disabled="saving" @click="submit">
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create server' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
