import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import SessionSummaryCard from '@/components/pages/history/SessionSummaryCard.vue'
import { storybookRouter as router } from '@/stories/router'
import { localStartedAt, makeSession } from '@/stories/session'

const may12 = localStartedAt(2026, 5, 12)

const meta: Meta<typeof SessionSummaryCard> = {
  component: SessionSummaryCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '履歴一覧の 1 セッション分のカード。日付（MM/DD）とステータスバッジ・推定 1RM・メニューの重量と各セットの実績回数を表示し、タップで結果確認画面の履歴詳細（read-only）へ遷移する。バッジの 3 状態は `sessionOutcome` の導出（未実施セットあり / 完走・目標未達 / 完遂）に対応する。',
      },
    },
  },
  argTypes: {
    session: { description: '表示するセッション（集約済み一覧の 1 件）' },
  },
  decorators: [() => ({ template: '<div style="width: 342px;"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof SessionSummaryCard>

// 完遂（COMPLETED）。全セットで目標回数に到達した通常状態
export const Default: Story = {
  args: { session: makeSession('benchPress', 80, [8, 8, 8], { startedAt: may12 }) },
}

// 全セット完走・目標未達（バッジ表示は EXECUTED）
export const Finished: Story = {
  args: { session: makeSession('benchPress', 82.5, [8, 8, 7], { startedAt: may12 }) },
}

// 未実施セットあり（ABORTED）。3 セットのうち 2 セットで中断したセッション
export const Aborted: Story = {
  args: { session: makeSession('squat', 100, [8, 8], { startedAt: may12, sets: 3 }) },
}

// 全セットスキップ（目標 5 回・実績 0 回）。推定 1RM が算出できないため数値の代わりに — を出す。
// 3 セット分の実績が残っているため未実施セットは無く、バッジは目標未達の EXECUTED になる
export const NoOneRm: Story = {
  args: { session: makeSession('deadlift', 150, [0, 0, 0], { startedAt: may12, reps: 5 }) },
}

// reps が多セットで長いとき、横に溢れず折り返して全セットが表示されることを確認する
export const LongReps: Story = {
  args: {
    session: makeSession('squat', 100, [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8], {
      startedAt: may12,
    }),
  },
}

// タップで結果確認画面の履歴詳細（origin=history + 対象 id）へ遷移する配線だけを確認する
export const Behavior: Story = {
  args: {
    session: makeSession('squat', 100, [8, 8, 8], { id: 'squat-0511', startedAt: may12 }),
  },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await router.push('/history')
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link'))
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe('result')
      expect(router.currentRoute.value.params.exercise).toBe('squat')
      expect(router.currentRoute.value.query.origin).toBe('history')
      expect(router.currentRoute.value.query.id).toBe('squat-0511')
    })
  },
}
