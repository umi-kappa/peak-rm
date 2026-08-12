<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  buildChartData,
  buildChartOptions,
  chartPlugins,
} from '@/components/pages/history/OneRmChart.logic'

const { values } = defineProps<{
  /** 古い順（グラフの左 → 右）に並べた推定 1RM。両端が区間の始点と終点になる */
  values: readonly number[]
}>()

const singlePoint = computed(() => values.length === 1)
const data = computed(() => buildChartData(values))
// 点数そのものではなく「1 点か」だけに依存させ、点の入れ替わりで options を作り直さない
const options = computed(() => buildChartOptions(singlePoint.value))
</script>

<template>
  <div class="one-rm-chart">
    <!-- vue-chartjs は canvas に role="img" を付けるため、名前を渡さないと名前無しの画像になる -->
    <Line :data :options :plugins="chartPlugins" aria-label="Est. 1RM trend" />
  </div>
</template>

<style scoped>
/* Chart.js の responsive は親の高さに追従するため、高さを持つ position: relative の器を用意する。
   118px はデザイン正本の chart card の高さ（余白トークンの対象外の外形寸法）。
   OneRmChart.logic.ts の CHART_PADDING / BASELINE_OFFSET はこの高さを前提に配分しているので、
   高さを変えるならあちらも合わせて直す */
.one-rm-chart {
  position: relative;
  height: 118px;
}
</style>
