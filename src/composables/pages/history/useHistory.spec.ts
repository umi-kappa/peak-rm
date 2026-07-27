import { reactive } from 'vue'
import { beforeEach, expect, test, vi } from 'vitest'

import { useHistory } from '@/composables/pages/history/useHistory'
import type { Exercise, Session } from '@/core/types'

// 選択種目は route query が唯一のソースなので、query を持つ最小の route と、
// それを書き換える replace だけを備えた router を差す（useBackNavigation.spec と同じ手法）
const route = reactive<{ query: Record<string, string | undefined> }>({ query: {} })
const router = {
  replace: vi.fn(({ query }: { query: Record<string, string> }) => {
    route.query = query
  }),
}
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => router }))

function makeSession(id: string, exercise: Exercise, startedAt: number): Session {
  return {
    id,
    exercise,
    status: 'executed',
    startedAt,
    menu: { exercise, weight: 100, reps: 8, sets: 1, intervalSec: 90 },
    results: [{ actualReps: 8, memo: '' }],
  }
}

// listForHistory は集約・並びを済ませた一覧を返す（本物と同じ startedAt 降順で渡す）
function makeRepo(sessions: Session[] = []) {
  return { listForHistory: vi.fn(async () => sessions) }
}

beforeEach(() => {
  route.query = {}
  vi.clearAllMocks()
})

test('query が無いときはタブ先頭のベンチプレスを選ぶ', () => {
  const { exercise } = useHistory({ repo: makeRepo() })

  expect(exercise.value).toBe('benchPress')
})

test('query の種目を選択中として扱う（履歴詳細から戻っても絞り込みが残る）', () => {
  route.query = { exercise: 'deadlift' }
  const { exercise } = useHistory({ repo: makeRepo() })

  expect(exercise.value).toBe('deadlift')
})

test('種目として解釈できない query 値はタブ先頭にフォールバックする', () => {
  route.query = { exercise: 'overheadPress' }
  const { exercise } = useHistory({ repo: makeRepo() })

  expect(exercise.value).toBe('benchPress')
})

test('種目の切り替えは replace で URL に反映する（履歴を積まない）', () => {
  const { selectExercise } = useHistory({ repo: makeRepo() })

  selectExercise('squat')

  expect(router.replace).toHaveBeenCalledWith({ query: { exercise: 'squat' } })
})

test('load 後は選択中の種目のセッションだけを repo の並び順で返す', async () => {
  const bench2 = makeSession('bench2', 'benchPress', 3000)
  const squat = makeSession('squat', 'squat', 2000)
  const bench1 = makeSession('bench1', 'benchPress', 1000)
  const { sessions, load } = useHistory({ repo: makeRepo([bench2, squat, bench1]) })

  await load()

  expect(sessions.value.map((s) => s.id)).toEqual(['bench2', 'bench1'])
})

test('種目を切り替えると一覧が切り替わる', async () => {
  const bench = makeSession('bench', 'benchPress', 3000)
  const deadlift = makeSession('deadlift', 'deadlift', 2000)
  const { sessions, selectExercise, load } = useHistory({ repo: makeRepo([bench, deadlift]) })

  await load()
  selectExercise('deadlift')

  expect(sessions.value.map((s) => s.id)).toEqual(['deadlift'])
})

test('記録が無い種目を選ぶと空の一覧になる', async () => {
  const { sessions, selectExercise, load } = useHistory({
    repo: makeRepo([makeSession('bench', 'benchPress', 1000)]),
  })

  await load()
  selectExercise('squat')

  expect(sessions.value).toEqual([])
})

test('load は種目ごとに呼び直さない（一覧は 1 回の取得を絞り込むだけ）', async () => {
  const repo = makeRepo([makeSession('bench', 'benchPress', 1000)])
  const { selectExercise, load } = useHistory({ repo })

  await load()
  selectExercise('squat')
  selectExercise('benchPress')

  expect(repo.listForHistory).toHaveBeenCalledOnce()
})
