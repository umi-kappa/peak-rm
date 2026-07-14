import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import ExerciseCard from '@/components/pages/home/ExerciseCard.vue'
import { makeSession } from '@/stories/session'
import { storybookRouter as router } from '@/stories/router'

const meta: Meta<typeof ExerciseCard> = {
  component: ExerciseCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Home の種目カード。直前セッションの推定 1RM（小数 1 桁）と前回記録（重量 + 実績 reps）を表示し、タップで該当種目のメニュー設定へ遷移する。`session` 未指定で未記録状態（— / NO LOG）を出す。',
      },
    },
  },
  argTypes: {
    exercise: {
      control: 'select',
      options: ['benchPress', 'squat', 'deadlift'],
      description: 'カードの種目。タップ時のメニュー遷移先 params に使う',
    },
    session: { control: 'object', description: '直前セッション（未指定で未記録表示）' },
  },
  decorators: [() => ({ template: '<div style="width: 342px;"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof ExerciseCard>

export const Default: Story = {
  args: {
    exercise: 'benchPress',
    session: makeSession('benchPress', 82.5, [8, 8, 7]),
  },
}

export const NoRecord: Story = {
  args: {
    exercise: 'squat',
  },
}

// reps が多セットで長いとき、省略せず折り返して全セットが表示されることを確認する
export const LongReps: Story = {
  args: {
    exercise: 'squat',
    session: makeSession('squat', 100, [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]),
  },
}

// タップで該当種目のメニュー設定へ遷移する配線だけを確認する
export const Behavior: Story = {
  args: {
    exercise: 'deadlift',
    session: makeSession('deadlift', 150, [5, 5, 5]),
  },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await router.push('/')
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link'))
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe('menu')
      expect(router.currentRoute.value.params.exercise).toBe('deadlift')
    })
  },
}
