import { db } from '@/storage/db'
import type { Exercise, MenuPreset } from '@/core/types'

export const menuPresetRepo = {
  /**
   * 種目のメニュープリセットを取得する。行が無ければ undefined。
   * 呼び出し側は undefined を「初回起動（該当種目の行が未保存）」として扱う。
   */
  async get(exercise: Exercise): Promise<MenuPreset | undefined> {
    return db.menuPresets.get(exercise)
  },

  /** メニュープリセットを upsert する（exercise キーで種目ごと 1 行）。 */
  async put(menuPreset: MenuPreset): Promise<void> {
    await db.menuPresets.put(menuPreset)
  },
}
