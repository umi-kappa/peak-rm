import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'

const meta: Meta<typeof BaseButton> = {
  component: BaseButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'ボタンの基底プリミティブ。`variant` で見た目を切り替える。`primary` はアクセント色の塗りで主アクション、`secondary` は塗りを持たず細い境界線とグレーの文字で控えめに見せる。',
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

export const Primary: Story = {
  args: { variant: 'primary' },
}

export const Secondary: Story = {
  args: { variant: 'secondary' },
}
