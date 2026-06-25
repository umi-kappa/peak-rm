<script setup lang="ts">
import type { Exercise } from '@/core/types'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import CardButton from '@/components/shared/ui/buttons/CardButton.vue'

// 足場用の最小スタブ。種目カードの中身（推定 1RM・前回値など）は後続 Issue が肉付けする。
const exercises: { exercise: Exercise; label: string }[] = [
  { exercise: 'benchPress', label: 'Bench Press' },
  { exercise: 'squat', label: 'Squat' },
  { exercise: 'deadlift', label: 'Deadlift' },
]
</script>

<template>
  <ScreenFrame>
    <h1 class="brand">PeakRM</h1>
    <CardButton
      v-for="e in exercises"
      :key="e.exercise"
      :to="{ name: 'menu', params: { exercise: e.exercise } }"
    >
      {{ e.label }}
    </CardButton>
    <CardButton :to="{ name: 'history' }" border="line">History</CardButton>
    <CardButton :to="{ name: 'settings' }" border="line">Settings</CardButton>
  </ScreenFrame>
</template>

<style scoped>
.brand {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
}
</style>
