import type { InjectionKey } from 'vue'

import { isExercise } from '@/core/constants'
import { localDayKey } from '@/core/localDay'
import { db } from '@/storage/db'
import type { Menu, Session, SetResult } from '@/core/types'

/**
 * Export ファイルのスキーマバージョン。Import は完全一致のみ受け入れ、
 * それ以外は検証エラーとして拒否する（spec「7. データ Export / Import」の将来課題）。
 */
export const BACKUP_SCHEMA_VERSION = 1

/** Export ファイルの中身。sessions が唯一のデータで、メニューの初期値はここから導出される（#61） */
export type ExportEnvelope = {
  schemaVersion: number
  exportedAt: number // unix ms
  sessions: Session[]
}

/**
 * 読み込んだファイルの検証結果。ユーザーが選んだファイルの不正は想定内の失敗なので、
 * 例外ではなく値で返す（想定外の失敗＝エラー境界へ流すものと区別する）。
 */
export type ImportParseResult = { ok: true; sessions: Session[] } | { ok: false; message: string }

// null は unicorn/no-null で書けないため、真偽値で除外する（typeof null === 'object'）
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && Boolean(value) && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** 回数・セット数・秒数のように 0 以上の整数で表す値か */
function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isMenu(value: unknown): value is Menu {
  if (!isRecord(value)) return false
  return (
    isExercise(value.exercise) &&
    isFiniteNumber(value.weight) &&
    isCount(value.reps) &&
    isCount(value.sets) &&
    isCount(value.intervalSec)
  )
}

function isSetResult(value: unknown): value is SetResult {
  if (!isRecord(value)) return false
  return isCount(value.actualReps) && typeof value.memo === 'string'
}

function isSession(value: unknown): value is Session {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    isExercise(value.exercise) &&
    isFiniteNumber(value.startedAt) &&
    isMenu(value.menu) &&
    Array.isArray(value.results) &&
    // 実績のあるセッションのみ保存する不変条件を Import 経由のデータにも適用する（#80）
    value.results.length > 0 &&
    value.results.every(isSetResult)
  )
}

/**
 * ダウンロードさせるファイル名と中身を組み立てる。
 * envelope の形・整形・ファイル名まで backup が持ち、画面には DOM の書き出しだけを残す。
 * 日付はローカルカレンダー日（localDayKey が `YYYY-MM-DD` を返す）。
 */
async function createExport(): Promise<{ fileName: string; json: string }> {
  const exportedAt = Date.now()
  const envelope: ExportEnvelope = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    // 並び順は envelope の契約に含めない（Import は id で全件を入れ直すため順序に依存しない）
    sessions: await db.sessions.toArray(),
  }
  return {
    fileName: `peak-rm-export-${localDayKey(exportedAt)}.json`,
    json: JSON.stringify(envelope),
  }
}

/**
 * 読み込んだファイルの文字列を検証し、置換に使える sessions を返す。
 * 置換前にここで弾き切ることで「検証失敗時は既存データを変更しない」を満たす。
 */
function parseImport(text: string): ImportParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, message: 'JSON として読み取れません' }
  }

  if (!isRecord(parsed)) return { ok: false, message: 'Export ファイルの形式ではありません' }
  if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return { ok: false, message: `schemaVersion が ${BACKUP_SCHEMA_VERSION} ではありません` }
  }
  if (!isFiniteNumber(parsed.exportedAt)) return { ok: false, message: 'exportedAt が不正です' }
  if (!Array.isArray(parsed.sessions))
    return { ok: false, message: 'sessions が配列ではありません' }

  const invalidIndex = parsed.sessions.findIndex((session) => !isSession(session))
  if (invalidIndex !== -1) {
    return { ok: false, message: `sessions[${invalidIndex}] のデータが不正です` }
  }

  const sessions = parsed.sessions as Session[]
  // 重複 id は bulkAdd が例外を投げてエラー画面になるため、想定内の入力不正としてここで弾く
  if (new Set(sessions.map((session) => session.id)).size !== sessions.length) {
    return { ok: false, message: 'sessions の id が重複しています' }
  }

  return { ok: true, sessions }
}

/**
 * 検証済みの sessions で全データを置き換える。
 * clear → bulkAdd を 1 トランザクションに包み、途中で失敗すれば全部ロールバックされる（atomic）。
 */
async function replaceAll(sessions: Session[]): Promise<void> {
  await db.transaction('rw', db.sessions, async () => {
    await db.sessions.clear()
    await db.sessions.bulkAdd(sessions)
  })
}

export const backup = {
  createExport,
  parseImport,
  replaceAll,
}

export type Backup = typeof backup

// 画面は backup を直接 import せず、main.ts が app.provide したものを inject で受ける
// （sessionRepo と同じ配線。Storybook は provide decorator で fake に差し替える）
export const backupInjectionKey: InjectionKey<Backup> = Symbol('backup')
