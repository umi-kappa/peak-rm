import { estimateOneRm } from '@/core/oneRm'
import type { ReadonlySession } from '@/core/types'

/**
 * 1 Session 内の actualReps >= 1 のセットのみで 1RM を算出し、その最大値を返す。
 * セッションの結果によらず、実施済みセットはすべて対象に含める。
 * 対象セットが無い場合は 0（重量 0 kg でも式の値は 0 になる。算出可否の判定は oneRm の hasOneRm）。
 */
export function sessionMaxOneRm(session: ReadonlySession): number {
  return Math.max(
    0,
    ...session.results
      .filter((r) => r.actualReps >= 1)
      .map((r) => estimateOneRm(session.exercise, session.menu.weight, r.actualReps)),
  )
}

/**
 * 各セットの実績回数を `/` 連結した文字列（例: '8/8/7'）。前回記録の表示に使う。
 * スキップ（actualReps 0）も実績として記録対象のため、除外せずそのまま 0 を出す。
 */
export function formatSetReps(session: ReadonlySession): string {
  return session.results.map((r) => r.actualReps).join('/')
}

/**
 * 完遂（complete）の定義: 全セットが完了（results.length === menu.sets）し、
 * かつ全セットで actualReps >= menu.reps（目標回数）を満たすか。
 * results が menu.sets に満たない（＝中断）場合は false。
 * ドメイン規則（増量トリガー・repo の絞り込み）が参照する基底述語で、
 * 完遂判定はこれを唯一の source とする。
 */
export function isComplete(session: ReadonlySession): boolean {
  return (
    session.results.length === session.menu.sets &&
    session.results.every((r) => r.actualReps >= session.menu.reps)
  )
}

/**
 * セッション結果の 3 状態（spec「結果確認画面」のステータスマーカー）。
 * 「未実施セットあり」を先に切り出し、残りを isComplete で 2 分する表示専用の投影。
 * 3 状態の導出規則はこの型と sessionOutcome が持ち、ドメイン規則はこちらを参照しない:
 * aborted = 未実施セットあり（中断）/ finished = 全セット完走・目標未達（SESSION EXECUTED）/
 * complete = 完遂（SESSION COMPLETE）。ラベルへの写像は画面側が担う。
 */
export type SessionOutcome = 'aborted' | 'finished' | 'complete'

/** results と menu の実態から SessionOutcome を導出する。 */
export function sessionOutcome(session: ReadonlySession): SessionOutcome {
  if (session.results.length < session.menu.sets) return 'aborted'
  return isComplete(session) ? 'complete' : 'finished'
}
