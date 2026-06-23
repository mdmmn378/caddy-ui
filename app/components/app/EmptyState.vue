<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icon?: Component; title: string; description?: string }>()
</script>

<template>
  <div
    class="border-border flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center"
  >
    <div
      v-if="icon"
      class="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full"
    >
      <component :is="icon" class="size-6" />
    </div>
    <h3 class="text-base font-medium">{{ title }}</h3>
    <p v-if="description" class="text-muted-foreground mt-1 max-w-sm text-sm">{{ description }}</p>
    <div class="mt-5">
      <slot />
    </div>
  </div>
</template>
