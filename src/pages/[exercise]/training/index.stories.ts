import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import TrainingPage from '@/pages/[exercise]/training/index.vue'
import { sessionInjectionKey, type SessionStore } from '@/composables/shared/session/useSession'
import { makeSessionStore } from '@/stories/session'
import { storybookRouter as router } from '@/stories/router'

const meta: Meta<typeof TrainingPage> = {
  component: TrainingPage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'トレーニング画面。現在セットの処方（Session.menu に焼き込んだ重量 × 目標回数）をヒーロー表示し、実績回数ステッパーとセット完了だけを置く。重量・メニューの変更 UI は持たない（トレーニング中変更不可）。セッション状態は loaders で駆動した useSession を provide して再現する。',
      },
    },
  },
  decorators: [
    (_story, context) => ({
      setup() {
        provide(sessionInjectionKey, context.loaded.sessionStore as SessionStore)
      },
      template: '<story />',
    }),
  ],
}

export default meta

type Story = StoryObj<typeof TrainingPage>

// 3 セット中の 2 セット目を実行中（1 セット完了済み）
export const Default: Story = {
  loaders: [
    async () => ({
      sessionStore: await makeSessionStore({ completedReps: [8], phase: 'setActive' }),
    }),
  ],
}

// 最終セットはコンテキスト行が FINAL SET（accent）になり、CTA が FINISH SESSION に変わる
export const FinalSet: Story = {
  loaders: [
    async () => ({
      sessionStore: await makeSessionStore({ completedReps: [8, 8], phase: 'setActive' }),
    }),
  ],
}

// セット完了 → phase が interval になり interval 画面へ遷移する配線だけを確認する
export const Behavior: Story = {
  loaders: [
    async () => ({
      sessionStore: await makeSessionStore({ completedReps: [8], phase: 'setActive' }),
    }),
  ],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    // ページは遷移先の :exercise を route.params から引き継ぐため、実際のルート上に置いてから操作する
    await router.push('/benchPress/training')
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'COMPLETE SET' }))
    await waitFor(() => {
      const store = loaded.sessionStore as SessionStore
      expect(store.phase.value).toBe('interval')
      expect(router.currentRoute.value.name).toBe('interval')
    })
  },
}
