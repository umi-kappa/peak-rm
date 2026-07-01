import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import CardButton from '@/components/shared/ui/buttons/CardButton.vue'
import { storybookRouter as router } from '@/stories/router'

const meta: Meta<typeof CardButton> = {
  component: CardButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'BaseCard を内包した押せる面。`to` があれば `<router-link>`、無ければ `<button>`（`click` を emit）として描画する。`border` は BaseCard へ素通しする。`:focus-visible` / hover / press の affordance を持つ。Home の種目カードや History / Settings の行に使う。',
      },
    },
  },
  argTypes: {
    to: { control: 'text', description: '指定すると <router-link> として描画する遷移先' },
    border: {
      control: 'inline-radio',
      options: ['soft', 'line', 'accent'],
      description: '枠線の種類（soft=弱い区切り / line=通常境界 / accent=アクセント）',
      table: { defaultValue: { summary: 'soft' } },
    },
  },
  decorators: [() => ({ template: '<div style="width: 320px;"><story /></div>' })],
  render: (args) => ({
    components: { CardButton },
    setup: () => ({ args }),
    template: `<CardButton v-bind="args">Card surface</CardButton>`,
  }),
}

export default meta

type Story = StoryObj<typeof CardButton>

export const Default: Story = {}

export const Line: Story = {
  args: { border: 'line' },
}

export const Accent: Story = {
  args: { border: 'accent' },
}

// to を渡すと <router-link> として描画される
export const Link: Story = {
  args: { to: '/benchPress/menu' },
}

// button 版が click を emit する配線だけを確認する
export const Behavior: Story = {
  args: { onClick: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

// to 版はクリックで router が遷移し、click は emit しない（to 時の onClick ガード）
export const LinkBehavior: Story = {
  args: { to: '/benchPress/menu', onClick: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    await router.push('/')
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link'))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/benchPress/menu'))
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}
