import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import ExerciseTabs from '@/components/pages/history/ExerciseTabs.vue'

const meta: Meta<typeof ExerciseTabs> = {
  component: ExerciseTabs,
  tags: ['autodocs'],
  args: { modelValue: 'benchPress' },
  parameters: {
    docs: {
      description: {
        component:
          '履歴画面の種目タブ。選択中の種目を受け取り、タップされた種目を emit して、セッション一覧と 1RM グラフの表示種目を切り替える。タブは種目の表示順（`EXERCISE_ORDER`）で並べる。',
      },
    },
  },
  argTypes: {
    modelValue: {
      description: '選択中の種目',
      // Story では操作を確認できるよう args ではなく内部 ref に配線しているため control は効かない
      control: false,
    },
  },
  // タップで選択が動く様子を見せるため、args の値を初期値にした内部 ref へ v-model を繋ぐ
  render: (args) => ({
    components: { ExerciseTabs },
    setup() {
      const exercise = ref(args.modelValue)
      return { exercise }
    },
    template: '<ExerciseTabs v-model="exercise" />',
  }),
}

export default meta

type Story = StoryObj<typeof ExerciseTabs>

export const Default: Story = {}

// 先頭以外を選択した状態（active の位置が動くことの確認）
export const Deadlift: Story = {
  args: { modelValue: 'deadlift' },
}

// タブのタップが model へ配線され、active 表示が移ることだけを確認する
export const Behavior: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'SQUAT' }))
    await expect(canvas.getByRole('button', { name: 'SQUAT' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'BENCH PRESS' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}
