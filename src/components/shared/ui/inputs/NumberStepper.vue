<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'
import { clamp } from '@/core/stepper'
import { useNumberStepper } from '@/composables/shared/ui/inputs/useNumberStepper'

const model = defineModel<number>('value', { required: true })

const {
  large = false,
  step = 1,
  min,
  max,
  unit,
  accent = false,
} = defineProps<{
  large?: boolean
  step?: number
  min?: number
  max?: number
  unit?: string
  accent?: boolean
}>()

const options = computed(() => ({ step, min, max }))
const iconSize = computed(() => (large ? 24 : 16))

const { startIncrement, startDecrement, stop } = useNumberStepper(model, options)

// 範囲外の初期値・外部更新を min / max 内へ丸める
watchEffect(() => {
  const clamped = clamp(model.value, min, max)
  if (clamped !== model.value) model.value = clamped
})
</script>

<template>
  <div class="number-stepper" :class="{ large }">
    <button
      class="button"
      type="button"
      aria-label="Decrease"
      @pointerdown="startDecrement"
      @pointerup="stop"
      @pointercancel="stop"
    >
      <BaseIcon name="minus" :size="iconSize" />
    </button>
    <div class="value" :class="{ accent }">
      {{ model }}<BaseUnit v-if="unit">{{ unit }}</BaseUnit>
    </div>
    <button
      class="button"
      type="button"
      aria-label="Increase"
      @pointerdown="startIncrement"
      @pointerup="stop"
      @pointercancel="stop"
    >
      <BaseIcon name="plus" :size="iconSize" />
    </button>
  </div>
</template>

<style scoped>
.number-stepper {
  display: flex;
  align-items: center;
  /* ボタンを両端に固定し、値の桁数が変わってもボタン位置が動かないようにする */
  justify-content: space-between;
  width: 100%;
  gap: var(--space-12);
}

.number-stepper.large {
  gap: var(--space-16);
}

.button {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  border: 1px solid var(--color-line);
  background: var(--color-bg-light);
  color: var(--color-text);
  /* 長押しリピート操作を妨げるブラウザ標準動作（ダブルタップズーム・テキスト選択・iOS のコールアウト）を抑止 */
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  transition: background-color var(--transition);
}

@media (hover: hover) {
  .button:hover {
    background: var(--color-line);
  }
}

.button:active {
  background: var(--color-line);
}

.value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-8);
  color: var(--color-text);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-title);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
}

.number-stepper.large .value {
  font-size: var(--font-size-stat);
}

.value.accent {
  color: var(--color-accent);
}
</style>
