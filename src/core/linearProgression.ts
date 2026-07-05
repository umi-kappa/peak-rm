import { isExecuted } from '@/core/session'
import type { Exercise, Session } from '@/core/types'

const PROGRESSION_STEP_KG: Record<Exercise, number> = {
  benchPress: 2.5,
  squat: 5,
  deadlift: 5,
}

/**
 * Linear progression による次回メニューの重量を算出する。
 * 同一種目の直前セッションが executed なら menu.weight に種目別増量幅を加算した値を返す。
 * 不成立（prev 無し・失敗・中断）は undefined を返し、呼び出し側が据え置きを決める。
 *
 * ベースライン・増量幅とも prevSession から導出する（同一種目の直前セッションを渡す前提。
 * 手動編集はセッションの menu に焼き込まれて累積する）。
 */
export function computeLinearProgression(prevSession: Session | undefined): number | undefined {
  if (prevSession === undefined) return undefined
  // status が executed かつ results も条件を満たすときだけ増量する
  if (prevSession.status === 'executed' && isExecuted(prevSession)) {
    return prevSession.menu.weight + PROGRESSION_STEP_KG[prevSession.exercise]
  }
  // aborted、および両者が食い違う異常データは据え置き
  return undefined
}
