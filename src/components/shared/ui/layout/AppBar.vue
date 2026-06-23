<script setup lang="ts">
import IconButton from '@/components/shared/ui/buttons/IconButton.vue'

const { back = true } = defineProps<{
  title: string
  back?: boolean
}>()

const emit = defineEmits<{
  back: []
}>()

function onBack() {
  emit('back')
}
</script>

<template>
  <header class="app-bar">
    <div class="lead">
      <IconButton v-if="back" name="chevron-left" label="Back" @click="onBack" />
      <h1 class="title">{{ title }}</h1>
    </div>
    <slot name="action" />
  </header>
</template>

<style scoped>
.app-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 48px;
  padding-inline: var(--space-8);
}

.lead {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.title {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
}
</style>
