import { isExecuted } from '@/core/session'
import type { Exercise, Session } from '@/core/types'

const PROGRESSION_STEP_KG: Record<Exercise, number> = {
  benchPress: 2.5,
  squat: 5,
  deadlift: 5,
}

/**
 * Linear progression による次回メニューの重量を算出する。
 * 同一種目の直前セッションが executed なら baselineWeight に種目別増量幅を加算。
 * prev 無し（初回・データクリア・Import 直後）・失敗・中断は据え置き。
 *
 * 増量幅は prevSession.exercise から導出する（同一種目の直前セッションを渡す前提。
 * 種目を別引数で受けると prevSession.exercise と食い違うため受けない）。
 * baselineWeight は呼び出し側が menu_presets[exercise].weight を渡す
 * （手動編集の累積はその値に反映済み）。本関数はベースライン管理を持たない純関数。
 */
export function computeLinearProgression(
  prevSession: Session | null,
  baselineWeight: number,
): number {
  if (prevSession === null) return baselineWeight
  // status が executed かつ results も条件を満たすときだけ増量する
  if (prevSession.status === 'executed' && isExecuted(prevSession)) {
    return baselineWeight + PROGRESSION_STEP_KG[prevSession.exercise]
  }
  // aborted、および両者が食い違う異常データは据え置き
  return baselineWeight
}
