import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { buildOneRmChartData } from '@/core/chartData'
import { EXERCISE_ORDER, isExercise } from '@/core/constants'
import type { SessionRepo } from '@/storage/sessionRepo'
import type { Exercise, Session } from '@/core/types'

// 依存は inject 済みの実体を画面から受け取る（useResultSession と同じく、テストでは fake を渡す）
export type HistoryDeps = {
  repo: Pick<SessionRepo, 'list'>
}

/**
 * 履歴画面のデータ供給（種目タブの選択・一覧の絞り込み・1RM グラフの変換）を担うヘッドレス層。
 * 一覧は repo の list（全セッションの startedAt 降順）をそのまま使う。
 */
export function useHistory(deps: HistoryDeps) {
  const { repo } = deps
  const route = useRoute()
  const router = useRouter()

  // 全種目分の一覧。要素は書き換えず入れ替えのみのため shallowRef で持つ
  const all = shallowRef<Session[]>([])

  // 選択中の種目は URL に持たせ、履歴詳細から戻っても（= 画面が再マウントされても）絞り込みを保つ。
  // 未指定・不正な値はタブ先頭（ベンチプレス）にフォールバックする
  const exercise = computed<Exercise>(() =>
    isExercise(route.query.exercise) ? route.query.exercise : EXERCISE_ORDER[0],
  )

  const sessions = computed(() => all.value.filter((s) => s.exercise === exercise.value))

  // グラフは一覧と同じ絞り込み結果から作る（日付集約と区間の切り出しは chartData に閉じている）。
  // 記録が 1 点も無い種目では undefined になり、画面はカードごと出さない
  const chart = computed(() => buildOneRmChartData(sessions.value))

  // 種目の切り替えで履歴を積まない（← が種目切り替えの巻き戻しにならないようにする）
  function selectExercise(value: Exercise) {
    router.replace({ query: { exercise: value } })
  }

  // 画面が onMounted で呼ぶ。失敗（IndexedDB 例外）は catch せずエラー境界へ落とす
  async function load() {
    all.value = await repo.list()
  }

  return { exercise, sessions, chart, selectExercise, load }
}
