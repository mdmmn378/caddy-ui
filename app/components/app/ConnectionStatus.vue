<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const { connected, loading, error, lastSyncedAt, refresh } = useCaddy()

onMounted(() => {
  if (!lastSyncedAt.value) refresh()
})

const label = computed(() => {
  if (loading.value) return 'Connecting…'
  return connected.value ? 'Connected' : 'Disconnected'
})
</script>

<template>
  <div class="flex items-center gap-2">
    <Badge :variant="connected ? 'success' : error ? 'destructive' : 'secondary'" class="gap-1.5">
      <span
        class="size-1.5 rounded-full"
        :class="connected ? 'bg-emerald-500' : 'bg-muted-foreground'"
      />
      {{ label }}
    </Badge>
    <Button variant="ghost" size="icon" :disabled="loading" title="Refresh config" @click="refresh">
      <RefreshCw class="size-4" :class="loading ? 'animate-spin' : ''" />
    </Button>
  </div>
</template>
