<script setup lang="ts">
import type { WorksheetType } from '~/types/worksheet'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

const { data: worksheet } = await useAsyncData(
  () => `worksheet-${slug.value}`,
  () => queryCollection('worksheets')
    .where('path', 'LIKE', `%/${slug.value}`)
    .first(),
  { watch: [slug] },
)

if (!worksheet.value) {
  throw createError({ statusCode: 404, statusMessage: 'Worksheet not found' })
}

const component = computed(() => {
  switch (worksheet.value!.type as WorksheetType) {
    case 'color': return resolveComponent('WorksheetsColorRecognition')
    case 'sequence': return resolveComponent('WorksheetsSequenceFruits')
    case 'move': return resolveComponent('WorksheetsMoveBunny')
    case 'maze': return resolveComponent('WorksheetsBunnyMaze')
    case 'loop': return resolveComponent('WorksheetsLoopDance')
    default: return null
  }
})

useHead({
  title: () => `${worksheet.value?.title?.en ?? 'Worksheet'} · NowWeKnow`,
})
</script>

<template>
  <div class="play">
    <component
      :is="component"
      v-if="component && worksheet"
      :worksheet="worksheet"
    />
  </div>
</template>

<style scoped>
.play {
  min-height: 100dvh;
}
</style>
