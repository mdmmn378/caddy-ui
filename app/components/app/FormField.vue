<script setup lang="ts">
defineProps<{ label: string; hint?: string; error?: string; for?: string }>()
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="$props.for" class="text-sm leading-none font-medium select-none">
      {{ label }}
    </label>
    <slot />
    <p v-if="error" class="text-destructive text-xs">{{ error }}</p>
    <p v-else-if="hint" class="text-muted-foreground text-xs">{{ hint }}</p>
  </div>
</template>
