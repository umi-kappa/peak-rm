import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import IntervalPage from '@/pages/[exercise]/interval/index.vue'
import type { Menu } from '@/core/types'
import { sessionInjectionKey, type SessionStore } from '@/composables/shared/session/useSession'
import { intervalTimerDepsInjectionKey } from '@/composables/shared/session/useIntervalTimer'
import { audioCueInjectionKey, type AudioCueStore } from '@/composables/shared/platform/useAudioCue'
import { makeSessionStore } from '@/stories/session'
import { makeAudioCue } from '@/stories/platform'
import { storybookRouter as router } from '@/stories/router'

// 実時間で進むタイマーを「開始から elapsedMs 経過」で凍結する固定時計を注入し、snapshot を決定的にする。
// 初回の now() は start() の開始時刻取得なので 0 を返し、以降の tick には固定の経過時刻を返し続ける
const freezeTimerAt = (elapsedMs: number) => () => ({
  setup() {
    let started = false
    provide(intervalTimerDepsInjectionKey, {
      now: () => {
        if (started) return elapsedMs
        started = true
        return 0
      },
    })
  },
  template: '<story />',
})

// 各 story 共通の loader を作る。4 セット中 2 セット完了直後（インターバル中）の状態を作り、
// 通知音は鳴らさない fake に差し替える
function loadIntervalPage(menu?: Partial<Menu>) {
  return async () => ({
    sessionStore: await makeSessionStore({ menu: { sets: 4, ...menu }, completedReps: [8, 8] }),
    audioCue: makeAudioCue(),
  })
}

const meta: Meta<typeof IntervalPage> = {
  component: IntervalPage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'インターバル画面。マウントで事前設定値のタイマーが自動開始し、0 秒到達後は +超過時間（上限 +3:00）を受動表示する。完了済みセットのタイムラインと NEXT SET / END SESSION（中断・確認ダイアログ経由）を置く。visual story は固定時計を注入してタイマー表示を凍結し、snapshot を決定的にしている。',
      },
    },
  },
  decorators: [
    (_story, context) => ({
      setup() {
        provide(sessionInjectionKey, context.loaded.sessionStore as SessionStore)
        provide(audioCueInjectionKey, context.loaded.audioCue as AudioCueStore)
      },
      template: '<story />',
    }),
  ],
}

export default meta

type Story = StoryObj<typeof IntervalPage>

// 2 セット完了直後のインターバル中。タイマーは残り 0:56.88 で凍結する
export const Default: Story = {
  loaders: [loadIntervalPage()],
  decorators: [freezeTimerAt(33_120)],
}

// インターバル 0 秒到達後の超過表示（intervalSec: 0 で開始時点から超過中）。+0:12.47 で凍結する
export const Overrun: Story = {
  loaders: [loadIntervalPage({ intervalSec: 0 })],
  decorators: [freezeTimerAt(12_470)],
}

// 完了セットのカードタップ → 編集モーダル → SAVE → patchResultAt でセッションが更新され
// モーダルが閉じる、というページ側の配線を確認する（部品単体の挙動は各コンポーネントの Behavior が担う）
export const SetEditBehavior: Story = {
  loaders: [loadIntervalPage()],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    // ページは遷移先の :exercise を route.params から引き継ぐため、実際のルート上に置いてから操作する
    await router.push('/benchPress/interval')
    const canvas = within(canvasElement)
    // SET 1 の done カード（アクセシブルネームは「1 8 REPS ADD NOTE」）を開いて編集する
    await userEvent.click(canvas.getByRole('button', { name: /^1 8 REPS/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }))
    await userEvent.type(canvas.getByRole('textbox', { name: 'NOTE' }), 'フォームを意識した')
    await userEvent.click(canvas.getByRole('button', { name: 'SAVE' }))
    await waitFor(() => {
      const store = loaded.sessionStore as SessionStore
      expect(store.session.value?.results.at(0)).toEqual({
        actualReps: 9,
        memo: 'フォームを意識した',
      })
      expect(canvas.queryByRole('dialog')).toBeNull()
    })
  },
}

// END SESSION → 確認ダイアログ → 確定で phase が done になり結果確認へ遷移する配線だけを確認する
export const Behavior: Story = {
  loaders: [loadIntervalPage()],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    // ページは遷移先の :exercise を route.params から引き継ぐため、実際のルート上に置いてから操作する
    await router.push('/benchPress/interval')
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'END SESSION' }))
    await userEvent.click(canvas.getByRole('button', { name: '中断する' }))
    await waitFor(() => {
      const store = loaded.sessionStore as SessionStore
      expect(store.phase.value).toBe('done')
      expect(router.currentRoute.value.name).toBe('result')
      expect(router.currentRoute.value.query.origin).toBe('session')
    })
  },
}

// 0 秒到達でアラームを鳴らし始め、停止ボタンで止めるまでの配線を確認する
//（鳴り方・停止の即時性は useAudioCue が担う）。
// 90 秒のインターバルを超過後の時刻で凍結し、最初の tick で 0 秒到達させる
export const AudioCueBehavior: Story = {
  loaders: [loadIntervalPage()],
  parameters: { chromatic: { disableSnapshot: true } },
  decorators: [freezeTimerAt(95_000)],
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const audioCue = loaded.audioCue as AudioCueStore
    const stopAlarm = canvas.getByRole('button', { name: 'Stop alarm' })
    await waitFor(() => {
      expect(audioCue.start).toHaveBeenCalledTimes(1)
      // 鳴り始めると押せるようになる
      expect(stopAlarm).toBeEnabled()
    })
    await userEvent.click(stopAlarm)
    await waitFor(() => {
      expect(audioCue.stop).toHaveBeenCalledTimes(1)
      expect(stopAlarm).toBeDisabled()
    })
  },
}
