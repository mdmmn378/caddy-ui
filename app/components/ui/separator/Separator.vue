<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Separator, type SeparatorProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<SeparatorProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <Separator
    v-bind="delegatedProps"
    data-slot="separator"
    :class="
      cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        props.class,
      )
    "
  />
</template>
