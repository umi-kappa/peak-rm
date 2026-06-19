import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'

const meta: Meta<typeof BaseUnit> = {
  component: BaseUnit,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '数値に併記する単位ラベル（KG・REPS・SEC など）。mono / 3 次テキスト色で、数値より一段控えめに見せる。',
      },
    },
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['caption', 'body'],
      description: '文字サイズ（caption=12px / body=14px）',
      table: { defaultValue: { summary: 'caption' } },
    },
  },
  args: { size: 'caption' },
  render: (args) => ({
    components: { BaseUnit },
    setup: () => ({ args }),
    template: `<BaseUnit v-bind="args">KG</BaseUnit>`,
  }),
}

export default meta

type Story = StoryObj<typeof BaseUnit>

export const Default: Story = {}

export const Body: Story = {
  args: { size: 'body' },
}

export const Behavior: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('KG')).toBeVisible()
  },
}
