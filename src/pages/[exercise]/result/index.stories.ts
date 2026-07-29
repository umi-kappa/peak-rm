import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import ResultPage from '@/pages/[exercise]/result/index.vue'
import { sessionInjectionKey, type SessionStore } from '@/composables/shared/session/useSession'
import { sessionRepoInjectionKey, type SessionRepo } from '@/storage/sessionRepo'
import { localStartedAt, makeSession, makeSessionRepo, makeSessionStore } from '@/stories/session'
import { storybookRouter as router } from '@/stories/router'

// セッション経由（完了・中断直後）の loaders。route を先に確定してから store / repo を用意する。
// prevWeight を渡すと前回の完遂セッションの fixture が入り、前回比 delta が表示される
const sessionOriginLoader = (completedReps: number[], prevWeight?: number) => async () => {
  await router.push('/benchPress/result?origin=session')
  return {
    sessionStore: await makeSessionStore({ completedReps }),
    sessionRepo: makeSessionRepo(
      prevWeight === undefined
        ? []
        : [makeSession('benchPress', prevWeight, [8, 8, 8], { id: 'prev' })],
    ),
  }
}

// 履歴経由の過去セッション fixture（2025/05/12・完遂）。履歴系 stories で共有する
const makePastSession = (memo = '') => {
  const past = makeSession('benchPress', 82.5, [8, 8, 8], {
    id: 'past',
    startedAt: localStartedAt(2025, 5, 12),
  })
  past.results[0]!.memo = memo
  return past
}

// 履歴経由の loaders。route を確定し、repo に past（withPrev で前回の完遂セッションも）を置く。
// wrapRepo は Behavior が repo 関数を fn() スパイへ差し替えるための seam
const historyOriginLoader =
  (
    options: {
      memo?: string
      withPrev?: boolean
      wrapRepo?: (repo: SessionRepo) => SessionRepo
    } = {},
  ) =>
  async () => {
    const sessions = [makePastSession(options.memo)]
    if (options.withPrev) {
      sessions.push(
        makeSession('benchPress', 80, [8, 8, 8], {
          id: 'prev',
          startedAt: localStartedAt(2025, 5, 9),
        }),
      )
    }
    await router.push('/benchPress/result?origin=history&id=past')
    const repo = makeSessionRepo(sessions)
    return {
      sessionStore: await makeSessionStore({}),
      sessionRepo: options.wrapRepo?.(repo) ?? repo,
    }
  }

const meta: Meta<typeof ResultPage> = {
  component: ResultPage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '結果確認画面。ステータスマーカー（3 状態）・推定 1RM・前回比 delta・次回増量プレビュー・セット一覧を表示する。origin（route.query）で分岐し、セッション経由は下部 FINISH でホームへ、履歴経由はヘッダーの ← / 削除と日付表示・実績 read-only（メモは編集可）になる。',
      },
    },
  },
  decorators: [
    (_story, context) => ({
      setup() {
        provide(sessionInjectionKey, context.loaded.sessionStore as SessionStore)
        provide(sessionRepoInjectionKey, context.loaded.sessionRepo as SessionRepo)
      },
      template: '<story />',
    }),
  ],
}

export default meta

type Story = StoryObj<typeof ResultPage>

// 完遂（SESSION COMPLETE + 前回比 + 次回増量プレビュー + FINISH）
export const Default: Story = {
  loaders: [sessionOriginLoader([8, 8, 8], 80)],
}

// 中断（SESSION ABORTED + 未実施セットの pending 表示 + 前回比マイナス）
export const Aborted: Story = {
  loaders: [sessionOriginLoader([8], 85)],
}

// 完走・目標未達（SESSION EXECUTED。全セット done だが最終セットが目標未達で完遂にならない。
// 次回増量プレビューは出ない）
export const Finished: Story = {
  loaders: [sessionOriginLoader([8, 8, 7], 80)],
}

// 全セットスキップ（推定 1RM 0 → — 表示・前回比バッジは非表示）
export const AllSkipped: Story = {
  loaders: [sessionOriginLoader([0, 0, 0])],
}

// 履歴詳細（日付 + マーカー + 削除アクション。FINISH と増量プレビューは出ない）
export const HistoryDetail: Story = {
  loaders: [historyOriginLoader({ memo: 'フォーム良し', withPrev: true })],
}

// 完了セットのカードタップ → 編集 → SAVE → store（patchResultAt）へ反映されモーダルが閉じる配線と、
// FINISH でホームへ戻る完了フロー終端の配線を確認する
export const SetEditBehavior: Story = {
  loaders: [sessionOriginLoader([8, 8, 8], 80)],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    // SET 3 の done カード（アクセシブルネームは「3 8 REPS」）を開いて編集する
    await userEvent.click(await canvas.findByRole('button', { name: /^3 8 REPS/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }))
    await userEvent.click(canvas.getByRole('button', { name: 'SAVE' }))
    await waitFor(() => {
      const store = loaded.sessionStore as SessionStore
      expect(store.session.value?.results.at(2)).toEqual({ actualReps: 9, memo: '' })
      expect(canvas.queryByRole('dialog')).toBeNull()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'FINISH' }))
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe('home')
    })
  },
}

// 履歴経由の編集モーダルは実績 read-only（ステッパー非表示）のままメモを編集でき、
// 保存が repo.patchResults に届いて画面に反映される配線を確認する（#37 申し送りの origin 分岐）
export const HistoryEditBehavior: Story = {
  loaders: [
    historyOriginLoader({ wrapRepo: (repo) => ({ ...repo, patchResults: fn(repo.patchResults) }) }),
  ],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: /^1 8 REPS/ }))
    expect(canvas.queryByRole('button', { name: 'Increase' })).toBeNull()
    await userEvent.type(canvas.getByRole('textbox', { name: 'NOTE' }), '重かった')
    await userEvent.click(canvas.getByRole('button', { name: 'SAVE' }))
    await waitFor(() => {
      const repo = loaded.sessionRepo as SessionRepo
      expect(repo.patchResults).toHaveBeenCalledWith('past', [
        { actualReps: 8, memo: '重かった' },
        { actualReps: 8, memo: '' },
        { actualReps: 8, memo: '' },
      ])
      expect(canvas.getByText('重かった')).toBeInTheDocument()
    })
  },
}

// 削除アクション → 確認ダイアログ → 確定で repo.remove が呼ばれ履歴一覧へ戻る配線を確認する
export const DeleteBehavior: Story = {
  loaders: [historyOriginLoader({ wrapRepo: (repo) => ({ ...repo, remove: fn(repo.remove) }) })],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Delete' }))
    await userEvent.click(canvas.getByRole('button', { name: '削除する' }))
    await waitFor(() => {
      const repo = loaded.sessionRepo as SessionRepo
      expect(repo.remove).toHaveBeenCalledWith('past')
      expect(router.currentRoute.value.name).toBe('history')
    })
  },
}
