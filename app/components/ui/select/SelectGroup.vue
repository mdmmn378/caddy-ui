<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SelectGroup, type SelectGroupProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<SelectGroupProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <SelectGroup data-slot="select-group" v-bind="delegatedProps" :class="cn('p-1', props.class)">
    <slot />
  </SelectGroup>
</template>
