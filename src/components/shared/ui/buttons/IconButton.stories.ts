import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import { iconNames } from '@/assets/icons'
import IconButton from '@/components/shared/ui/buttons/IconButton.vue'

const meta: Meta<typeof IconButton> = {
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '円形のアイコン専用ボタン。`name` のアイコン（`BaseIcon`）を内包し、カード面の塗りにグレーのアイコンを載せる。',
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
  },
  args: { name: 'plus', label: 'セットを追加' },
}

export default meta

type Story = StoryObj<typeof IconButton>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'セットを追加' })).toBeVisible()
  },
}
