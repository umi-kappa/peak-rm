import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, waitFor, within } from 'storybook/test'
import HomePage from '@/pages/home/index.vue'
import { sessionRepoInjectionKey, type SessionRepo } from '@/storage/sessionRepo'
import { flushLoad } from '@/stories/flush'
import { makeSession, makeSessionRepo } from '@/stories/session'

const meta: Meta<typeof HomePage> = {
  component: HomePage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'ホーム画面。種目ごとの直前セッション（推定 1RM + 前回記録）をカードで一覧し、下部に履歴への導線を置く。データ源は provide された sessionRepo から読むため、stories は fake repo を provide して記録の有無を再現する。カードタップの遷移配線は ExerciseCard の Behavior が担う。',
      },
    },
  },
  decorators: [
    (_story, context) => ({
      setup() {
        provide(sessionRepoInjectionKey, context.loaded.sessionRepo as SessionRepo)
      },
      template: '<story />',
    }),
  ],
}

export default meta

type Story = StoryObj<typeof HomePage>

// 全種目に記録がある通常状態
export const Default: Story = {
  loaders: [
    () => ({
      sessionRepo: makeSessionRepo([
        makeSession('benchPress', 82.5, [8, 8, 7]),
        makeSession('squat', 100, [8, 8, 8]),
        makeSession('deadlift', 150, [5, 5, 5]),
      ]),
    }),
  ],
}

// 初回起動（記録なし）。全カードが未記録表示（— / NO LOG）になる
export const Empty: Story = {
  loaders: [() => ({ sessionRepo: makeSessionRepo() })],
}

// 直前セッションの読み込み中。カードの枠・種目名・ラベルだけ出し、値欄は空のまま Default と同じ高さを保つ
export const Loading: Story = {
  loaders: [() => ({ sessionRepo: makeSessionRepo([], { pending: true }) })],
}

// 未読込を未記録に見せない規則（spec「読み込み中の表示」）は視覚差分では守れないため assert する
export const LoadingBehavior: Story = {
  loaders: [() => ({ sessionRepo: makeSessionRepo([], { pending: true }) })],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await flushLoad()
    await expect(canvas.queryByText('NO LOG')).toBeNull()
  },
}

// provide した repo の直前セッションがカードに表示される配線（inject → loadSessions）だけを確認する。
// カードタップの遷移は ExerciseCard の Behavior が担う。
// 99.0 は fixture 由来の推定 1RM（82.5 kg × (1 + 8 / 40)）で、記録なし表示（—）では現れない値
export const Behavior: Story = {
  loaders: [
    () => ({
      sessionRepo: makeSessionRepo([makeSession('benchPress', 82.5, [8, 8, 7])]),
    }),
  ],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // 直前セッションは onMounted の非同期読み込みで反映されるため waitFor で待つ
    await waitFor(() => {
      expect(canvas.getByText('99.0')).toBeVisible()
    })
  },
}
