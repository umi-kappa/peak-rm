import type { Meta, StoryObj } from '@storybook/vue3-vite'
import OneRmCard from '@/components/pages/history/OneRmCard.vue'
import { buildOneRmChartData } from '@/core/chartData'
import { localStartedAt, makeSession } from '@/stories/session'

// [月, 日, 重量]。ベンチ 8 回の推定 1RM は weight × 1.2 になる
type Row = readonly [number, number, number]

// 表示する値の一貫性（latest = 終点・delta = 終点 − 始点）を保つため、
// 手で組み立てず実際の変換（buildOneRmChartData）を通した結果を args にする
function chartArgs(rows: readonly Row[]) {
  const sessions = rows.map(([month, date, weight]) =>
    makeSession('benchPress', weight, [8], {
      id: `bench-${month}-${date}`,
      startedAt: localStartedAt(2026, month, date),
    }),
  )
  const data = buildOneRmChartData(sessions)
  if (!data) throw new Error('fixture must have at least one point')
  return data
}

const meta: Meta<typeof OneRmCard> = {
  component: OneRmCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '履歴画面の 1RM 推移カード。Est. 1RM のヘッドライン（表示区間の終点）と区間の前回比、折れ線、両端の日付を出す。値はすべて `core/chartData` の変換結果を受け取り、カード側でドメイン計算をしない。比較対象が無い（1 点のみ）ときは前回比と区間ラベルを出さない。',
      },
    },
  },
  argTypes: {
    points: { description: '表示区間の点（古い順）' },
    latest: { description: '表示区間の終点の推定 1RM' },
    delta: { description: '表示区間の「終点 − 始点」。1 点のみのときは undefined' },
  },
  // 画面本文の幅（390 − 外周 48）で見る
  decorators: [() => ({ template: '<div style="width: 342px;"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof OneRmCard>

// デザイン正本の chart card と同じ 8 点の推移（90.0 → 99.0・前回比 +9.0）
export const Default: Story = {
  args: chartArgs([
    [4, 4, 75],
    [4, 7, 75.5],
    [4, 11, 76.25],
    [4, 14, 76.5],
    [4, 18, 78.5],
    [4, 25, 79.25],
    [5, 3, 80.75],
    [5, 12, 82.5],
  ]),
}

// 区間の終点が始点を下回るケース（前回比が下向き）
export const Decrease: Story = {
  args: chartArgs([
    [5, 3, 82.5],
    [5, 6, 81.25],
    [5, 9, 80],
    [5, 12, 77.5],
  ]),
}

// 記録が 1 点だけ。比較対象が無いため前回比と区間ラベルを出さず、日付も 1 つになる
export const SinglePoint: Story = {
  args: chartArgs([[5, 12, 82.5]]),
}
