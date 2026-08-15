import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import MenuPage from '@/pages/[exercise]/menu/index.vue'
import {
  sessionInjectionKey,
  useSession,
  type SessionStore,
} from '@/composables/shared/session/useSession'
import { sessionRepoInjectionKey, type SessionRepo } from '@/storage/sessionRepo'
import { audioCueInjectionKey, type AudioCueStore } from '@/composables/shared/platform/useAudioCue'
import { wakeLockInjectionKey, type WakeLockStore } from '@/composables/shared/platform/useWakeLock'
import { makeSession, makeSessionRepo } from '@/stories/session'
import { makeAudioCue, makeWakeLock } from '@/stories/platform'
import { storybookRouter as router } from '@/stories/router'

// 各 story 共通の loader を作る。メニュー画面は route.params.exercise を型ガードして描画する
// （不正値はホームへ逃がす）ため、training / interval と違い visual story でも描画前に実ルートへ置く。
// 直前セッションの有無は sessions の fixture で再現する。session store はトレーニング開始前の
// 画面なので idle のまま渡す。開始時のブラウザ API 副作用は fake に差し替える
function loadMenuPage(sessions?: Parameters<typeof makeSessionRepo>[0]) {
  return async () => {
    await router.push('/benchPress/menu')
    const sessionRepo = makeSessionRepo(sessions)
    return {
      sessionRepo,
      sessionStore: useSession({ sessionRepo }),
      audioCue: makeAudioCue(),
      wakeLock: makeWakeLock(),
    }
  }
}

const meta: Meta<typeof MenuPage> = {
  component: MenuPage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'メニュー設定画面。直前セッションの menu をベースに linear progression を適用した初期値を表示し、重量・回数・セット数・インターバルを編集して START SESSION でトレーニングを開始する。データ源は provide された sessionRepo から読むため、stories は fake repo を provide して直前セッションの有無を再現する。',
      },
    },
  },
  decorators: [
    (_story, context) => ({
      setup() {
        provide(sessionInjectionKey, context.loaded.sessionStore as SessionStore)
        provide(sessionRepoInjectionKey, context.loaded.sessionRepo as SessionRepo)
        provide(audioCueInjectionKey, context.loaded.audioCue as AudioCueStore)
        provide(wakeLockInjectionKey, context.loaded.wakeLock as WakeLockStore)
      },
      template: '<story />',
    }),
  ],
}

export default meta

type Story = StoryObj<typeof MenuPage>

// 直前セッション（82.5 kg 完遂）から増量した状態。LP プレビュー（82.5 → 85）が出る
export const Default: Story = {
  loaders: [loadMenuPage([makeSession('benchPress', 82.5, [8, 8, 8])])],
}

// 初回起動（直前セッションなし）。全種目共通の初期値 40 kg / 8 回 / 3 セット / 90 秒を表示し、
// LP プレビューは出ない
export const FirstRun: Story = {
  loaders: [loadMenuPage()],
}

// START SESSION → session.start（menu 焼き込み・setActive へ）+ training へ replace する配線と、
// 同じジェスチャ内で AudioContext の準備 / Wake Lock 取得を呼ぶ配線だけを確認する
export const Behavior: Story = {
  loaders: [loadMenuPage()],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    // START SESSION は onMounted の非同期読み込み後（v-if="menu"）に現れるため findBy で待つ
    await userEvent.click(await canvas.findByRole('button', { name: 'START SESSION' }))
    await waitFor(() => {
      const store = loaded.sessionStore as SessionStore
      expect(store.phase.value).toBe('setActive')
      expect(store.session.value?.menu.weight).toBe(40)
      expect(router.currentRoute.value.name).toBe('training')
      expect(router.currentRoute.value.params.exercise).toBe('benchPress')
      expect((loaded.audioCue as AudioCueStore).prepare).toHaveBeenCalled()
      expect((loaded.wakeLock as WakeLockStore).acquire).toHaveBeenCalled()
    })
  },
}
