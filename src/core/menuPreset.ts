import { computeLinearProgression } from '@/core/linearProgression'
import type { Exercise, MenuPreset, Session } from '@/core/types'

// 初回起動時（menuPresets に該当種目の行が無い）に表示する全種目共通の初期値（spec §2）
export const DEFAULT_MENU_PRESET = {
  weight: 40,
  reps: 8,
  sets: 3,
  intervalSec: 90,
} as const satisfies Omit<MenuPreset, 'exercise'>

export type InitialMenu = {
  menu: MenuPreset
  /** Linear progression 成立時のみ。from = 前回ベースライン、to = 増量後（= menu.weight） */
  lpPreview?: { from: number; to: number }
}

/**
 * メニュー設定画面の初期表示値を導出する。
 * preset 無し（初回起動・データクリア直後）は共通初期値、あれば種目別の最後値をベースにし、
 * 重量には linear progression を適用する。増量が成立したときだけ lpPreview を返す
 * （executed 判定は computeLinearProgression の責務。ここでは差分の有無だけを見る）。
 */
export function resolveInitialMenu(
  exercise: Exercise,
  preset: MenuPreset | undefined,
  prevSession: Session | undefined,
): InitialMenu {
  const base = preset ?? { exercise, ...DEFAULT_MENU_PRESET }
  const weight = computeLinearProgression(prevSession, base.weight)
  if (weight === base.weight) return { menu: base }
  return { menu: { ...base, weight }, lpPreview: { from: base.weight, to: weight } }
}
