import { estimateOneRm } from '@/core/oneRm'
import type { Session } from '@/core/types'

/**
 * 1 Session 内の actualReps >= 1 のセットのみで 1RM を算出し、その最大値を返す。
 * status は見ず results のみで計算する（aborted でも実施済みセットは対象に含める）。
 * 対象セットが無い場合は 0。
 */
export function sessionMaxOneRm(session: Session): number {
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
export function formatSetReps(session: Session): string {
  return session.results.map((r) => r.actualReps).join('/')
}

/**
 * executed の定義: 全セットが完了（results.length === menu.sets）し、
 * かつ全セットで actualReps >= menu.reps（目標回数）を満たすか。
 * results が menu.sets に満たない（＝中断）場合は false。
 */
export function isExecuted(session: Session): boolean {
  return (
    session.results.length === session.menu.sets &&
    session.results.every((r) => r.actualReps >= session.menu.reps)
  )
}
