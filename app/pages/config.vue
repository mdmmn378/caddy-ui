<script setup lang="ts">
import { Save, RotateCcw, WandSparkles, Copy } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PageHeader from '@/components/app/PageHeader.vue'
import type { CaddyConfig } from '@/lib/caddy/types'

const { config, save, refresh, saving, lastSyncedAt } = useCaddy()

const text = ref('')
const parseError = ref<string | null>(null)

function load() {
  text.value = JSON.stringify(config.value ?? { apps: { http: { servers: {} } } }, null, 2)
  parseError.value = null
}

onMounted(() => {
  if (!lastSyncedAt.value) refresh().then(load)
  else load()
})
watch(config, load)

const dirty = computed(() => {
  const current = JSON.stringify(config.value ?? {}, null, 2)
  return text.value.trim() !== current.trim()
})

function parse(): CaddyConfig | null {
  try {
    const parsed = JSON.parse(text.value)
    parseError.value = null
    return parsed
  } catch (e: any) {
    parseError.value = e?.message ?? 'Invalid JSON'
    return null
  }
}

function format() {
  const parsed = parse()
  if (parsed) text.value = JSON.stringify(parsed, null, 2)
}

async function copy() {
  await navigator.clipboard.writeText(text.value)
  toast.success('Config copied to clipboard')
}

async function apply() {
  const parsed = parse()
  if (!parsed) {
    toast.error('Cannot apply: invalid JSON')
    return
  }
  try {
    await save(parsed)
    toast.success('Configuration applied')
  } catch (e: any) {
    toast.error('Caddy rejected the config', { description: e?.data?.error || e?.message })
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Raw Config"
      description="The full Caddy JSON config. Edits are applied atomically via POST /load."
    >
      <template #actions>
        <Button variant="ghost" size="icon" title="Copy" @click="copy"
          ><Copy class="size-4"
        /></Button>
        <Button variant="outline" @click="format"><WandSparkles class="size-4" /> Format</Button>
        <Button variant="outline" :disabled="!dirty" @click="load"
          ><RotateCcw class="size-4" /> Revert</Button
        >
        <Button :disabled="saving || !dirty || !!parseError" @click="apply">
          <Save class="size-4" />
          {{ saving ? 'Applying…' : 'Apply' }}
        </Button>
      </template>
    </PageHeader>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          Configuration JSON
          <span v-if="dirty" class="text-amber-600 dark:text-amber-400 text-xs font-normal"
            >• unsaved changes</span
          >
        </CardTitle>
        <CardDescription>
          Be careful — applying replaces the entire running configuration.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <Alert v-if="parseError" variant="destructive">
          <AlertDescription>JSON parse error: {{ parseError }}</AlertDescription>
        </Alert>
        <textarea
          v-model="text"
          spellcheck="false"
          class="border-input bg-muted/30 focus-visible:ring-ring/50 h-[60vh] w-full resize-y rounded-md border p-4 font-mono text-xs leading-relaxed outline-none focus-visible:ring-[3px]"
          @input="parse"
        />
      </CardContent>
    </Card>
  </div>
</template>
