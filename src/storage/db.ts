import Dexie, { type Table } from 'dexie'

import type { Exercise, MenuPreset, Session } from '@/core/types'

/**
 * PeakRM の IndexedDB スキーマ定義。
 * sessions: Session を主キー id で保存。startedAt に単独 index（全件降順一覧のため）、
 *   [exercise+startedAt] 複合 index（同種目の直前 1 件を DB 側で末尾取得するため）。
 * menuPresets: MenuPreset を主キー exercise で保存（種目ごと 1 行・行の有無で初回判定）。
 */
class PeakDexie extends Dexie {
  sessions!: Table<Session, string>
  menuPresets!: Table<MenuPreset, Exercise>

  constructor() {
    super('peak-rm')
    // version().stores() が同名プロパティ（sessions / menuPresets）に Table を自動バインドする。
    this.version(1).stores({
      sessions: 'id, startedAt, [exercise+startedAt]',
      menuPresets: 'exercise',
    })
  }
}

export const db = new PeakDexie()

/**
 * IndexedDB の永続化（ITP による自動退避の抑止）を最善努力で要求する。
 * navigator.storage.persist が無い環境・拒否・例外いずれも false を返して機能継続する。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
