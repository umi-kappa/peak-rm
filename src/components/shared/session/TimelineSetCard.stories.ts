import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import TimelineSetCard from '@/components/shared/session/TimelineSetCard.vue'

const meta: Meta<typeof TimelineSetCard> = {
  component: TimelineSetCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'セットタイムラインを構成する 1 セット分のカード（インターバル・結果確認で共用）。done は実績回数（0 は SKIPPED）と右端の ✎ 目印を表示し、カード全体のタップで edit を emit する。next / pending は目標回数を表示する。メモは非空のときのみ行表示し、未入力の ADD NOTE プロンプトは memoPrompt（インターバル中のみ）で出す。state と実績の対応はページ側が算出して渡す presentational なコンポーネント。',
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
      description: '実績回数（done に表示。0 は SKIPPED 表示。next / pending では未使用）',
    },
    memo: {
      control: 'text',
      description: 'セットメモ（done で非空のときのみ行表示）',
    },
    memoPrompt: {
      control: 'boolean',
      description: 'メモ未入力時に ADD NOTE プロンプトを出すか（インターバル中のみ true）',
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

export const Skipped: Story = {
  args: { setNumber: 2, state: 'done', targetReps: 8, actualReps: 0, memo: '肩に違和感' },
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

// メモ未入力の ADD NOTE プロンプト（インターバル中のみの表現）
export const MemoPrompt: Story = {
  args: { setNumber: 1, state: 'done', targetReps: 8, actualReps: 8, memo: '', memoPrompt: true },
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
