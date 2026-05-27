import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import SampleButton from '@/components/SampleButton.vue'

const meta: Meta<typeof SampleButton> = {
  component: SampleButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'クリックするとカウントが増えるサンプルボタン。Storybook と play 関数（@storybook/addon-vitest による headless ブラウザ実行）の動作確認用に最小実装。`label` が空でなければカウントの左に補助ラベルを表示し、クリック時には `step` の値だけ加算する。',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'ボタンに表示する補助ラベル（空文字なら非表示）',
      table: { defaultValue: { summary: "''" } },
    },
    step: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'クリックごとの増分',
      table: { defaultValue: { summary: '1' } },
    },
  },
  args: {
    label: '',
    step: 1,
  },
}

export default meta

type Story = StoryObj<typeof SampleButton>

export const IncrementsOnClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    await expect(button).toHaveTextContent('0')
    await userEvent.click(button)
    await expect(button).toHaveTextContent('1')
  },
}
