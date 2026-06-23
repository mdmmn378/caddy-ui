<script setup lang="ts">
import type { Component } from 'vue'
import { Card, CardContent } from '@/components/ui/card'

defineProps<{ label: string; value: string | number; icon?: Component; hint?: string }>()
</script>

<template>
  <Card>
    <CardContent class="flex items-center gap-4">
      <div
        v-if="icon"
        class="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg"
      >
        <component :is="icon" class="size-5" />
      </div>
      <div class="min-w-0">
        <div class="text-2xl font-semibold tabular-nums">{{ value }}</div>
        <div class="text-muted-foreground truncate text-sm">{{ label }}</div>
        <div v-if="hint" class="text-muted-foreground/80 truncate text-xs">{{ hint }}</div>
      </div>
    </CardContent>
  </Card>
</template>
