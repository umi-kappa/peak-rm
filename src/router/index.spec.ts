import { readonly, ref } from 'vue'
import { expect, test, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import type { Router } from 'vue-router'
import { createAppRouter, routes } from '@/router'
import type { TrainingPhase } from '@/composables/shared/session/useSession'

// このスペックの検証対象はルーティング（名前・ガード・履歴挙動）のみで、ページは mount しない。
// 実ページを lazy import すると全ページの初回 transform 費用がここに集中し CI でタイムアウトする
// ため、空コンポーネントに差し替える。import パスの実在は vue-tsc とビルドが検証する。
// ルートを追加したらここにも 1 行足す（漏れてもテストは通るが、その分遅くなる）
vi.mock('@/pages/home/index.vue', () => ({ default: { render: () => [] } }))
vi.mock('@/pages/[exercise]/menu/index.vue', () => ({ default: { render: () => [] } }))
vi.mock('@/pages/[exercise]/training/index.vue', () => ({ default: { render: () => [] } }))
vi.mock('@/pages/[exercise]/interval/index.vue', () => ({ default: { render: () => [] } }))
vi.mock('@/pages/[exercise]/result/index.vue', () => ({ default: { render: () => [] } }))
vi.mock('@/pages/history/index.vue', () => ({ default: { render: () => [] } }))
vi.mock('@/pages/settings/index.vue', () => ({ default: { render: () => [] } }))

// back() は awaitable でないため、次の afterEach（遷移完了）を待つ。
function waitForNavigation(router: Router): Promise<void> {
  return new Promise((resolve) => {
    const stop = router.afterEach(() => {
      stop()
      resolve()
    })
  })
}

// セッションガードへ渡す fake。phaseRef でテストから任意のフェーズを作り、
// leave は実物同様 done へ確定する（呼び出し回数の検証用に spy にする）。
function createFakeSession(phase: TrainingPhase = 'done') {
  const phaseRef = ref<TrainingPhase>(phase)
  const leave = vi.fn(() => {
    phaseRef.value = 'done'
  })
  return { phaseRef, session: { phase: readonly(phaseRef), leave } }
}

test('全ルートに名前で遷移できる', async () => {
  const { phaseRef, session } = createFakeSession()
  const router = createAppRouter(session, createMemoryHistory())
  await router.push({ name: 'home' }) // memory history は初回 push で初期遷移を起こす（START_LOCATION → home）

  for (const route of routes) {
    const name = route.name
    if (typeof name !== 'string') continue
    // :exercise 配下のルート（menu / training / interval / result）は種目 param が要る
    const params = route.path.includes(':exercise') ? { exercise: 'benchPress' } : {}
    // セッションガードに弾かれないよう、各遷移前に実行中フェーズへ戻す
    phaseRef.value = 'setActive'
    await router.push({ name, params })
    expect(router.currentRoute.value.name).toBe(name)
  }
})

test('ページロード直後の非 home への遷移は home にリダイレクトされる', async () => {
  const router = createAppRouter(createFakeSession().session, createMemoryHistory())
  // isReady を挟まず最初の遷移を session フローのディープリンクに向ける = from が START_LOCATION
  await router.push('/benchPress/training')
  expect(router.currentRoute.value.name).toBe('home')
})

test('session フローを replace で畳むと、結果画面からの戻るは training を経由せず home に着地する', async () => {
  const { phaseRef, session } = createFakeSession('setActive')
  const router = createAppRouter(session, createMemoryHistory())
  await router.push({ name: 'home' }) // 初回 push で初期遷移（START_LOCATION → home）

  const exercise = 'benchPress'
  await router.push({ name: 'menu', params: { exercise } })
  await router.replace({ name: 'training', params: { exercise } })
  phaseRef.value = 'interval'
  await router.replace({ name: 'interval', params: { exercise } })
  phaseRef.value = 'done'
  await router.replace({ name: 'result', params: { exercise }, query: { origin: 'session' } })
  expect(router.currentRoute.value.name).toBe('result')

  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('home')
})

test('history から push で開いた結果画面の戻るは history に戻り、種目の絞り込みも保つ', async () => {
  const router = createAppRouter(createFakeSession().session, createMemoryHistory())
  await router.push({ name: 'home' }) // 初回 push で初期遷移（START_LOCATION → home）

  await router.push({ name: 'history', query: { exercise: 'squat' } })
  await router.push({
    name: 'result',
    params: { exercise: 'squat' },
    query: { origin: 'history' },
  })
  expect(router.currentRoute.value.name).toBe('result')

  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('history')
  // 選択種目は URL に載っているので、戻ったときに絞り込みが失われない（spec「履歴」）
  expect(router.currentRoute.value.query.exercise).toBe('squat')
})

test('履歴の種目切り替えは replace なので、戻るは切り替え前の種目ではなく history の手前へ抜ける', async () => {
  const router = createAppRouter(createFakeSession().session, createMemoryHistory())
  await router.push({ name: 'home' }) // 初回 push で初期遷移（START_LOCATION → home）

  await router.push({ name: 'history', query: { exercise: 'benchPress' } })
  await router.replace({ name: 'history', query: { exercise: 'squat' } })

  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('home')
})

test('実行中セッションが無ければ training / interval へは入れずホームへ戻される', async () => {
  const { session } = createFakeSession('done')
  const router = createAppRouter(session, createMemoryHistory())
  await router.push({ name: 'home' })

  await router.push({ name: 'training', params: { exercise: 'benchPress' } })
  expect(router.currentRoute.value.name).toBe('home')

  await router.push({ name: 'interval', params: { exercise: 'benchPress' } })
  expect(router.currentRoute.value.name).toBe('home')
})

test('実行中セッションが無くても result へは入れる（履歴詳細から開くため）', async () => {
  const { session } = createFakeSession('done')
  const router = createAppRouter(session, createMemoryHistory())
  await router.push({ name: 'home' })

  await router.push({
    name: 'result',
    params: { exercise: 'benchPress' },
    query: { origin: 'history' },
  })
  expect(router.currentRoute.value.name).toBe('result')
})

test('session フローの外へ遷移すると leave で実行中セッションを終端する', async () => {
  const { phaseRef, session } = createFakeSession('setActive')
  const router = createAppRouter(session, createMemoryHistory())
  await router.push({ name: 'home' })

  await router.push({ name: 'training', params: { exercise: 'benchPress' } })
  expect(session.leave).not.toHaveBeenCalled()

  // トレーニング中にブラウザの戻るでホームへ離脱（spec「セッションフローからの離脱」）
  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('home')
  expect(session.leave).toHaveBeenCalledOnce()
  expect(phaseRef.value).toBe('done')
})

test('戻るで離脱した後に進むで再入しようとしてもホームに落ちる', async () => {
  const { session } = createFakeSession('setActive')
  const router = createAppRouter(session, createMemoryHistory())
  await router.push({ name: 'home' })

  await router.push({ name: 'training', params: { exercise: 'benchPress' } })
  router.back()
  await waitForNavigation(router)

  // 離脱で phase が done になっているため、進むでの再入はガードが home へ差し替える
  router.forward()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('home')
})
