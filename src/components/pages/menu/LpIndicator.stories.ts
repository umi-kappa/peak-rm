import type { Meta, StoryObj } from '@storybook/vue3-vite'
import LpIndicator from '@/components/pages/menu/LpIndicator.vue'

const meta: Meta<typeof LpIndicator> = {
  component: LpIndicator,
  tags: ['autodocs'],
  // コンポーネントは width: 100% で親が幅を決めるため、Story では実画面幅（390 - 24×2）で表示する
  decorators: [() => ({ template: '<div style="width: 342px;"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component:
          'メニュー設定画面の linear progression 表示。増量成立時に前回ベースライン → 増量後の重量を提示する。',
      },
    },
  },
  argTypes: {
    from: { control: 'number', description: '前回ベースラインの重量（kg）' },
    to: { control: 'number', description: '増量後の重量（kg）' },
  },
}

export default meta

type Story = StoryObj<typeof LpIndicator>

export const Default: Story = {
  args: { from: 147.75, to: 150.25 },
}
