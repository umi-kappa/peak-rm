import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ConfirmDialog from '@/components/shared/ui/dialog/ConfirmDialog.vue'
import { topLayerDocs } from '@/stories/topLayerDocs'

const meta: Meta<typeof ConfirmDialog> = {
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      story: topLayerDocs(320),
      description: {
        component:
          '破壊的操作（中断・Import・セッション削除）の確認に使うモーダル。BaseDialog の外殻に確認の文言と確定 / キャンセルボタンを載せた presentational コンポーネント。確定で `confirm`、キャンセル / ESC / backdrop で `cancel` を emit するだけで、実際の処理・遷移は呼び出し側が担う。',
      },
    },
  },
  argTypes: {
    open: { control: 'boolean', description: '開閉状態（唯一のソース）' },
    title: { control: 'text', description: '見出し' },
    message: { control: 'text', description: '補足メッセージ（任意）' },
    confirmLabel: {
      control: 'text',
      description: '確定ボタンの文言',
      table: { defaultValue: { summary: '確定' } },
    },
    cancelLabel: {
      control: 'text',
      description: 'キャンセルボタンの文言',
      table: { defaultValue: { summary: 'キャンセル' } },
    },
  },
  args: { open: true, title: 'トレーニングを中断しますか？' },
  render: (args) => ({
    components: { ConfirmDialog },
    setup: () => ({ args }),
    template: `<ConfirmDialog v-bind="args" />`,
  }),
}

export default meta

type Story = StoryObj<typeof ConfirmDialog>

export const Default: Story = {}

export const WithMessage: Story = {
  args: {
    message: 'ここまでの記録を保存して結果確認画面へ進みます。',
    confirmLabel: '中断する',
  },
}

// 確定 / キャンセルが各 emit に配線されていることを確認する
export const Behavior: Story = {
  args: { onConfirm: fn(), onCancel: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '確定' }))
    await expect(args.onConfirm).toHaveBeenCalledOnce()
    await userEvent.click(canvas.getByRole('button', { name: 'キャンセル' }))
    await expect(args.onCancel).toHaveBeenCalledOnce()
  },
}
