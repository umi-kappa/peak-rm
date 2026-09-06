import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test'
import TrainingPage from '@/pages/[exercise]/training/index.vue'
import { sessionInjectionKey, type SessionStore } from '@/composables/shared/session/useSession'
import {
  sessionLeaveConfirmInjectionKey,
  useSessionLeaveConfirm,
  type SessionLeaveConfirmStore,
} from '@/composables/shared/session/useSessionLeaveConfirm'
import { audioCueInjectionKey, type AudioCueStore } from '@/composables/shared/platform/useAudioCue'
import { makeSessionStore } from '@/stories/session'
import { makeAudioCue } from '@/stories/platform'
import { storybookRouter as router } from '@/stories/router'

// 各 story 共通の loader を作る。セット完了で AudioContext を起こし直す配線があるため、
// 音を鳴らさない fake の再生口も併せて用意する。離脱確認は実物（ブラウザ API に依存しない）を渡す
function loadTrainingPage(completedReps: number[]) {
  return async () => ({
    sessionStore: await makeSessionStore({ completedReps, phase: 'setActive' }),
    audioCue: makeAudioCue(),
    leaveConfirm: useSessionLeaveConfirm(),
  })
}

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
        provide(
          sessionLeaveConfirmInjectionKey,
          context.loaded.leaveConfirm as SessionLeaveConfirmStore,
        )
        provide(audioCueInjectionKey, context.loaded.audioCue as AudioCueStore)
      },
      template: '<story />',
    }),
  ],
}

export default meta

type Story = StoryObj<typeof TrainingPage>

// 3 セット中の 2 セット目を実行中（1 セット完了済み）
export const Default: Story = {
  loaders: [loadTrainingPage([8])],
}

// 最終セットはコンテキスト行が FINAL SET（accent）になり、CTA が FINISH SESSION に変わる
export const FinalSet: Story = {
  loaders: [loadTrainingPage([8, 8])],
}

// セット完了 → phase が interval になり interval 画面へ遷移する配線と、
// 同じタップで AudioContext を起こし直す配線だけを確認する
export const Behavior: Story = {
  loaders: [loadTrainingPage([8])],
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
    // 中断状態からの復帰はユーザージェスチャ内でしか許されないため、このタップで呼ぶ
    expect((loaded.audioCue as AudioCueStore).prepare).toHaveBeenCalled()
  },
}

// セット完了の書き込みを待つ間に離脱確認が開いたら、答えの前後を問わずこの画面からは遷移しない配線を
// 確認する（行き先は router のガードが決める。stories の router にはガードが無いため、遷移しないことだけ見る）。
// 書き込みが終わらない session store を渡し、開く → 答える → 書き込み完了、の本番の順序を作る
export const LeaveConfirmDuringWriteBehavior: Story = {
  loaders: [
    async () => {
      const loaded = await loadTrainingPage([8])()
      let finishWrite = () => {}
      const sessionStore: SessionStore = {
        ...loaded.sessionStore,
        completeSet: async () => {
          await new Promise<void>((resolve) => {
            finishWrite = resolve
          })
          await loaded.sessionStore.completeSet()
        },
      }
      return { ...loaded, sessionStore, finishWrite: () => finishWrite() }
    },
  ],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    await router.push('/benchPress/training')
    const leaveConfirm = loaded.leaveConfirm as SessionLeaveConfirmStore
    const canvas = within(canvasElement)
    // 遷移が起きないことの確認なので、route の変化を待つのでなく発行そのものを見る
    const replace = spyOn(router, 'replace')
    try {
      // 書き込みが終わらないうちに戻るで離脱確認が開き、ユーザーが答える
      await userEvent.click(canvas.getByRole('button', { name: 'COMPLETE SET' }))
      const asked = leaveConfirm.request()
      leaveConfirm.cancel()
      await expect(asked).resolves.toBe(false)
      ;(loaded.finishWrite as () => void)()
      await waitFor(() => {
        expect((loaded.sessionStore as SessionStore).phase.value).toBe('interval')
      })
      expect(replace).not.toHaveBeenCalled()
    } finally {
      replace.mockRestore()
    }
  },
}
