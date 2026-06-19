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
  font-weight: var(--font-weight-regular);
}

.base-unit.caption {
  font-size: var(--font-size-caption);
}

.base-unit.body {
  font-size: var(--font-size-body);
}
</style>
