<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** ボタンに表示する補助ラベル。空文字なら非表示 */
    label?: string
    /** クリックごとの増分 */
    step?: number
  }>(),
  {
    label: '',
    step: 1,
  },
)

const count = ref(0)

function increment() {
  count.value += props.step
}
</script>

<template>
  <button class="button" type="button" @click="increment">
    <span v-if="label" class="label">{{ label }}</span>
    <span class="count">{{ count }}</span>
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 64px;
  padding: 12px 20px;
  background: #141416;
  color: #f4f1ea;
  border: 1px solid #2a2a2e;
  border-radius: 4px;
  cursor: pointer;
}

.label {
  font-family:
    system-ui,
    -apple-system,
    'Noto Sans JP',
    sans-serif;
  font-size: 14px;
  font-weight: 500;
}

.count {
  font-family: ui-monospace, 'Roboto Mono', Menlo, monospace;
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.button:hover {
  border-color: #22e8ff;
  color: #22e8ff;
}
</style>
