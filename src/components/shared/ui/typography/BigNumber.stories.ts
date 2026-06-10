import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BigNumber from '@/components/shared/ui/typography/BigNumber.vue'

const meta: Meta<typeof BigNumber> = {
  component: BigNumber,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '主役となる数値の表示（1RM・重量・タイマーなど）。mono / bold / tabular-nums で桁幅を固定し、`accent` でアクセント色＋発光に切り替える。`value` は整形済み文字列も受け付ける。',
      },
    },
  },
  argTypes: {
    value: { control: 'text', description: '表示する数値（整形済み文字列可）' },
    size: {
      control: 'inline-radio',
      options: ['stat', 'hero', 'display'],
      description: 'サイズ（stat=32px / hero=64px / display=96px）',
      table: { defaultValue: { summary: 'stat' } },
    },
    accent: {
      control: 'boolean',
      description: 'アクセント扱い（アクセント色 + glow）で強調する',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: { value: '99.0' },
}

export default meta

type Story = StoryObj<typeof BigNumber>

export const Stat: Story = {}

export const Hero: Story = {
  args: { value: '0:47.59', size: 'hero' },
}

export const Display: Story = {
  args: { value: '82.5', size: 'display' },
}

export const Accent: Story = {
  args: { accent: true },
}
