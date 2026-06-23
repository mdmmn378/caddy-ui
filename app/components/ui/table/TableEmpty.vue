<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class']; colspan?: number }>(), {
  colspan: 1,
})
</script>

<template>
  <tr>
    <td :colspan="props.colspan" :class="cn('p-4 text-center align-middle', props.class)">
      <div class="text-muted-foreground flex items-center justify-center py-8 text-sm">
        <slot />
      </div>
    </td>
  </tr>
</template>
