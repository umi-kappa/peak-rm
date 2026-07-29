import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import NumberStepper from '@/components/shared/ui/inputs/NumberStepper.vue'

const meta: Meta<typeof NumberStepper> = {
  component: NumberStepper,
  tags: ['autodocs'],
  // コンポーネントは width: 100% で親が幅を決めるため、Story では実使用幅に近い幅で表示する
  decorators: [() => ({ template: '<div style="width: 240px;"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component:
          '汎用ステッパー（reps / sets / interval 用）。± ボタンで `step` 刻みに増減し、長押しでリピートする。キーボードは Enter / Space で 1 step 動く（リピートは OS のキーリピート）。`min` / `max` 到達時はボタンを無効化せず no-op（clamp）で受け流す。−／値／＋ は `label` を名前に持つ 1 つの数値入力グループ（`role="group"`）として読み上げられる。',
      },
    },
  },
  args: { label: 'REPS' },
  argTypes: {
    modelValue: {
      description: '現在値。`v-model` でバインドする',
      // Story では操作を確認できるよう args ではなく内部 ref に配線しているため control は効かない
      control: false,
    },
    label: {
      control: 'text',
      description: '数値入力グループ（`role="group"`）の名前。`aria-label` に出力する',
    },
    large: {
      control: 'boolean',
      description: '大きいサイズ（ヒーロー表示）で表示。省略時はリスト行向けの通常サイズ',
      table: { defaultValue: { summary: 'false' } },
    },
    step: {
      control: 'number',
      description: '増減の刻み幅',
      table: { defaultValue: { summary: '1' } },
    },
    min: { control: 'number', description: '下限（省略時は無制限）' },
    max: { control: 'number', description: '上限（省略時は無制限）' },
    unit: { control: 'text', description: '値の右に添える単位' },
    accent: {
      control: 'boolean',
      description: '値をアクセント色で表示',
      table: { defaultValue: { summary: 'false' } },
    },
  },
}

export default meta

type Story = StoryObj<typeof NumberStepper>

// args の value は更新されないため、値の表示・操作には ref で v-model を持たせる
const renderWithModel =
  (initial: number): NonNullable<Story['render']> =>
  (args) => ({
    components: { NumberStepper },
    setup() {
      const value = ref(initial)
      return { args, value }
    },
    template: '<NumberStepper v-bind="args" v-model="value" />',
  })

export const Default: Story = {
  args: { step: 1, min: 0 },
  render: renderWithModel(8),
}

export const WithUnit: Story = {
  args: { label: 'INTERVAL', step: 10, min: 0, unit: 'SEC' },
  render: renderWithModel(90),
}

export const Large: Story = {
  args: { large: true, min: 0 },
  render: renderWithModel(8),
}

export const LargeAccent: Story = {
  args: { label: 'WEIGHT', large: true, accent: true, unit: 'KG', step: 0.25, min: 0 },
  render: renderWithModel(82.5),
}

// ボタンが model に配線され、操作で表示が更新されることだけを確認する。
// step 刻み・min / max clamp の検証は stepper.spec / useNumberStepper.spec が担う。
export const Behavior: Story = {
  args: { step: 1, min: 0 },
  render: renderWithModel(8),
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // キーボード経路の退行検出（pointer ハンドラだけでは Enter / Space で増減しない）。
    // Tab の到達順に依存するため、フォーカスが動く pointer 経路より先に置く
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Decrease' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('7')).toBeVisible()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Increase' })).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(canvas.getByText('8')).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }))
    await expect(canvas.getByText('9')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease' }))
    await expect(canvas.getByText('8')).toBeVisible()
  },
}
