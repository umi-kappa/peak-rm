import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import AlertDialog from '@/components/shared/ui/dialog/AlertDialog.vue'
import { topLayerDocs } from '@/stories/topLayerDocs'

const meta: Meta<typeof AlertDialog> = {
  component: AlertDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      story: topLayerDocs(280),
      description: {
        component:
          '操作の結果（Import の検証エラー・置換完了）を伝えるだけのモーダル。BaseDialog の外殻に文言と閉じるボタン 1 つを載せた presentational コンポーネントで、呼び出し側が `v-if` で出し分ける（マウント = 表示）。選択を求めないため ConfirmDialog と違い確定 / キャンセルの区別が無く、閉じるボタン / ESC / backdrop はいずれも `close` を emit する。',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: '見出し' },
    message: { control: 'text', description: '補足メッセージ（任意）' },
    closeLabel: {
      control: 'text',
      description: '閉じるボタンの文言',
      table: { defaultValue: { summary: '閉じる' } },
    },
  },
  args: { title: '12 件のセッションを読み込みました' },
  render: (args) => ({
    components: { AlertDialog },
    setup: () => ({ args }),
    template: `<AlertDialog v-bind="args" />`,
  }),
}

export default meta

type Story = StoryObj<typeof AlertDialog>

export const Default: Story = {}

export const WithMessage: Story = {
  args: {
    title: '読み込みに失敗しました',
    message: 'schemaVersion が 1 ではありません',
  },
}

// 閉じるボタンと BaseDialog の cancel が、いずれも同じ close へ配線されていることを確認する
// （ESC / backdrop それぞれの発火パターン網羅はシェル側 BaseDialog の Behavior が担うが、
//   その cancel を close へ転送するのはこのコンポーネントの責務なのでここで押さえる）
export const Behavior: Story = {
  args: { onClose: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '閉じる' }))
    await expect(args.onClose).toHaveBeenCalledOnce()

    // ESC のネイティブ close request は合成キーイベントでは発火しないため、
    // ブラウザが発火する cancel イベントを直接 dispatch して転送を確認する
    await fireEvent(canvas.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    await expect(args.onClose).toHaveBeenCalledTimes(2)
  },
}
