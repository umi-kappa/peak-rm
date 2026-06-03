import { beforeEach, expect, test } from 'vitest'

import { db } from '@/storage/db'
import { menuPresetRepo } from '@/storage/menuPresetRepo'
import type { MenuPreset } from '@/core/types'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const benchPreset: MenuPreset = {
  exercise: 'benchPress',
  weight: 60,
  reps: 8,
  sets: 3,
  intervalSec: 90,
}

test('行が無ければ get は undefined を返す（初回起動判定の素材）', async () => {
  expect(await menuPresetRepo.get('benchPress')).toBeUndefined()
})

test('put した値を get で取り戻せる', async () => {
  await menuPresetRepo.put(benchPreset)
  expect(await menuPresetRepo.get('benchPress')).toEqual(benchPreset)
})

test('同一種目を再 put しても 1 行のまま上書きする', async () => {
  await menuPresetRepo.put(benchPreset)
  await menuPresetRepo.put({ ...benchPreset, weight: 62.5 })

  expect((await menuPresetRepo.get('benchPress'))?.weight).toBe(62.5)
  expect(await db.menuPresets.count()).toBe(1)
})

test('種目ごとに独立した行として共存する', async () => {
  const squatPreset: MenuPreset = {
    exercise: 'squat',
    weight: 100,
    reps: 5,
    sets: 3,
    intervalSec: 120,
  }
  await menuPresetRepo.put(benchPreset)
  await menuPresetRepo.put(squatPreset)

  expect(await menuPresetRepo.get('benchPress')).toEqual(benchPreset)
  expect(await menuPresetRepo.get('squat')).toEqual(squatPreset)
  expect(await db.menuPresets.count()).toBe(2)
})
