import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fireEvent, fn, within } from 'storybook/test'
import BaseDialog from '@/components/shared/ui/base/BaseDialog.vue'
import { topLayerDocs } from '@/stories/topLayerDocs'

const meta: Meta<typeof BaseDialog> = {
  component: BaseDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      story: topLayerDocs(240),
      description: {
        component:
          'ネイティブ `<dialog>` の足回りを一元化するモーダルの外殻。マウント = 表示（開閉は呼び出し側の `v-if` が唯一のソース）で `showModal()` し、ESC / backdrop タップで `cancel` を emit する（backdrop は押下起点も backdrop のときだけ発火）。ネイティブのフォーカス復元が働くよう、アンマウント前に `close()` を通す。`title` はヘッダーの h2 と dialog のアクセシブルネーム（aria-labelledby）を兼ねる。h2 直下に gap-12 で従属要素を置く `header` slot と、gap-20 で残りを並べる default slot を持つ。',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: '見出し（アクセシブルネームを兼ねる）' },
    inset: {
      control: 'inline-radio',
      options: [16, 24],
      description: '画面端からの横インセット',
      table: { defaultValue: { summary: '16' } },
    },
  },
  args: { title: 'ダイアログ見出し' },
  render: (args) => ({
    components: { BaseDialog },
    setup: () => ({ args }),
    template: `
      <BaseDialog v-bind="args">
        <template #header><p style="margin: 0; color: var(--color-text-secondary);">見出しに従属する補足行</p></template>
        <p style="margin: 0;">本文コンテンツ</p>
      </BaseDialog>`,
  }),
}

export default meta

type Story = StoryObj<typeof BaseDialog>

export const Default: Story = {}

// ESC / backdrop の cancel 配線と、title がアクセシブルネームに配線されていることを確認する
export const Behavior: Story = {
  args: { onCancel: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  render: (args) => ({
    components: { BaseDialog },
    setup: () => ({ args }),
    // ドラッグはみ出し検証用に slot へ入力要素を置く
    template: `
      <BaseDialog v-bind="args">
        <textarea aria-label="サンプル入力" />
      </BaseDialog>`,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // role の name 指定は aria-labelledby の配線（dialog = title の h2）の退行検出を兼ねる
    const dialog = canvas.getByRole('dialog', { name: 'ダイアログ見出し' })
    // ESC のネイティブ close request は合成キーイベントでは発火しないため、
    // ブラウザが発火する cancel イベントを直接 dispatch して @cancel の配線を確認する
    await fireEvent(dialog, new Event('cancel', { cancelable: true }))
    await expect(args.onCancel).toHaveBeenCalledOnce()
    // backdrop タップ（押下も解放も dialog 要素 = backdrop）は cancel を発火する
    await fireEvent.pointerDown(dialog)
    await fireEvent.click(dialog)
    await expect(args.onCancel).toHaveBeenCalledTimes(2)
    // 入力要素からのドラッグはみ出し（押下は textarea・click は共通祖先の dialog に解決）では発火しない
    await fireEvent.pointerDown(canvas.getByRole('textbox', { name: 'サンプル入力' }))
    await fireEvent.click(dialog)
    await expect(args.onCancel).toHaveBeenCalledTimes(2)
  },
}
