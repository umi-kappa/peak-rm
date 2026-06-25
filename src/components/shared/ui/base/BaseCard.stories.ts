import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'

const meta: Meta<typeof BaseCard> = {
  component: BaseCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '面の土台となる presentational なカード。surface 背景 + 枠線 + 角丸を着せるだけで、子の配置やタップ挙動は持たない（押せる版は CardButton）。`border` で枠線の強さを切り替える。',
      },
    },
  },
  argTypes: {
    border: {
      control: 'inline-radio',
      options: ['soft', 'line', 'accent'],
      description: '枠線の種類（soft=弱い区切り / line=通常境界 / accent=アクセント）',
      table: { defaultValue: { summary: 'soft' } },
    },
  },
  // カードは親が幅を決めるため、Story では実使用幅に近い幅で表示する
  decorators: [() => ({ template: '<div style="width: 320px;"><story /></div>' })],
  render: (args) => ({
    components: { BaseCard },
    setup: () => ({ args }),
    template: `<BaseCard v-bind="args"><div style="color: var(--color-text);">Card surface</div></BaseCard>`,
  }),
}

export default meta

type Story = StoryObj<typeof BaseCard>

export const Default: Story = {}

export const Line: Story = {
  args: { border: 'line' },
}

export const Accent: Story = {
  args: { border: 'accent' },
}
