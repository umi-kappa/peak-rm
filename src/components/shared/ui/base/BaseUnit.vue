<script setup lang="ts">
const { size = 'caption' } = defineProps<{ size?: 'caption' | 'body' }>()
</script>

<template>
  <span class="base-unit" :class="size"><slot /></span>
</template>

<style scoped>
.base-unit {
  color: var(--color-text-tertiary);
  font-family: var(--font-family-mono);
  /* body の既定と同値だが、bold な数値の内側に置かれる使い方があるため打ち消しとして明示する（conventions「font-weight の使い分け」） */
  font-weight: var(--font-weight-regular);

  &.caption {
    font-size: var(--font-size-caption);
  }

  &.body {
    font-size: var(--font-size-body);
  }
}
</style>
