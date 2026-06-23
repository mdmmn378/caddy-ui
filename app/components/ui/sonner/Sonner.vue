<script setup lang="ts">
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'
import { useColorMode } from '#imports'

const props = defineProps<ToasterProps>()
const colorMode = useColorMode()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :theme="colorMode.value as ToasterProps['theme']"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
    }"
  />
</template>
