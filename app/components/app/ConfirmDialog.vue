<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const open = defineModel<boolean>('open', { default: false })

defineProps<{
  title?: string
  description?: string
  confirmLabel?: string
  loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title ?? 'Are you sure?' }}</DialogTitle>
        <DialogDescription>
          {{ description ?? 'This action cannot be undone.' }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" :disabled="loading" @click="open = false">Cancel</Button>
        <Button variant="destructive" :disabled="loading" @click="emit('confirm')">
          {{ confirmLabel ?? 'Delete' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
