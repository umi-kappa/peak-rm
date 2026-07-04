import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import WeightStepper from '@/components/pages/menu/WeightStepper.vue'

const meta: Meta<typeof WeightStepper> = {
  component: WeightStepper,
  tags: ['autodocs'],
  // コンポーネントは width: 100% で親が幅を決めるため、Story では実画面幅（390 - 24×2）で表示する
  decorators: [() => ({ template: '<div style="width: 342px;"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component: 'メニュー設定画面の重量入力。汎用 `NumberStepper` を 0.25 kg 刻みで包む。',
      },
    },
  },
  argTypes: {
    modelValue: {
      description: '重量の現在値（kg）。`v-model` でバインドする',
      // Story では操作を確認できるよう args ではなく内部 ref に配線しているため control は効かない
      control: false,
    },
  },
}

export default meta

type Story = StoryObj<typeof WeightStepper>

// args の value は更新されないため、値の表示・操作には ref で v-model を持たせる
const renderWithModel =
  (initial: number): NonNullable<Story['render']> =>
  () => ({
    components: { WeightStepper },
    setup() {
      const value = ref(initial)
      return { value }
    },
    template: '<WeightStepper v-model="value" />',
  })

export const Default: Story = {
  render: renderWithModel(150.25),
}

// NumberStepper が model に配線されていることだけを確認する。
// 刻み・clamp の検証は stepper.spec / useNumberStepper.spec が担う。
export const Behavior: Story = {
  render: renderWithModel(150.25),
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }))
    await expect(canvas.getByText('150.5')).toBeVisible()
  },
}
