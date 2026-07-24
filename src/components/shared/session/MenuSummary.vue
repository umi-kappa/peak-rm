<script setup lang="ts">
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'

defineProps<{
  /** セッションに焼き込まれた重量（kg） */
  weight: number
  /** 目標回数 */
  reps: number
  /** セット数 */
  sets: number
}>()
</script>

<template>
  <div class="menu-summary">
    <span class="value">{{ weight }}</span>
    <BaseUnit>KG</BaseUnit>
    <span class="dot">·</span>
    <span class="value">{{ reps }}</span>
    <BaseUnit>REPS</BaseUnit>
    <span class="dot">·</span>
    <span class="value">{{ sets }}</span>
    <BaseUnit>SETS</BaseUnit>
  </div>
</template>

<style scoped>
.menu-summary {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
}

.value {
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
}

.dot {
  color: var(--color-text-tertiary);
}
</style>
