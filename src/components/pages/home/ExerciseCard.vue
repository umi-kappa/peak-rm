<script setup lang="ts">
import { computed } from 'vue'
import type { Exercise, Session } from '@/core/types'
import { EXERCISE_LABELS } from '@/core/constants'
import { formatOneRm, hasOneRm } from '@/core/oneRm'
import { formatSetReps, sessionMaxOneRm } from '@/core/session'
import CardButton from '@/components/shared/ui/buttons/CardButton.vue'
import BigNumber from '@/components/shared/ui/typography/BigNumber.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'

const { exercise, session } = defineProps<{
  exercise: Exercise
  /** 直前セッション。undefined は未記録（初回 / データクリア直後） */
  session?: Session
}>()

const oneRm = computed(() => (session ? sessionMaxOneRm(session) : 0))
// 算出できないときの `—` は formatOneRm が返す。数値と同じ重みで並ばないよう階調も落とす
const oneRmTone = computed(() => (hasOneRm(oneRm.value) ? 'accent' : 'tertiary'))
const oneRmText = computed(() => formatOneRm(oneRm.value))
const reps = computed(() => (session ? formatSetReps(session) : ''))
</script>

<template>
  <CardButton :to="{ name: 'menu', params: { exercise } }">
    <div class="exercise-card">
      <span class="title">{{ EXERCISE_LABELS[exercise] }}</span>
      <div class="data">
        <div class="est">
          <BaseLabel>EST. 1RM</BaseLabel>
          <div class="est-value">
            <BigNumber :value="oneRmText" size="stat" :tone="oneRmTone" />
            <BaseUnit>KG</BaseUnit>
          </div>
        </div>
        <div class="last">
          <BaseLabel>LAST</BaseLabel>
          <template v-if="session">
            <div class="last-weight">
              <span class="weight">{{ session.menu.weight }}</span>
              <BaseUnit>KG</BaseUnit>
            </div>
            <div class="last-reps">
              <span class="reps">{{ reps }}</span>
              <BaseUnit>REPS</BaseUnit>
            </div>
          </template>
          <BaseUnit v-else>NO LOG</BaseUnit>
        </div>
      </div>
    </div>
  </CardButton>
</template>

<style scoped>
.exercise-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  line-height: var(--line-height-tight);
}

.title {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
}

.data {
  display: flex;
  gap: var(--space-16);
}

.est {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.est-value {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
}

.last {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-4);
}

.last-weight,
.last-reps {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
}

/* LAST 列はカード内に他の数値が無く単独で読ませるため、履歴一覧の行内の重量（regular）と違い bold にする */
.weight {
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
}

.reps {
  color: var(--color-text-tertiary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
  /* 折り返しうるのでルートの tight ではなく既定の行間（conventions「line-height の使い分け」） */
  line-height: var(--line-height);
  text-align: right;
  word-break: break-word;
}
</style>
