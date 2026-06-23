<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import type { RouteKind } from '@/lib/caddy/types'

const props = defineProps<{ kind: RouteKind }>()

const map: Record<
  RouteKind,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'warning' | 'success' }
> = {
  gateway: { label: 'API Gateway', variant: 'default' },
  site: { label: 'Static Site', variant: 'success' },
  redirect: { label: 'Redirect', variant: 'warning' },
  static: { label: 'Static Response', variant: 'secondary' },
  other: { label: 'Other', variant: 'outline' },
}

const meta = computed(() => map[props.kind] ?? map.other)
</script>

<template>
  <Badge :variant="meta.variant">{{ meta.label }}</Badge>
</template>
