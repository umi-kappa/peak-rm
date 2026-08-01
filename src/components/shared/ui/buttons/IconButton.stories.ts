import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { iconNames } from '@/assets/icons'
import IconButton from '@/components/shared/ui/buttons/IconButton.vue'
import { storybookRouter as router } from '@/stories/router'

const meta: Meta<typeof IconButton> = {
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '円形のアイコン専用ボタン。`name` のアイコン（`BaseIcon`）を内包し、カード面の塗りにグレーのアイコンを載せる。`to` があれば `<router-link>`、無ければ `<button>`（`click` を emit）として描画する。',
      },
    },
  },
  argTypes: {
    name: {
      control: 'select',
      options: iconNames,
      description: '表示するアイコン',
    },
    label: {
      control: 'text',
      description: 'スクリーンリーダー向けラベル（`aria-label` に出力）',
    },
    to: {
      control: 'text',
      description: '指定すると <router-link> として描画する遷移先',
    },
  },
  args: { name: 'plus', label: 'Add set' },
}

export default meta

type Story = StoryObj<typeof IconButton>

export const Default: Story = {}

// to を渡すと <router-link> として描画される
export const Link: Story = {
  args: { name: 'settings', label: 'Settings', to: '/settings' },
}

// button 版が click を emit する配線だけを確認する
export const Behavior: Story = {
  args: { onClick: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add set' }))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

// to 版はクリックで router が遷移し、click は emit しない（to 時の onClick ガード）
export const LinkBehavior: Story = {
  args: { name: 'settings', label: 'Settings', to: '/settings', onClick: fn() },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, args }) => {
    await router.push('/')
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link', { name: 'Settings' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/settings'))
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}
