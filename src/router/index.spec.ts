import { expect, test } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import type { Router } from 'vue-router'
import { createAppRouter, routeNames } from '@/router'

// back() は awaitable でないため、次の afterEach（遷移完了）を待つ。
function waitForNavigation(router: Router): Promise<void> {
  return new Promise((resolve) => {
    const stop = router.afterEach(() => {
      stop()
      resolve()
    })
  })
}

test('7 つの全ルートに名前で遷移できる', async () => {
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: 'home' }) // memory history は初回 push で初期遷移を起こす（START_LOCATION → home）

  // menu / training / interval / result は :exercise 配下のため種目 param が要る
  const sessionFlow = new Set(['menu', 'training', 'interval', 'result'])
  for (const name of routeNames) {
    const params = sessionFlow.has(name) ? { exercise: 'benchPress' } : {}
    await router.push({ name, params })
    expect(router.currentRoute.value.name).toBe(name)
  }
})

test('ページロード直後の非 home への遷移は home にリダイレクトされる', async () => {
  const router = createAppRouter(createMemoryHistory())
  // isReady を挟まず最初の遷移を session フローのディープリンクに向ける = from が START_LOCATION
  await router.push('/benchPress/training')
  expect(router.currentRoute.value.name).toBe('home')
})

test('session フローを replace で畳むと、結果画面からの戻るは training を経由せず home に着地する', async () => {
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: 'home' }) // 初回 push で初期遷移（START_LOCATION → home）

  const exercise = 'benchPress'
  await router.push({ name: 'menu', params: { exercise } })
  await router.replace({ name: 'training', params: { exercise } })
  await router.replace({ name: 'interval', params: { exercise } })
  await router.replace({ name: 'result', params: { exercise }, query: { origin: 'session' } })
  expect(router.currentRoute.value.name).toBe('result')

  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('home')
})

test('history から push で開いた結果画面の戻るは history に戻る', async () => {
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: 'home' }) // 初回 push で初期遷移（START_LOCATION → home）

  await router.push({ name: 'history' })
  await router.push({
    name: 'result',
    params: { exercise: 'benchPress' },
    query: { origin: 'history' },
  })
  expect(router.currentRoute.value.name).toBe('result')

  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('history')
})
