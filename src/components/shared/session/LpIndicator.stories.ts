import type { Meta, StoryObj } from '@storybook/vue3-vite'
import LpIndicator from '@/components/shared/session/LpIndicator.vue'

const meta: Meta<typeof LpIndicator> = {
  component: LpIndicator,
  tags: ['autodocs'],
  // コンポーネントは width: 100% で親が幅を決めるため、Story では実画面幅（390 - 24×2）で表示する
  decorators: [() => ({ template: '<div style="width: 342px;"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component:
          'linear progression の増量プレビュー。増量成立時に前回ベースライン → 増量後の重量を提示する（メニュー設定・結果確認で共用し、説明文は message で画面の文脈に合わせる）。',
      },
    },
  },
  argTypes: {
    from: { control: 'number', description: '前回ベースラインの重量（kg）' },
    to: { control: 'number', description: '増量後の重量（kg）' },
    message: { control: 'text', description: 'タイトル下の説明文' },
  },
}

export default meta

type Story = StoryObj<typeof LpIndicator>

export const Default: Story = {
  args: { from: 147.75, to: 150.25, message: 'LAST SESSION COMPLETED!' },
}
