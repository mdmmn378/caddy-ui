<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster rich-colors close-button />
  </div>
</template>
