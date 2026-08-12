<script setup lang="ts">
import { computed } from 'vue'
import { formatDeltaBadge } from '@/core/deltaBadge'
import { formatOneRm } from '@/core/oneRm'
import type { OneRmChartPoint } from '@/core/chartData'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'
import BigNumber from '@/components/shared/ui/typography/BigNumber.vue'
import OneRmChart from '@/components/pages/history/OneRmChart.vue'

const { points, latest, delta } = defineProps<{
  /** 表示区間の点（古い順） */
  points: readonly OneRmChartPoint[]
  /** 表示区間の終点の推定 1RM */
  latest: number
  /** 表示区間の「終点 − 始点」。比較対象が無い（1 点のみ）ときは undefined */
  delta: number | undefined
}>()

const values = computed(() => points.map((point) => point.oneRm))
const latestText = computed(() => formatOneRm(latest))
// 整形は結果確認画面の前回比と共有する（差分の意味は違うが表記は同じ）
const deltaBadge = computed(() => formatDeltaBadge(delta))
const singlePoint = computed(() => points.length === 1)
// 日付軸は区間の両端だけ出す（中間の日付は出さない）
const dayLabels = computed(() => {
  const last = points.at(-1)
  if (!last) return []
  return singlePoint.value ? [last.dayLabel] : [points[0].dayLabel, last.dayLabel]
})
</script>

<template>
  <BaseCard>
    <div class="header">
      <div class="headline">
        <BaseLabel>EST. 1RM</BaseLabel>
        <div class="headline-value">
          <BigNumber :value="latestText" tone="accent" />
          <BaseUnit>KG</BaseUnit>
        </div>
      </div>

      <!-- 区間ラベルと前回比は比較対象があるときだけ。結果確認画面と違いピル枠は付けない -->
      <div v-if="deltaBadge" class="range">
        <BaseLabel>LAST {{ points.length }} SESSIONS</BaseLabel>
        <div class="delta-line">
          <BaseIcon v-if="deltaBadge.icon" :name="deltaBadge.icon" :size="12" />
          <span class="delta">{{ deltaBadge.text }}</span>
          <BaseUnit>KG</BaseUnit>
        </div>
      </div>
    </div>

    <div class="chart">
      <OneRmChart :values />
      <div class="days" :class="{ single: singlePoint }">
        <span v-for="label in dayLabels" :key="label" class="day">{{ label }}</span>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.headline {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.headline-value {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
}

.range {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-4);
}

/* 矢印アイコンを挟むため、値と単位の baseline 揃えではなく上下中央で並べる */
.delta-line {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* アクセントで立てるのはカードの主役である Est. 1RM のヘッドラインだけで、
   その補足である区間の差分は本文の色に留める（結果確認画面の前回比と同じ扱い） */
.delta {
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
}

.chart {
  display: flex;
  flex-direction: column;
}

.days {
  display: flex;
  justify-content: space-between;

  /* 点が 1 つのときはグラフ側も中央に描くため、日付も中央へ寄せる */
  &.single {
    justify-content: center;
  }
}

.day {
  color: var(--color-text-tertiary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
}
</style>
