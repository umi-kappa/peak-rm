import { isComplete } from '@/core/session'
import type { Exercise, ReadonlySession } from '@/core/types'

const PROGRESSION_STEP_KG: Record<Exercise, number> = {
  benchPress: 2.5,
  squat: 5,
  deadlift: 5,
}

/**
 * Linear progression による次回メニューの重量を算出する。
 * 同一種目の直前セッションが完遂（isComplete）なら menu.weight に種目別増量幅を加算した値を返す。
 * 不成立（prev 無し・失敗・中断）は undefined を返し、呼び出し側が据え置きを決める。
 *
 * ベースライン・増量幅とも prevSession から導出する（同一種目の直前セッションを渡す前提。
 * 手動編集はセッションの menu に焼き込まれて累積する）。
 */
export function computeLinearProgression(
  prevSession: ReadonlySession | undefined,
): number | undefined {
  if (prevSession === undefined || !isComplete(prevSession)) return undefined
  return prevSession.menu.weight + PROGRESSION_STEP_KG[prevSession.exercise]
}

/** Linear progression 成立時の増量プレビュー。from = 前回ベースライン、to = 増量後 */
export type LpPreview = { from: number; to: number }

/**
 * LpIndicator へ渡す増量プレビュー（増量前 → 増量後のペア）を導出する。
 * 成立判定は computeLinearProgression に委ね、不成立（据え置き）は undefined を返す。
 */
export function computeLpPreview(prevSession: ReadonlySession | undefined): LpPreview | undefined {
  if (prevSession === undefined) return undefined
  const to = computeLinearProgression(prevSession)
  if (to === undefined) return undefined
  return { from: prevSession.menu.weight, to }
}
