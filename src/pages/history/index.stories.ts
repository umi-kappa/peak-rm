import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import HistoryPage from '@/pages/history/index.vue'
import { sessionRepoInjectionKey, type SessionRepo } from '@/storage/sessionRepo'
import { storybookRouter as router } from '@/stories/router'
import { localStartedAt, makeSession, makeSessionRepo } from '@/stories/session'
import type { Session } from '@/core/types'

// 選択種目は route query から読むため、repo を用意する前に開始 route を確定する
const historyLoader = (repoSessions: Session[]) => async () => {
  await router.push('/history')
  return { sessionRepo: makeSessionRepo(repoSessions) }
}

// ベンチは 3 状態のバッジが並ぶように、スクワットは種目切り替えの確認用に 1 件だけ用意する
const sessions = [
  makeSession('benchPress', 82.5, [8, 8, 7], {
    id: 'bench-0512',
    startedAt: localStartedAt(2026, 5, 12),
  }),
  makeSession('benchPress', 80, [8, 8, 8], {
    id: 'bench-0509',
    startedAt: localStartedAt(2026, 5, 9),
  }),
  makeSession('benchPress', 80, [8, 8], {
    id: 'bench-0506',
    startedAt: localStartedAt(2026, 5, 6),
    sets: 3,
  }),
  makeSession('squat', 100, [8, 8, 8], {
    id: 'squat-0511',
    startedAt: localStartedAt(2026, 5, 11),
  }),
]

// 同日同種目に 2 セッションがある稀なケース。夕方の中断と朝の完遂が同じ日付ラベルで 2 行並ぶ
const sameDaySessions = [
  makeSession('benchPress', 80, [8, 8, 8], {
    id: 'bench-0512-morning',
    startedAt: localStartedAt(2026, 5, 12, 9),
  }),
  makeSession('benchPress', 85, [8], {
    id: 'bench-0512-evening',
    startedAt: localStartedAt(2026, 5, 12, 18),
    sets: 3,
  }),
]

const meta: Meta<typeof HistoryPage> = {
  component: HistoryPage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '履歴画面。種目タブで絞り込んだ 1RM 推移カードとセッション一覧（日付降順・実績のあるセッションを全件表示）を表示し、行タップで結果確認画面の履歴詳細へ遷移する。一覧は全件を出すのに対し、グラフは日付ごと 1 点に絞った直近 8 点を描く。データ源は provide された sessionRepo の `list` から読むため、stories は fake repo を provide して記録の有無を再現する。',
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

type Story = StoryObj<typeof HistoryPage>

// 記録がある通常状態（初期選択のベンチプレスに 3 状態のバッジが並ぶ）
export const Default: Story = {
  loaders: [historyLoader(sessions)],
}

// 初回起動（記録なし）。選択中の種目に記録が無いため NO SESSIONS を表示する
export const Empty: Story = {
  loaders: [historyLoader([])],
}

// 同日同種目の 2 セッションを一覧では集約せず両方表示し、グラフでは 1 点に畳む
// （どの実績も履歴詳細＝削除導線へ到達できる）。行と 1 点表示の見た目はそれぞれ
// Default と OneRmCard の SinglePoint が担うため snapshot は取らない
// （repo 層の無集約は sessionRepo.spec、一覧の素通しは useHistory.spec、
// 日付集約は chartData.spec が守る）
export const SameDay: Story = {
  loaders: [historyLoader(sameDaySessions)],
  parameters: { chromatic: { disableSnapshot: true } },
}

// repo の一覧が行に反映され（inject → load）、タブ選択で絞り込みが切り替わる配線を確認する。
// 並び順は sessionRepo.spec、絞り込みそのものは useHistory.spec が担う
export const Behavior: Story = {
  loaders: [historyLoader(sessions)],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // 同じ日付が 1RM グラフの日付軸にも出るため、行の確認は一覧の中に絞る
    // （見出しと section は mount 時からあり、非同期なのは中の行だけ）
    const sessionList = within(canvas.getByRole('region', { name: 'SESSIONS' }))

    // 一覧は onMounted の非同期読み込みで反映されるため waitFor で待つ
    await waitFor(() => {
      expect(sessionList.getByText('05/12')).toBeVisible()
    })

    // 見出しが region 名になる配線（aria-labelledby の id）と list セマンティクスの退行検出
    await expect(canvas.getByRole('region', { name: 'SESSIONS' })).toBeVisible()
    await expect(canvas.getByRole('list')).toBeVisible()

    // タブ選択は router 遷移（非同期）を経て一覧に反映されるため、こちらも waitFor で待つ
    await userEvent.click(canvas.getByRole('button', { name: 'SQUAT' }))
    await waitFor(() => {
      expect(sessionList.getByText('05/11')).toBeVisible()
      expect(sessionList.queryByText('05/12')).not.toBeInTheDocument()
    })
  },
}
