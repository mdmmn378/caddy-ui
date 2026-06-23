<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { type BadgeVariants, badgeVariants } from '.'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<PrimitiveProps & { variant?: BadgeVariants['variant']; class?: HTMLAttributes['class'] }>(),
  { as: 'span' },
)
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    data-slot="badge"
    :class="cn(badgeVariants({ variant }), props.class)"
  >
    <slot />
  </Primitive>
</template>
