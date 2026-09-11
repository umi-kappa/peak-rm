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
          '操作の結果（Export の完了・Import の検証エラー / 置換完了）を伝えるだけのモーダル。BaseDialog の外殻に文言と閉じるボタン 1 つを載せた presentational コンポーネントで、呼び出し側が `v-if` で出し分ける（マウント = 表示）。選択を求めないため ConfirmDialog と違い確定 / キャンセルの区別が無く、閉じるボタン / ESC はいずれも `close` を emit する。結果を読む前に消えないよう backdrop タップでは閉じない（開いた直後の連打の 2 打目は backdrop に落ちる）。',
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

// 閉じるボタンと BaseDialog の cancel が同じ close へ配線されていること、backdrop では閉じないことを
// 確認する（ESC / backdrop の発火パターン網羅はシェル側 BaseDialog の Behavior が担うが、
// cancel を close へ転送することと backdrop を止めることはこのコンポーネントの責務なのでここで押さえる）
export const Behavior: Story = {
  args: { onClose: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('dialog', { name: '12 件のセッションを読み込みました' })
    await userEvent.click(canvas.getByRole('button', { name: '閉じる' }))
    await expect(args.onClose).toHaveBeenCalledOnce()

    // ESC のネイティブ close request は合成キーイベントでは発火しないため、
    // ブラウザが発火する cancel イベントを直接 dispatch して転送を確認する
    await fireEvent(dialog, new Event('cancel', { cancelable: true }))
    await expect(args.onClose).toHaveBeenCalledTimes(2)

    // backdrop タップ（押下も解放も dialog 要素）では閉じない
    await fireEvent.pointerDown(dialog)
    await fireEvent.click(dialog)
    await expect(args.onClose).toHaveBeenCalledTimes(2)
  },
}
