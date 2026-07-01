import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { iconNames } from '@/assets/icons'
import NavLink from '@/components/pages/home/NavLink.vue'
import { storybookRouter as router } from '@/stories/router'

const meta: Meta<typeof NavLink> = {
  component: NavLink,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'アイコン + ラベル + chevron の行型ナビゲーションリンク。`to` へ遷移する <router-link>。区切り線（border）は内包せず、並べる側のコンテナで付ける。',
      },
    },
  },
  argTypes: {
    icon: { control: 'select', options: iconNames, description: 'ラベル左のアイコン' },
    label: { control: 'text', description: '行のテキスト' },
    to: { control: 'text', description: '遷移先' },
  },
  args: { icon: 'history', label: 'HISTORY', to: '/history' },
  decorators: [() => ({ template: '<div style="width: 342px;"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof NavLink>

export const Default: Story = {}

// タップで to へ遷移する配線だけを確認する
export const Behavior: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await router.push('/')
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link'))
    await waitFor(() => expect(router.currentRoute.value.name).toBe('history'))
  },
}
