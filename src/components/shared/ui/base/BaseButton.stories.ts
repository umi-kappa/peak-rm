import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'

const meta: Meta<typeof BaseButton> = {
  component: BaseButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'ボタンの基底プリミティブ。`variant` で見た目を切り替える。`primary` はアクセント色の塗りで主アクション、`secondary` は塗りを持たず細い境界線とグレーの文字で控えめに見せる。`disabled` は属性として素通しし、どちらの variant も面・枠線・文字色を一段落とす。',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary'],
      description: '見た目の種類',
      table: { defaultValue: { summary: 'primary' } },
    },
    disabled: {
      control: 'boolean',
      description: '一時的に押せないことを示す',
    },
  },
  args: { variant: 'primary' },
  render: (args) => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: `<BaseButton v-bind="args">BUTTON</BaseButton>`,
  }),
}

export default meta

type Story = StoryObj<typeof BaseButton>

export const Default: Story = {}

export const Secondary: Story = {
  args: { variant: 'secondary' },
}

// 常設ボタンがデータの読み込み待ちなどで一時的に押せない状態（メニュー設定の START SESSION）
export const Disabled: Story = {
  args: { disabled: true },
}
