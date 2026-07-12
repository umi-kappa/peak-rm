import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import TimelineSetCard from '@/components/pages/interval/TimelineSetCard.vue'

const meta: Meta<typeof TimelineSetCard> = {
  component: TimelineSetCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'インターバル画面のセットタイムラインを構成する 1 セット分のカード。done は実績回数とメモ（未入力なら ADD NOTE プロンプト）、next / pending は目標回数を表示する presentational なコンポーネント。state と実績の対応はページ側が算出して渡す。',
      },
    },
  },
  argTypes: {
    setNumber: { control: 'number', description: '1 始まりのセット番号' },
    state: {
      control: 'select',
      options: ['done', 'next', 'pending'],
      description: 'カードの状態（done = 完了済み / next = 次のセット / pending = 未実施）',
    },
    targetReps: { control: 'number', description: 'メニューの目標回数（next / pending に表示）' },
    actualReps: {
      control: 'number',
      description: '実績回数（done に表示。next / pending では未使用）',
    },
    memo: {
      control: 'text',
      description: 'セットメモ（done で表示。未入力 "" なら ADD NOTE プロンプト）',
    },
  },
  decorators: [() => ({ template: '<div style="width: 342px;"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof TimelineSetCard>

export const Default: Story = {
  args: { setNumber: 1, state: 'done', targetReps: 8, actualReps: 8, memo: '' },
}

export const Next: Story = {
  args: { setNumber: 3, state: 'next', targetReps: 8, actualReps: undefined, memo: undefined },
}

export const Pending: Story = {
  args: { setNumber: 4, state: 'pending', targetReps: 8, actualReps: undefined, memo: undefined },
}

export const WithMemo: Story = {
  args: { setNumber: 1, state: 'done', targetReps: 8, actualReps: 8, memo: 'フォーム良し' },
}

// 折り返しが発生してもメモアイコンが 1 行目に留まることを確認する
export const WithLongMemo: Story = {
  args: {
    setNumber: 1,
    state: 'done',
    targetReps: 8,
    actualReps: 8,
    memo: '前半はバーの軌道が安定していたが、6 回目以降は右肩が先に上がる癖が出た。次回はラックアップ後のセットアップを丁寧にやり直す。',
  },
}

// done カード（button 版）のタップが edit を emit する配線だけを確認する
export const Behavior: Story = {
  args: { setNumber: 1, state: 'done', targetReps: 8, actualReps: 8, memo: '', onEdit: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(args.onEdit).toHaveBeenCalledOnce()
  },
}
