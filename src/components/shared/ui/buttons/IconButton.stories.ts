import type { Meta, StoryObj } from '@storybook/vue3-vite'
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
  },
  args: { name: 'plus' },
}

export default meta

type Story = StoryObj<typeof IconButton>

export const Default: Story = {}
