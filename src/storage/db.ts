import Dexie, { type Table } from 'dexie'

import type { Session } from '@/core/types'

/**
 * PeakRM の IndexedDB スキーマ定義。
 * sessions: Session を主キー id で保存。startedAt に単独 index（全件降順一覧のため）、
 *   [exercise+startedAt] 複合 index（同種目の直前 1 件を DB 側で末尾取得するため）。
 * メニューの初期表示値・LP ベースラインは直前セッションの menu から導出するため（#61）、
 * 専用テーブルは持たない。
 */
class PeakDexie extends Dexie {
  sessions!: Table<Session, string>

  constructor() {
    super('peak-rm')
    // version().stores() が同名プロパティ（sessions）に Table を自動バインドする。
    this.version(1).stores({
      sessions: 'id, startedAt, [exercise+startedAt]',
    })
  }
}

export const db = new PeakDexie()

/**
 * IndexedDB の永続化（ITP による自動退避の抑止）を最善努力で要求する。
 * navigator.storage.persist が無い環境・拒否・例外いずれも false を返して機能継続する
 * （周辺の縮退。spec「💾 ストレージ」: 許可は最善努力で、拒否された場合もアプリ機能には影響しない）。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
