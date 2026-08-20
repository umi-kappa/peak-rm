import { beforeEach, describe, expect, test } from 'vitest'

import { backup, BACKUP_SCHEMA_VERSION, type ExportEnvelope } from '@/storage/backup'
import { db } from '@/storage/db'
import type { Exercise, Session } from '@/core/types'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

function makeSession(id: string, exercise: Exercise = 'benchPress', startedAt = 1000): Session {
  return {
    id,
    exercise,
    startedAt,
    menu: { exercise, weight: 100, reps: 8, sets: 3, intervalSec: 90 },
    results: [{ actualReps: 8, memo: '' }],
  }
}

/**
 * 検証を通る envelope。個別のテストは壊したいフィールドだけ上書きする。
 * 不正な入力（型の壊れたセッション）も渡せるよう、戻りは Session[] を持つ型にしない
 */
function makeEnvelope(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: 1_700_000_000_000,
    sessions: [makeSession('s1')],
    ...overrides,
  }
}

/** 検証エラーの message だけ取り出す（ok の場合は落とす） */
function parseErrorMessage(text: string): string {
  const result = backup.parseImport(text)
  if (result.ok) throw new Error('検証を通ってしまった')
  return result.message
}

/** sessions だけ差し替えた envelope を検証させ、エラー message を取り出す */
function sessionsErrorMessage(sessions: unknown[]): string {
  return parseErrorMessage(JSON.stringify(makeEnvelope({ sessions })))
}

describe('createExport', () => {
  test('保存済みの全セッションを schemaVersion 付きの envelope で書き出す', async () => {
    await db.sessions.bulkAdd([makeSession('s1'), makeSession('s2', 'squat', 2000)])

    const { json } = await backup.createExport()
    const envelope = JSON.parse(json) as ExportEnvelope

    expect(envelope.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(envelope.exportedAt).toBeGreaterThan(0)
    expect(envelope.sessions.map((session) => session.id).sort()).toEqual(['s1', 's2'])
  })

  test('記録が無ければ sessions は空配列になる', async () => {
    const { json } = await backup.createExport()
    expect((JSON.parse(json) as ExportEnvelope).sessions).toEqual([])
  })

  test('ファイル名は書き出し日のローカルカレンダー日を持つ', async () => {
    const { fileName } = await backup.createExport()
    expect(fileName).toMatch(/^peak-rm-export-\d{4}-\d{2}-\d{2}\.json$/)
  })

  test('書き出した JSON はそのまま読み戻せる（往復）', async () => {
    await db.sessions.add(makeSession('s1'))

    const { json } = await backup.createExport()
    const result = backup.parseImport(json)

    expect(result.ok).toBe(true)
    expect(result.ok && result.sessions).toEqual([makeSession('s1')])
  })
})

describe('parseImport', () => {
  test('検証を通ったデータは sessions を返す', () => {
    const result = backup.parseImport(JSON.stringify(makeEnvelope()))
    expect(result.ok && result.sessions).toEqual([makeSession('s1')])
  })

  test('JSON として読めないファイルを拒否する', () => {
    expect(parseErrorMessage('not json')).toBe('JSON として読み取れません')
  })

  test('オブジェクトでないルート（配列）を拒否する', () => {
    expect(parseErrorMessage(JSON.stringify([makeSession('s1')]))).toBe(
      'Export ファイルの形式ではありません',
    )
  })

  test('schemaVersion が一致しないファイルを拒否する（完全一致のみ受け入れる）', () => {
    expect(parseErrorMessage(JSON.stringify(makeEnvelope({ schemaVersion: 2 })))).toBe(
      'schemaVersion が 1 ではありません',
    )
  })

  test('必須フィールドが欠けたファイルを拒否する', () => {
    // JSON.stringify は undefined のプロパティを落とすため、フィールド欠落と同じ入力になる
    expect(parseErrorMessage(JSON.stringify(makeEnvelope({ exportedAt: undefined })))).toBe(
      'exportedAt が不正です',
    )
  })

  test('sessions が配列でないファイルを拒否する', () => {
    expect(parseErrorMessage(JSON.stringify(makeEnvelope({ sessions: {} })))).toBe(
      'sessions が配列ではありません',
    )
  })

  test('enum に無い種目を含むセッションを拒否する', () => {
    expect(sessionsErrorMessage([{ ...makeSession('s1'), exercise: 'benchpress' }])).toBe(
      'sessions[0] のデータが不正です',
    )
  })

  test('menu の必須フィールドが欠けたセッションを拒否する', () => {
    const session = makeSession('s1')
    expect(
      sessionsErrorMessage([{ ...session, menu: { ...session.menu, intervalSec: undefined } }]),
    ).toBe('sessions[0] のデータが不正です')
  })

  test('results が空のセッションを拒否する（不変条件: 実績のあるセッションのみ保存）', () => {
    expect(sessionsErrorMessage([{ ...makeSession('s1'), results: [] }])).toBe(
      'sessions[0] のデータが不正です',
    )
  })

  test('実績の形が不正なセッションを拒否する', () => {
    expect(sessionsErrorMessage([{ ...makeSession('s1'), results: [{ actualReps: 8 }] }])).toBe(
      'sessions[0] のデータが不正です',
    )
  })

  test('不正なセッションの位置を message に含める', () => {
    expect(
      sessionsErrorMessage([makeSession('s1'), { ...makeSession('s2'), startedAt: 'yesterday' }]),
    ).toBe('sessions[1] のデータが不正です')
  })

  test('id が重複するファイルを拒否する（置換時の例外を検証で先に弾く）', () => {
    expect(sessionsErrorMessage([makeSession('dup'), makeSession('dup', 'squat', 2000)])).toBe(
      'sessions の id が重複しています',
    )
  })
})

describe('replaceAll', () => {
  test('既存データを捨てて渡されたセッションだけにする', async () => {
    await db.sessions.bulkAdd([makeSession('old1'), makeSession('old2', 'squat', 2000)])

    await backup.replaceAll([makeSession('new1'), makeSession('new2', 'deadlift', 3000)])

    expect((await db.sessions.toArray()).map((session) => session.id).sort()).toEqual([
      'new1',
      'new2',
    ])
  })

  test('置換の途中で失敗したら既存データを一切変更しない（atomic）', async () => {
    await db.sessions.bulkAdd([makeSession('old1'), makeSession('old2', 'squat', 2000)])

    // 重複 id は bulkAdd が例外を投げるため、clear 済みでもトランザクションごと巻き戻る
    await expect(backup.replaceAll([makeSession('dup'), makeSession('dup')])).rejects.toThrow()

    expect((await db.sessions.toArray()).map((session) => session.id).sort()).toEqual([
      'old1',
      'old2',
    ])
  })
})
