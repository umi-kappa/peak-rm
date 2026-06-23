import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import IconButton from '@/components/shared/ui/buttons/IconButton.vue'

const meta: Meta<typeof AppBar> = {
  component: AppBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '下層画面のヘッダ。`back` の戻るボタン / `title` / `action` スロットを持つ。`title` の大文字小文字は画面側が決めて渡す。戻る押下は `@back` を emit するだけで、遷移先の判断（戻る / Home / History 等）は画面側が担う。router やナビ・業務ロジックは持たない。',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: '見出し文字' },
    back: {
      control: 'boolean',
      description:
        '戻るボタンの有無。完了・中断経由の結果画面など戻る矢印を出さない画面で false にする',
      table: { defaultValue: { summary: 'true' } },
    },
  },
  args: { title: 'BENCH PRESS' },
  // ヘッダは画面幅いっぱいに置かれるため、Story では画面に近い幅で表示する
  decorators: [() => ({ template: '<div style="width: 320px;"><story /></div>' })],
  render: (args) => ({
    components: { AppBar },
    setup: () => ({ args }),
    template: `<AppBar v-bind="args" />`,
  }),
}

export default meta

type Story = StoryObj<typeof AppBar>

export const Default: Story = {}

// 完了・中断経由の結果確認画面など、戻る矢印を持たないヘッダ
export const NoBack: Story = {
  args: { back: false },
}

// 右スロットに補助操作（履歴詳細の削除など）を置いた例
export const WithAction: Story = {
  render: (args) => ({
    components: { AppBar, IconButton },
    setup: () => ({ args }),
    template: `
      <AppBar v-bind="args">
        <template #action>
          <IconButton name="trash-2" label="Delete" />
        </template>
      </AppBar>`,
  }),
}

// 戻るボタンが @back を emit する配線だけを確認する
export const Behavior: Story = {
  args: { onBack: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }))
    await expect(args.onBack).toHaveBeenCalledOnce()
  },
}
