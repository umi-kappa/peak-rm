import { beforeEach, describe, expect, test, vi } from 'vitest'

import { backup, BACKUP_SCHEMA_VERSION, type ExportEnvelope } from '@/storage/backup'
import { MENU_MAX } from '@/core/menu'
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

/** menu の値域・型を外れた上書き。型を崩した入力も混ぜるため Record で持つ */
const invalidMenus: { label: string; menu: Record<string, unknown> }[] = [
  { label: 'weight が負', menu: { weight: -100 } },
  { label: 'weight が文字列', menu: { weight: '100' } },
  { label: 'reps が 0', menu: { reps: 0 } },
  { label: 'reps が負', menu: { reps: -1 } },
  { label: 'reps が小数', menu: { reps: 8.5 } },
  { label: 'sets が 0', menu: { sets: 0 } },
  { label: 'sets が負', menu: { sets: -1 } },
  { label: 'sets が小数', menu: { sets: 3.5 } },
  { label: 'weight が上限超過', menu: { weight: MENU_MAX.weight + 1 } },
  { label: 'reps が上限超過', menu: { reps: MENU_MAX.reps + 1 } },
  { label: 'sets が上限超過', menu: { sets: MENU_MAX.sets + 1 } },
  { label: 'intervalSec が上限超過', menu: { intervalSec: MENU_MAX.intervalSec + 1 } },
]

/** 検証を通るはずの envelope を検証させ、ok かどうかを返す */
function parsesOk(sessions: unknown[]): boolean {
  return backup.parseImport(JSON.stringify(makeEnvelope({ sessions }))).ok
}

describe('createExport', () => {
  test('保存済みの全セッションを schemaVersion 付きの envelope で書き出す', async () => {
    await db.sessions.bulkAdd([makeSession('s1'), makeSession('s2', 'squat', 2000)])

    const before = Date.now()
    const { json } = await backup.createExport()
    const envelope = JSON.parse(json) as ExportEnvelope

    expect(envelope.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    // 固定値でも通らないよう、書き出し時刻が呼び出し区間に収まることまで見る
    expect(envelope.exportedAt).toBeGreaterThanOrEqual(before)
    expect(envelope.exportedAt).toBeLessThanOrEqual(Date.now())
    expect(envelope.sessions.map((session) => session.id).sort()).toEqual(['s1', 's2'])
  })

  test('記録が無ければ sessions は空配列になる', async () => {
    const { json } = await backup.createExport()
    expect((JSON.parse(json) as ExportEnvelope).sessions).toEqual([])
  })

  test('ファイル名は書き出し日のローカルカレンダー日を持つ', async () => {
    // ローカル 0 時台は UTC ではまだ前日なので、toISOString への退化をここで検出できる
    // （unit project は TZ=Asia/Tokyo 固定。Date だけ差し替えて Dexie の非同期は止めない）
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(new Date(2026, 4, 12, 0, 30))
      const { fileName } = await backup.createExport()
      expect(fileName).toBe('peak-rm-export-2026-05-12.json')
    } finally {
      vi.useRealTimers()
    }
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

  // isRecord が名指しで除外している null 分岐を含む。ガードが外れると null.schemaVersion の
  // TypeError になり、「不正は例外ではなく値で返す」契約が壊れる
  test.each(['null', '42', '"x"'])('オブジェクトでないルート（%s）を拒否する', (text) => {
    expect(parseErrorMessage(text)).toBe('Export ファイルの形式ではありません')
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

  test.each(['exercise', 'weight', 'reps', 'sets', 'intervalSec'])(
    'menu.%s が欠けたセッションを拒否する',
    (field) => {
      const session = makeSession('s1')
      expect(
        sessionsErrorMessage([{ ...session, menu: { ...session.menu, [field]: undefined } }]),
      ).toBe('sessions[0] のデータが不正です')
    },
  )

  // 弾く側の境界を固定する。spec §2「設定項目」表の下限（重量 0 / 回数・セット数 1）が基準
  test.each(invalidMenus)('menu の値域・型を外れたセッション（$label）を拒否する', ({ menu }) => {
    const session = makeSession('s1')
    expect(sessionsErrorMessage([{ ...session, menu: { ...session.menu, ...menu } }])).toBe(
      'sessions[0] のデータが不正です',
    )
  })

  // 通る側の境界。境界そのものを弾く方向の退行（`>= 1` → `> 1`、`<= max` → `< max` 等）は
  // ここでしか落ちない
  test.each([
    { label: '下限: weight 0・intervalSec 0', menu: { weight: 0, intervalSec: 0 } },
    { label: '下限: reps 1・sets 1', menu: { reps: 1, sets: 1 } },
    {
      label: '上限: MENU_MAX そのもの',
      menu: {
        weight: MENU_MAX.weight,
        reps: MENU_MAX.reps,
        sets: MENU_MAX.sets,
        intervalSec: MENU_MAX.intervalSec,
      },
    },
  ])('menu の値域の境界（$label）は受け入れる', ({ menu }) => {
    const session = makeSession('s1')
    expect(parsesOk([{ ...session, menu: { ...session.menu, ...menu } }])).toBe(true)
  })

  test('宣言されたフィールドだけを取り込み、未知のプロパティは落とす', () => {
    const session = makeSession('s1')
    const result = backup.parseImport(
      JSON.stringify(
        makeEnvelope({
          sessions: [
            {
              ...session,
              unknown: 'x',
              menu: { ...session.menu, unknown: 'x' },
              results: [{ actualReps: 8, memo: '', unknown: 'x' }],
            },
          ],
        }),
      ),
    )
    expect(result.ok && result.sessions).toEqual([session])
  })

  test('exercise と menu.exercise が食い違うセッションを拒否する（不変条件: 1 セッション = 1 種目）', () => {
    const session = makeSession('s1', 'squat')
    expect(
      sessionsErrorMessage([{ ...session, menu: { ...session.menu, exercise: 'benchPress' } }]),
    ).toBe('sessions[0] のデータが不正です')
  })

  test('id が文字列でないセッションを拒否する', () => {
    expect(sessionsErrorMessage([{ ...makeSession('s1'), id: 1 }])).toBe(
      'sessions[0] のデータが不正です',
    )
  })

  test('id が空文字のセッションを拒否する', () => {
    expect(sessionsErrorMessage([{ ...makeSession('s1'), id: '' }])).toBe(
      'sessions[0] のデータが不正です',
    )
  })

  test('results が配列でないセッションを拒否する', () => {
    expect(sessionsErrorMessage([{ ...makeSession('s1'), results: 'abc' }])).toBe(
      'sessions[0] のデータが不正です',
    )
  })

  test('results が空のセッションを拒否する（不変条件: 実績のあるセッションのみ保存）', () => {
    expect(sessionsErrorMessage([{ ...makeSession('s1'), results: [] }])).toBe(
      'sessions[0] のデータが不正です',
    )
  })

  test.each([
    { label: 'memo が無い', result: { actualReps: 8 } },
    { label: 'actualReps が無い', result: { memo: '' } },
    // actualReps は 0（スキップ）が正しいので isCount のまま残している。その判断を固定する
    { label: 'actualReps が負', result: { actualReps: -1, memo: '' } },
    { label: 'actualReps が小数', result: { actualReps: 2.7, memo: '' } },
  ])('実績の形が不正（$label）なセッションを拒否する', ({ result }) => {
    expect(sessionsErrorMessage([{ ...makeSession('s1'), results: [result] }])).toBe(
      'sessions[0] のデータが不正です',
    )
  })

  test('results がちょうど menu.sets のセッション（完遂）を受け入れる', () => {
    // 上限を `<` に狭める退行が入ると完遂セッションが 1 件も Import できなくなる
    const session = makeSession('s1')
    expect(
      parsesOk([
        {
          ...session,
          results: Array.from({ length: session.menu.sets }, () => ({ actualReps: 8, memo: '' })),
        },
      ]),
    ).toBe(true)
  })

  test('results が menu.sets を超えるセッションを拒否する', () => {
    // 超過分はタイムラインに出ずメモへ到達できない一方、1RM・実績表示には数え込まれる
    const session = makeSession('s1')
    expect(
      sessionsErrorMessage([
        {
          ...session,
          results: Array.from({ length: session.menu.sets + 1 }, () => ({
            actualReps: 8,
            memo: '',
          })),
        },
      ]),
    ).toBe('sessions[0] のデータが不正です')
  })

  // startedAt は unix ms の正の整数。[exercise+startedAt] 複合 index と履歴の日付表示に直接効く
  test.each([
    { label: '0', startedAt: 0 },
    { label: '負', startedAt: -1 },
    { label: '小数', startedAt: 1000.5 },
    { label: '文字列', startedAt: '1000' },
  ])('startedAt が正の整数でないセッション（$label）を拒否する', ({ startedAt }) => {
    expect(sessionsErrorMessage([{ ...makeSession('s1'), startedAt }])).toBe(
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
