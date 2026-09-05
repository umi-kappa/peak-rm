import { computed, shallowRef } from 'vue'

import { computeLpPreview } from '@/core/linearProgression'
import { formatLocalDay } from '@/core/localDay'
import { hasOneRm, roundOneRm } from '@/core/oneRm'
import { sessionMaxOneRm, sessionOutcome } from '@/core/session'
import type { SessionStore } from '@/composables/shared/session/useSession'
import type { SessionRepo } from '@/storage/sessionRepo'
import type { ResultOrigin } from '@/router'
import type { SetResult, Session } from '@/core/types'

// 依存は inject 済みの実体を画面から受け取る（useSession の deps と同じく、テストでは fake を渡す）
export type ResultSessionDeps = {
  store: Pick<SessionStore, 'session' | 'patchResultAt'>
  repo: Pick<SessionRepo, 'get' | 'patchResults' | 'latestCompleteBefore' | 'remove'>
}

/**
 * 結果確認画面のデータ供給を origin 分岐込みで一本化するヘッドレス層。
 * session origin は実行中セッション store を参照し、history origin は repo から id でロードする。
 * 派生値（1RM・前回比・増量プレビュー・マーカー）はすべて computed で、実績編集に自動追従する。
 */
export function useResultSession(
  origin: ResultOrigin,
  sessionId: string | undefined,
  deps: ResultSessionDeps,
) {
  const { store, repo } = deps

  // history origin で repo からロードしたセッション。実行中セッションと同じく
  // shallowRef + イミュータブル更新にし、編集の再保存で reactive proxy を repo へ渡さない
  const loaded = shallowRef<Session>()
  // 同一種目で当該より前の直近の完遂セッション（前回比の基準）。無ければ undefined のまま
  const prev = shallowRef<Session>()

  const session = computed(() => (origin === 'session' ? store.session.value : loaded.value))

  /**
   * 非同期ロード（history origin のセッション本体と、両 origin の前回完遂セッション）。
   * 画面が onMounted で呼ぶ。表示対象が無ければ false を返し、画面が origin 別の出口へ逃がす
   * （history: id 不正・削除済み → 履歴一覧。session: Import 確定で実行中セッションが破棄済み → ホーム）。
   * 失敗（IndexedDB 例外）は catch せずエラー境界へ落とす
   */
  async function load(): Promise<boolean> {
    if (origin === 'history') {
      const found = sessionId === undefined ? undefined : await repo.get(sessionId)
      if (found === undefined) return false
      loaded.value = found
    }
    const current = session.value
    if (current === undefined) return false
    prev.value = await repo.latestCompleteBefore(current.exercise, current.startedAt)
    return true
  }

  // その日の推定 1RM（実績 0 回のセットは除外済み）。対象セットが無ければ 0
  const maxOneRm = computed(() => (session.value ? sessionMaxOneRm(session.value) : 0))

  // 前回完遂セッションの推定 1RM からの差分。前回が無い・当日の 1RM が算出できない（全セットスキップ等）なら
  // 比較不能として undefined（画面は非表示。算出可否の判定は core の hasOneRm に集約）。
  // 両端を表示桁へ丸めてから引く（1RM グラフの delta と同じ規則。生値の差は表示値の差と 0.1 ずれる）
  const delta = computed(() => {
    if (prev.value === undefined || !hasOneRm(maxOneRm.value)) return undefined
    return roundOneRm(maxOneRm.value) - roundOneRm(sessionMaxOneRm(prev.value))
  })

  // 次回増量プレビュー（今回の重量 → 増量後）。今回のセッション自身を「同一種目の直前セッション」
  // として判定する。履歴経由は常に非表示（過去のセッションに「次回」は存在しない。spec「結果確認画面」）
  const lpPreview = computed(() =>
    origin === 'session' ? computeLpPreview(session.value) : undefined,
  )

  // ステータスマーカーの 3 状態（導出規則は core の sessionOutcome）
  const marker = computed(() =>
    session.value === undefined ? undefined : sessionOutcome(session.value),
  )

  // 履歴詳細のヘッダ日付（ローカルタイムゾーン基準の YYYY/MM/DD）。
  // セッション経由は非表示（lpPreview と同じく origin 規則はここで判定し、画面は配線だけにする）
  const dayLabel = computed(() =>
    origin === 'history' && session.value !== undefined
      ? formatLocalDay(session.value.startedAt)
      : undefined,
  )

  // 履歴詳細は実績 read-only（メモのみ編集可。spec「結果確認画面」）。
  // 編集ポリシーは下の保存規則（patchResultAt の history 分岐）と対でここが持ち、画面は配線だけにする
  const repsReadonly = origin === 'history'

  // 実績・メモの編集。session origin は store へ委譲する。history origin は store を経由しないため、
  // loaded と repo を自分で更新する
  async function patchResultAt(index: number, patch: Partial<SetResult>) {
    if (origin === 'session') {
      await store.patchResultAt(index, patch)
      return
    }
    const current = loaded.value
    if (current === undefined) return
    if (index < 0 || index >= current.results.length) return
    // 実績 read-only は UI（repsReadonly）だけに頼らず保存規則でも守る。patch からメモだけを採る
    const memoPatch: Partial<SetResult> = patch.memo === undefined ? {} : { memo: patch.memo }
    const results = current.results.map((r, i) => (i === index ? { ...r, ...memoPatch } : r))
    await repo.patchResults(current.id, results)
    loaded.value = { ...current, results }
  }

  // 当該セッションを削除する（導線は履歴経由のみ。spec「結果確認画面」）
  async function remove() {
    const current = session.value
    if (current === undefined) return
    await repo.remove(current.id)
  }

  return {
    session,
    marker,
    maxOneRm,
    delta,
    lpPreview,
    dayLabel,
    repsReadonly,
    load,
    patchResultAt,
    remove,
  }
}
