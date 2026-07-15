import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SetEditDialog from '@/components/shared/ui/dialog/SetEditDialog.vue'

const meta: Meta<typeof SetEditDialog> = {
  component: SetEditDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      // showModal() のダイアログは top layer に出るため、インライン描画では Docs ページ上で全 story が重なる。
      // story ごとに iframe を分けて top layer を隔離する
      story: { inline: false, iframeHeight: 560 },
      description: {
        component:
          '完了セットの実績回数とメモを編集するモーダル。マウント = 表示で、呼び出し側が `v-if` で出し分ける。重量は表示のみで編集 UI を持たず、SAVE で編集後の `SetResult` を `save` に emit する（保存と閉じるは呼び出し側の責務）。閉じる用の × ボタンは置かず、ESC / backdrop は編集を破棄する `cancel` を emit する。`repsReadonly`（履歴詳細用）はステッパーを出さず実績を静的表示にし、メモだけ編集できる。',
      },
    },
  },
  argTypes: {
    exerciseLabel: { control: 'text', description: '種目の表示名（EXERCISE_LABELS の値）' },
    weight: { control: 'number', description: 'セッションに焼き込まれた重量（表示のみ）' },
    setNumber: { control: 'number', description: '1 始まりのセット番号' },
    actualReps: { control: 'number', description: '実績回数の現在値（ドラフトの初期値）' },
    memo: { control: 'text', description: 'セットメモの現在値（ドラフトの初期値）' },
    repsReadonly: {
      control: 'boolean',
      description: '実績 read-only モード（履歴詳細用）',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    exerciseLabel: 'BENCH PRESS',
    weight: 82.5,
    setNumber: 2,
    actualReps: 8,
    memo: '4回目からフォームが乱れた…',
  },
  render: (args) => ({
    components: { SetEditDialog },
    setup: () => ({ args }),
    template: `<SetEditDialog v-bind="args" />`,
  }),
}

export default meta

type Story = StoryObj<typeof SetEditDialog>

export const Default: Story = {}

export const RepsReadonly: Story = {
  args: { repsReadonly: true },
}

// メモ未入力時の placeholder（ADD NOTE）表示
export const EmptyMemo: Story = {
  args: { memo: '' },
}

// 実績・メモの編集結果が save の payload に配線されていることを確認する
export const Behavior: Story = {
  args: { memo: '', onSave: fn(), onCancel: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }))
    await userEvent.type(canvas.getByRole('textbox'), 'フォームを意識した')
    await userEvent.click(canvas.getByRole('button', { name: 'SAVE' }))
    await expect(args.onSave).toHaveBeenCalledOnce()
    await expect(args.onSave).toHaveBeenCalledWith({
      actualReps: 9,
      memo: 'フォームを意識した',
    })
  },
}
