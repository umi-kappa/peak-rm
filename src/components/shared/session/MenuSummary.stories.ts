import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuSummary from '@/components/shared/session/MenuSummary.vue'

const meta: Meta<typeof MenuSummary> = {
  component: MenuSummary,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'セッションのメニュー（重量・回数・セット数）を 1 行で提示するサマリー。インターバル・結果確認の画面上部で共用する。',
      },
    },
  },
  argTypes: {
    weight: { control: 'number', description: '重量（kg）' },
    reps: { control: 'number', description: '目標回数' },
    sets: { control: 'number', description: 'セット数' },
  },
}

export default meta

type Story = StoryObj<typeof MenuSummary>

export const Default: Story = {
  args: { weight: 82.5, reps: 8, sets: 3 },
}
