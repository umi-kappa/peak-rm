import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ErrorScreen from '@/components/app/ErrorScreen.vue'

const meta: Meta<typeof ErrorScreen> = {
  component: ErrorScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '想定外エラー発生時にアプリ全体を置き換える全画面表示。エラーメッセージと RELOAD ボタンだけを中立に提示する（spec「トーンガイド」）。RELOAD は `reload` を emit するだけで、ページ再読み込みの実処理は呼び出し側（App.vue）が担う。',
      },
    },
  },
  args: {
    message: 'Failed to execute transaction on IDBDatabase: The database connection is closing.',
  },
}

export default meta

type Story = StoryObj<typeof ErrorScreen>

export const Default: Story = {}

// RELOAD が reload を emit する配線だけを確認する
export const Behavior: Story = {
  args: { onReload: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'RELOAD' }))
    await expect(args.onReload).toHaveBeenCalledOnce()
  },
}
