import { describe, expect, test } from 'vitest'

import { buildOneRmChartData } from '@/core/chartData'
import type { Session } from '@/core/types'

// ローカル日付の構成要素から timestamp を作る（localDay.spec と同じく TZ 依存を避ける）。
// 同日内の前後関係が要るケースだけ hour を渡す。
function at(month: number, date: number, hour = 9): number {
  return new Date(2026, month - 1, date, hour, 0).getTime()
}

// ベンチプレス（divisor 40）固定の最小 fixture。weight と実績回数が推定 1RM を決める
function makeSession(startedAt: number, weight: number, actualReps: number[]): Session {
  return {
    id: `session-${startedAt}`,
    exercise: 'benchPress',
    startedAt,
    menu: { exercise: 'benchPress', weight, reps: 8, sets: actualReps.length, intervalSec: 90 },
    results: actualReps.map((reps) => ({ actualReps: reps, memo: '' })),
  }
}

describe('buildOneRmChartData', () => {
  test('日付ごと 1 点にし、降順の入力でも古い順に並べる', () => {
    const data = buildOneRmChartData([
      makeSession(at(5, 12), 110, [8]),
      makeSession(at(5, 9), 100, [8]),
    ])

    expect(data?.points).toEqual([
      { oneRm: 100 * (1 + 8 / 40), dayLabel: '05/09' },
      { oneRm: 110 * (1 + 8 / 40), dayLabel: '05/12' },
    ])
  })

  test('同日に複数セッションがあればその日の最新（startedAt 最大）を採用する', () => {
    const data = buildOneRmChartData([
      makeSession(at(5, 12, 18), 100, [8]),
      makeSession(at(5, 12, 9), 110, [8]),
    ])

    expect(data?.points).toEqual([{ oneRm: 100 * (1 + 8 / 40), dayLabel: '05/12' }])
  })

  test('点が 8 個を超えたら直近 8 点だけを残す', () => {
    const sessions = Array.from({ length: 10 }, (_, index) =>
      makeSession(at(5, index + 1), 100 + index, [8]),
    )

    const data = buildOneRmChartData(sessions)

    expect(data?.points).toHaveLength(8)
    expect(data?.points.map((point) => point.dayLabel)).toEqual([
      '05/03',
      '05/04',
      '05/05',
      '05/06',
      '05/07',
      '05/08',
      '05/09',
      '05/10',
    ])
  })

  test('latest は終点・delta は表示区間の「終点 − 始点」', () => {
    const data = buildOneRmChartData([
      makeSession(at(5, 9), 100, [8]),
      makeSession(at(5, 10), 90, [8]),
      makeSession(at(5, 12), 110, [8]),
    ])

    expect(data?.latest).toBe(110 * (1 + 8 / 40))
    expect(data?.delta).toBe(110 * (1 + 8 / 40) - 100 * (1 + 8 / 40))
  })

  test('delta は両端を表示桁へ丸めてから引く（表示値の差と一致させる）', () => {
    // 60kg × 1 → 61.5、62kg × 1 → 63.55（表示 63.5）。生値の差 2.05 を丸めると +2.1 になり、
    // カードに並ぶ表示値の差 63.5 − 61.5 = 2.0 と食い違う
    const data = buildOneRmChartData([
      makeSession(at(5, 9), 60, [1]),
      makeSession(at(5, 12), 62, [1]),
    ])

    expect(data?.delta).toBe(2)
  })

  test('切り出しの外にある古い記録は delta の始点にならない', () => {
    const sessions = Array.from({ length: 9 }, (_, index) =>
      makeSession(at(5, index + 1), index === 0 ? 50 : 100, [8]),
    )

    const data = buildOneRmChartData(sessions)

    // 始点は切り出し後の先頭（05/02 の 100kg）で、範囲外の 05/01（50kg）ではない
    expect(data?.delta).toBe(0)
  })

  test('点が 1 つだけなら delta は出さない', () => {
    const data = buildOneRmChartData([makeSession(at(5, 12), 100, [8])])

    expect(data?.latest).toBe(100 * (1 + 8 / 40))
    expect(data?.delta).toBeUndefined()
  })

  test('推定 1RM を算出できない日（全セットスキップ）は点にしない', () => {
    const data = buildOneRmChartData([
      makeSession(at(5, 9), 100, [8]),
      makeSession(at(5, 12), 100, [0, 0, 0]),
    ])

    expect(data?.points).toEqual([{ oneRm: 100 * (1 + 8 / 40), dayLabel: '05/09' }])
    expect(data?.delta).toBeUndefined()
  })

  test('記録が 0 件なら undefined（カード自体を出さない）', () => {
    expect(buildOneRmChartData([])).toBeUndefined()
  })

  test('全セットスキップしか無ければ undefined', () => {
    expect(buildOneRmChartData([makeSession(at(5, 12), 100, [0, 0, 0])])).toBeUndefined()
  })
})
