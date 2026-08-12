import {
  CategoryScale,
  Chart,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
} from 'chart.js'
import type { ChartData, ChartOptions, Plugin } from 'chart.js'

import { formatOneRm } from '@/core/oneRm'

// 使う要素だけを登録する（chart.js/auto は全 controller / scale を引き込むため使わない）。
// モジュールスコープで 1 度だけ実行したいので <script setup> ではなくこの .logic.ts に置く
Chart.register(CategoryScale, LineController, LineElement, LinearScale, PointElement)

/** 点と折れ線の寸法（デザイン正本の chart card）。両端の点だけ半径を大きくして区間の端を示す */
const POINT_RADIUS = 2.5
const EDGE_POINT_RADIUS = 3.5
const POINT_BORDER_WIDTH = 1.5
const LINE_WIDTH = 2

/** baseline・破線ヘルパーの線幅と、ヘルパーの破線パターン */
const GUIDE_LINE_WIDTH = 1
const HELPER_DASH = [2, 3]

/**
 * 点を打つ領域の内側の余白（px）。canvas には軸も目盛も無いため、
 * 上は両端の値テキスト、下は baseline とその下の余白、左右は点の半径を逃がす分だけ取る。
 * OneRmChart.vue の高さ 118 に対して点の帯が 52 になり、デザイン正本の chart card と同じ比率になる。
 */
const CHART_PADDING = { top: 32, right: 6, bottom: 34, left: 6 }

/** baseline は最下点のさらに下に引く（デザイン正本の chart card と同じ間隔） */
const BASELINE_OFFSET = 17

/** 点の中心から、その上に置く値テキストのベースラインまでの距離（px） */
const EDGE_VALUE_GAP = 10

function resolveChartTokens() {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string) => style.getPropertyValue(name).trim()
  // rem のフォントサイズを canvas 用の px へ直す（html の font-size 62.5% と
  // ブラウザのフォントサイズ設定の両方を反映させる）
  const valueFontSize =
    Number.parseFloat(read('--font-size-body')) * Number.parseFloat(style.fontSize)
  return {
    accent: read('--color-accent'),
    bg: read('--color-bg'),
    text: read('--color-text'),
    line: read('--color-line'),
    lineDark: read('--color-line-dark'),
    valueFont: `${read('--font-weight-bold')} ${valueFontSize}px ${read('--font-family-mono')}`,
  }
}

let resolvedTokens: ReturnType<typeof resolveChartTokens> | undefined

/**
 * canvas は CSS を解釈しないため、描画に要るトークンを描画前に解決する。
 * 値の単一ソースは tokens.css のまま保ち、色・フォントをこのファイルに直書きしない。
 * getComputedStyle は同期のスタイル再計算を伴うのに対し、このアプリはテーマ切り替えを
 * 持たず値が実行中に変わらないため、初回の解決結果を使い回す。
 */
function chartTokens() {
  return (resolvedTokens ??= resolveChartTokens())
}

/** 1px の線を画素の境界に載せてにじませない（canvas は座標が画素の中心を指すため 0.5 ずらす） */
function crisp(position: number): number {
  return Math.round(position) + 0.5
}

/** 両端だけ別の値を割り当てた点ごとの配列（1 点のときは唯一の点が両端を兼ねる） */
function byEdge<T>(count: number, edge: T, middle: T): T[] {
  return Array.from({ length: count }, (_, index) =>
    index === 0 || index === count - 1 ? edge : middle,
  )
}

/** 区間の両端の点。描く対象が無いときは undefined（プラグイン共通の前提） */
function edgePoints(chart: Chart) {
  const points = chart.getDatasetMeta(0).data
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return undefined
  return { first, last, lastIndex: points.length - 1, single: points.length === 1 }
}

function numberAt(chart: Chart, index: number): number | undefined {
  const value = chart.data.datasets[0]?.data[index]
  return typeof value === 'number' ? value : undefined
}

/** 折れ線の下に敷く baseline（1 本のみ・grid や目盛は出さない）と、両端の破線の縦ヘルパー */
const guideLines: Plugin = {
  id: 'oneRmGuideLines',
  beforeDatasetsDraw(chart) {
    const edges = edgePoints(chart)
    if (!edges) return

    const { ctx, chartArea } = chart
    const tokens = chartTokens()
    const baselineY = crisp(chartArea.bottom + BASELINE_OFFSET)

    ctx.save()
    ctx.lineWidth = GUIDE_LINE_WIDTH

    // baseline は点を打つ領域ではなく canvas の幅いっぱいに引く
    ctx.strokeStyle = tokens.line
    ctx.beginPath()
    ctx.moveTo(0, baselineY)
    ctx.lineTo(chart.width, baselineY)
    ctx.stroke()

    // 点が 1 つのときはヘルパーも 1 本（始点と終点が同じ点）
    ctx.strokeStyle = tokens.lineDark
    ctx.setLineDash(HELPER_DASH)
    ctx.beginPath()
    for (const point of edges.single ? [edges.first] : [edges.first, edges.last]) {
      ctx.moveTo(crisp(point.x), chartArea.top)
      ctx.lineTo(crisp(point.x), baselineY)
    }
    ctx.stroke()
    ctx.restore()
  },
}

/**
 * 両端の点の上に値テキストを描く。描くのは両端だけなので
 * chartjs-plugin-datalabels は足さない（依存を増やさない）。
 */
const edgeValues: Plugin = {
  id: 'oneRmEdgeValues',
  afterDatasetsDraw(chart) {
    const edges = edgePoints(chart)
    if (!edges) return

    const { ctx } = chart
    const tokens = chartTokens()

    // 点の真上に中央揃えで置くと両端で描画領域からはみ出すため、始点は左寄せ・終点は右寄せにする。
    // 点が 1 つのときは中央に描くのでその制約が無く、点の真上に置ける
    const labels = edges.single
      ? [{ point: edges.first, index: 0, align: 'center' as const }]
      : [
          { point: edges.first, index: 0, align: 'left' as const },
          { point: edges.last, index: edges.lastIndex, align: 'right' as const },
        ]

    ctx.save()
    ctx.fillStyle = tokens.accent
    ctx.font = tokens.valueFont
    ctx.textBaseline = 'alphabetic'
    for (const { point, index, align } of labels) {
      const value = numberAt(chart, index)
      if (value === undefined) continue
      ctx.textAlign = align
      ctx.fillText(formatOneRm(value), point.x, point.y - EDGE_VALUE_GAP)
    }
    ctx.restore()
  },
}

export const chartPlugins: Plugin[] = [guideLines, edgeValues]

/** 折れ線と点の見た目。両端の点はアクセントで塗り、中間の点は背景色で抜いて枠だけ見せる */
export function buildChartData(values: readonly number[]): ChartData<'line'> {
  const tokens = chartTokens()
  return {
    // 目盛を出さないため、x のラベルは点の並び順を表すだけの内部値
    labels: values.map((_, index) => String(index)),
    datasets: [
      {
        data: [...values],
        borderColor: tokens.accent,
        borderWidth: LINE_WIDTH,
        borderJoinStyle: 'round',
        borderCapStyle: 'round',
        pointRadius: byEdge(values.length, EDGE_POINT_RADIUS, POINT_RADIUS),
        pointBackgroundColor: byEdge(values.length, tokens.accent, tokens.bg),
        pointBorderColor: byEdge(values.length, tokens.bg, tokens.text),
        pointBorderWidth: POINT_BORDER_WIDTH,
      },
    ],
  }
}

/**
 * 軸・凡例・ツールチップ・アニメーションをすべて切った読み取り専用のグラフ設定。
 * 日付ラベルは canvas の外（OneRmCard の日付軸）が持つため、目盛は一切描かない。
 */
export function buildChartOptions(singlePoint: boolean): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    // canvas はアニメーション途中の描画が visual regression の差分を不安定にするため止める
    animation: false,
    // ホバー・タップに反応しない（値の確認は両端のテキストと履歴一覧が担う）
    events: [],
    layout: { padding: CHART_PADDING },
    scales: {
      // 点は等間隔（日付の実間隔では配置しない）。1 点のときだけ offset で中央へ寄せる
      x: { type: 'category', display: false, offset: singlePoint },
      y: { type: 'linear', display: false },
    },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  }
}
