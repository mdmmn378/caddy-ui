<script setup lang="ts">
import { TooltipTrigger, type TooltipTriggerProps, useForwardProps } from 'reka-ui'

const props = defineProps<TooltipTriggerProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <TooltipTrigger data-slot="tooltip-trigger" v-bind="forwarded">
    <slot />
  </TooltipTrigger>
</template>
