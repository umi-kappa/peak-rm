import { computeLinearProgression } from '@/core/linearProgression'
import type { Exercise, MenuPreset, Session } from '@/core/types'

// 初回起動時（同一種目のセッションが 1 件も無い）に表示する全種目共通の初期値（spec §2）
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
 * 直前セッション無し（初回起動・データクリア直後）は共通初期値、あれば直前セッション
 * （中断含む）の menu をベースにし、重量には linear progression を適用する。
 * 増量が成立したときだけ lpPreview を返す
 * （成立判定は computeLinearProgression の責務。undefined は据え置き）。
 * 返す menu は画面上で編集されるため、prevSession.menu（Readonly）のコピーを返す。
 */
export function resolveInitialMenu(
  exercise: Exercise,
  prevSession: Session | undefined,
): InitialMenu {
  // exercise は直前セッションが無いときの共通初期値スタンプ専用。
  // 直前セッションがあれば prevSession.menu.exercise が支配的で exercise は使われない。
  const base: MenuPreset = prevSession
    ? { ...prevSession.menu }
    : { exercise, ...DEFAULT_MENU_PRESET }
  const weight = computeLinearProgression(prevSession)
  if (weight === undefined) return { menu: base }
  return { menu: { ...base, weight }, lpPreview: { from: base.weight, to: weight } }
}
