<script setup lang="ts">
import { EXERCISE_LABELS, EXERCISE_ORDER } from '@/core/constants'
import type { Exercise } from '@/core/types'

const model = defineModel<Exercise>({ required: true })

function select(exercise: Exercise) {
  model.value = exercise
}
</script>

<template>
  <div class="exercise-tabs" role="group" aria-label="Exercise">
    <button
      v-for="exercise in EXERCISE_ORDER"
      :key="exercise"
      type="button"
      class="tab"
      :class="{ active: exercise === model }"
      :aria-current="exercise === model"
      @click="select(exercise)"
    >
      {{ EXERCISE_LABELS[exercise] }}
    </button>
  </div>
</template>

<style scoped>
/* 面のトークンは BaseCard と同じだが、BaseCard は padding 16 を内包するため使わない
   （タブ枠の内側は 4。呼び出し側から padding を打ち消す方が読みにくくなる） */
.exercise-tabs {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-light);
  border: 1px solid var(--color-line-dark);
  border-radius: var(--radius);
}

/* padding は最長ラベル BENCH PRESS が 3 分割幅に 1 行で収まる上限として 8px。
   狭幅・フォント拡大時は折り返して縦に伸びる（横スクロールにはしない） */
.tab {
  flex: 1;
  padding: var(--space-8);
  border: 0;
  border-radius: var(--radius);
  background: none;
  color: var(--color-text-tertiary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-regular);
  /* <button> の UA 既定に頼らず明示する（global.css の button リセットは text-align を触らない） */
  text-align: center;
  transition:
    background-color var(--transition),
    color var(--transition);

  &.active {
    background: var(--color-text);
    color: var(--color-bg);
    font-weight: var(--font-weight-bold);
  }

  /* hover は未選択タブのみ。選択中はタップしても状態が変わらないため反応させない。
     背景・文字色の変化はタブ枠と同じ面に乗る IconButton / NumberStepper に揃える */
  @media (hover: hover) {
    &:not(.active):hover {
      background: var(--color-line);
      color: var(--color-text);
    }
  }

  /* 押下中のフィードバック。hover を持たない端末にも出すため media の外に置く
     （`.active` = 選択中のクラス、`:active` = 押下中の擬似クラス） */
  &:not(.active):active {
    background: var(--color-line);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
}
</style>
