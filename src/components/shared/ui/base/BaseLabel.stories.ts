import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'

const meta: Meta<typeof BaseLabel> = {
  component: BaseLabel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '行や値に添えるキャプションラベル（EST. 1RM・WEIGHT など）。mono / caption サイズ / 3 次テキスト色。',
      },
    },
  },
  render: () => ({
    components: { BaseLabel },
    template: `<BaseLabel>EST. 1RM</BaseLabel>`,
  }),
}

export default meta

type Story = StoryObj<typeof BaseLabel>

export const Default: Story = {}
