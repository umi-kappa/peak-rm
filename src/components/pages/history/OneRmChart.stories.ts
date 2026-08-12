import type { Meta, StoryObj } from '@storybook/vue3-vite'
import OneRmChart from '@/components/pages/history/OneRmChart.vue'

const meta: Meta<typeof OneRmChart> = {
  component: OneRmChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '1RM 推移の折れ線（Chart.js の canvas）。整形済みの推定 1RM の並びを受け取って描くだけで、日付ラベルは呼び出し側（OneRmCard）が HTML で持つ。baseline と両端の破線ヘルパー・両端の値テキストは inline plugin で描き、grid・目盛・凡例・ツールチップは出さない。',
      },
    },
  },
  argTypes: {
    values: { description: '古い順（左 → 右）に並べた推定 1RM' },
  },
  // カード内側の幅（画面 390 − 外周 48 − カード padding 32）で見る
  decorators: [() => ({ template: '<div style="width: 310px;"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof OneRmChart>

// デザイン正本の chart card と同じ 8 点の推移（90.0 → 99.0）
export const Default: Story = {
  args: { values: [90, 90.6, 91.5, 91.8, 94.2, 95.1, 96.9, 99] },
}

// 記録が 1 点だけ。折れ線が引けないため点と値テキストだけになり、中央に置く。
// baseline はカードの床として残し、破線ヘルパーは始点と終点が同じ点なので 1 本になる
export const SinglePoint: Story = {
  args: { values: [99] },
}
