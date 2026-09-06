import { computeLpPreview, type LpPreview } from '@/core/linearProgression'
import type { Exercise, Menu, Session } from '@/core/types'

// 初回起動時（同一種目のセッションが 1 件も無い）に表示する全種目共通の初期値（spec §2）
export const DEFAULT_MENU = {
  weight: 40,
  reps: 8,
  sets: 3,
  intervalSec: 90,
} as const satisfies Omit<Menu, 'exercise'>

// メニュー設定ステッパーの下限（spec §2「設定項目」表）。UI と Import 検証の両方がここを読む
export const MENU_MIN = {
  weight: 0,
  reps: 1,
  sets: 1,
  intervalSec: 0,
} as const satisfies Omit<Menu, 'exercise'>

// メニュー設定ステッパーの上限。想定ユーザー向けの UX レンジではなく、現実的に
// あり得ない値だけを弾く安全弁。表示桁数の MAX を基準に統一する（spec §2）
export const MENU_MAX = {
  weight: 999,
  reps: 99,
  sets: 99,
  intervalSec: 990,
} as const satisfies Omit<Menu, 'exercise'>

export type InitialMenu = {
  menu: Menu
  /** Linear progression 成立時のみ（to = menu.weight） */
  lpPreview?: LpPreview
}

/**
 * メニュー設定画面の初期表示値を導出する。
 * 直前セッション無し（初回起動・データクリア直後）は共通初期値、あれば直前セッション
 * （中断含む）の menu をベースにし、重量には linear progression を適用する。
 * 増量が成立したときだけ lpPreview を返す
 * （成立判定は computeLpPreview の責務。undefined は据え置き）。
 * 返す menu は画面上で編集されるため、prevSession.menu（Readonly）のコピーを返す。
 */
export function resolveInitialMenu(
  exercise: Exercise,
  prevSession: Session | undefined,
): InitialMenu {
  // 種目フィールドだけは常に引数を勝たせる。呼び出し側は同一種目の直前セッションを渡す約束だが、
  // 食い違ったときに prevSession.menu.exercise が静かに勝って記録上の種目が URL と食い違うのを防ぐ
  //（数値と増量幅は約束どおり prevSession 由来のまま）
  const base: Menu = prevSession ? { ...prevSession.menu, exercise } : { exercise, ...DEFAULT_MENU }
  const lpPreview = computeLpPreview(prevSession)
  if (lpPreview === undefined) return { menu: base }
  return { menu: { ...base, weight: lpPreview.to }, lpPreview }
}
