<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const colorMode = useColorMode()

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <ClientOnly>
    <Button variant="ghost" size="icon" title="Toggle theme" @click="toggle">
      <Sun v-if="colorMode.value === 'dark'" class="size-4" />
      <Moon v-else class="size-4" />
    </Button>
    <template #fallback>
      <Button variant="ghost" size="icon" disabled>
        <Sun class="size-4" />
      </Button>
    </template>
  </ClientOnly>
</template>
