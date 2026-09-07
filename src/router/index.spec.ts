import { readonly, ref } from 'vue'
import { expect, test, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import type { Router } from 'vue-router'
import { createAppRouter, routes } from '@/router'
import type { TrainingPhase } from '@/composables/shared/session/useSession'
import { useSessionLeaveConfirm } from '@/composables/shared/session/useSessionLeaveConfirm'

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
  // settled は既定で即座に解決する（書き込み中の離脱を見るテストだけ差し替える）
  const settled = vi.fn(async () => {})
  return { phaseRef, session: { phase: readonly(phaseRef), leave, settled } }
}

// 離脱確認ガードへ渡す fake。既定は即「離脱する」で答え、確認そのもののテストだけ answer を変える。
// 問い合わせを開いたまま別の離脱操作が走る経路は実物（useSessionLeaveConfirm）を渡して検証する
function createFakeLeaveConfirm(answer = true) {
  return { request: vi.fn(async () => answer), generation: readonly(ref(0)) }
}

test('全ルートに名前で遷移できる', async () => {
  const { phaseRef, session } = createFakeSession()
  const router = createAppRouter(session, createFakeLeaveConfirm(), createMemoryHistory())
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
  const router = createAppRouter(
    createFakeSession().session,
    createFakeLeaveConfirm(),
    createMemoryHistory(),
  )
  // isReady を挟まず最初の遷移を session フローのディープリンクに向ける = from が START_LOCATION
  await router.push('/benchPress/training')
  expect(router.currentRoute.value.name).toBe('home')
})

test('session フローを replace で畳むと、結果画面からの戻るは training を経由せず home に着地する', async () => {
  const { phaseRef, session } = createFakeSession('setActive')
  const router = createAppRouter(session, createFakeLeaveConfirm(), createMemoryHistory())
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
  const router = createAppRouter(
    createFakeSession().session,
    createFakeLeaveConfirm(),
    createMemoryHistory(),
  )
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
  const router = createAppRouter(
    createFakeSession().session,
    createFakeLeaveConfirm(),
    createMemoryHistory(),
  )
  await router.push({ name: 'home' }) // 初回 push で初期遷移（START_LOCATION → home）

  await router.push({ name: 'history', query: { exercise: 'benchPress' } })
  await router.replace({ name: 'history', query: { exercise: 'squat' } })

  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('home')
})

test('実行中セッションが終端していれば training / interval へは入れずホームへ戻される', async () => {
  const { session } = createFakeSession('done')
  const router = createAppRouter(session, createFakeLeaveConfirm(), createMemoryHistory())
  await router.push({ name: 'home' })

  await router.push({ name: 'training', params: { exercise: 'benchPress' } })
  expect(router.currentRoute.value.name).toBe('home')

  await router.push({ name: 'interval', params: { exercise: 'benchPress' } })
  expect(router.currentRoute.value.name).toBe('home')
})

test('実行中セッションが終端していても result へは入れる（履歴詳細から開くため）', async () => {
  const { session } = createFakeSession('done')
  const router = createAppRouter(session, createFakeLeaveConfirm(), createMemoryHistory())
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
  const router = createAppRouter(session, createFakeLeaveConfirm(), createMemoryHistory())
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
  const router = createAppRouter(session, createFakeLeaveConfirm(), createMemoryHistory())
  await router.push({ name: 'home' })

  await router.push({ name: 'training', params: { exercise: 'benchPress' } })
  router.back()
  await waitForNavigation(router)

  // 離脱で phase が done になっているため、進むでの再入はガードが home へ差し替える
  router.forward()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('home')
})

test('トレーニング中の戻るは離脱確認を挟み、離脱を確定するとホームへ抜けて leave する', async () => {
  const { session } = createFakeSession('setActive')
  const leaveConfirm = createFakeLeaveConfirm(true)
  const router = createAppRouter(session, leaveConfirm, createMemoryHistory())
  await router.push({ name: 'home' })
  await router.push({ name: 'training', params: { exercise: 'benchPress' } })

  router.back()
  await waitForNavigation(router)
  expect(leaveConfirm.request).toHaveBeenCalledOnce()
  expect(router.currentRoute.value.name).toBe('home')
  expect(session.leave).toHaveBeenCalledOnce()
  // 確定は書き込みを待たずに抜ける（待つのはキャンセルで行き先を決めるときだけ）
  expect(session.settled).not.toHaveBeenCalled()
})

test('離脱確認をキャンセルすると画面に留まり、URL も元に戻る', async () => {
  const { session } = createFakeSession('interval')
  const history = createMemoryHistory()
  const router = createAppRouter(session, createFakeLeaveConfirm(false), history)
  await router.push({ name: 'home' })
  await router.push({ name: 'interval', params: { exercise: 'benchPress' } })

  // 取り消された popstate 遷移は Vue Router が history を進め直す
  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('interval')
  expect(history.location).toBe('/benchPress/interval')
  expect(session.leave).not.toHaveBeenCalled()
})

test('セッションフロー内の遷移では離脱確認を挟まない', async () => {
  const { session } = createFakeSession('setActive')
  const leaveConfirm = createFakeLeaveConfirm()
  const router = createAppRouter(session, leaveConfirm, createMemoryHistory())
  await router.push({ name: 'home' })
  await router.push({ name: 'training', params: { exercise: 'benchPress' } })

  await router.replace({ name: 'interval', params: { exercise: 'benchPress' } })
  await router.replace({ name: 'result', params: { exercise: 'benchPress' } })
  expect(leaveConfirm.request).not.toHaveBeenCalled()
})

test('セッションが終端した後の離脱（結果確認画面の FINISH 等）では離脱確認を挟まない', async () => {
  const { session } = createFakeSession('done')
  const leaveConfirm = createFakeLeaveConfirm()
  const router = createAppRouter(session, leaveConfirm, createMemoryHistory())
  await router.push({ name: 'home' })
  await router.push({ name: 'result', params: { exercise: 'benchPress' } })

  await router.replace({ name: 'home' })
  expect(leaveConfirm.request).not.toHaveBeenCalled()
})

test('トレーニング画面のまま終端していれば（最終セット完了直後）、戻るに離脱確認を挟まない', async () => {
  const { session } = createFakeSession('setActive')
  const leaveConfirm = createFakeLeaveConfirm()
  const router = createAppRouter(session, leaveConfirm, createMemoryHistory())
  await router.push({ name: 'home' })
  await router.push({ name: 'training', params: { exercise: 'benchPress' } })

  // 最終セット完了で phase は done になるが、結果確認画面への replace が確定するまで route は training のまま
  session.leave()
  router.back()
  await waitForNavigation(router)
  expect(leaveConfirm.request).not.toHaveBeenCalled()
  expect(router.currentRoute.value.name).toBe('home')
})

test('キャンセルまでにセット完了で phase が進んでいれば、元の画面でなくインターバルへ push で進む', async () => {
  const { phaseRef, session } = createFakeSession('setActive')
  const history = createMemoryHistory()
  // 問い合わせている間にセット完了の書き込みが終わる（ページは問い合わせ中に遷移しない）
  const leaveConfirm = {
    request: vi.fn(async () => {
      phaseRef.value = 'interval'
      return false
    }),
    generation: readonly(ref(0)),
  }
  const router = createAppRouter(session, leaveConfirm, history)
  await router.push({ name: 'home' })
  await router.push({ name: 'training', params: { exercise: 'benchPress' } })

  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('interval')
  expect(history.location).toBe('/benchPress/interval')
  expect(session.leave).not.toHaveBeenCalled()

  // 戻るで移ったホームの位置に push で積んでいるので、履歴は「ホーム → インターバル」に収まっている
  leaveConfirm.request.mockResolvedValue(true)
  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('home')
  expect(history.location).toBe('/')
  expect(session.leave).toHaveBeenCalledOnce()
})

test('キャンセルが書き込みより先に返っても、書き込みを待ってから進んだ phase の画面へ進む', async () => {
  const { phaseRef, session } = createFakeSession('setActive')
  const history = createMemoryHistory()
  // 答えは即座に false（キャンセル）。セット完了の書き込みは settled の中で終わり、そこで phase が進む
  session.settled.mockImplementation(async () => {
    phaseRef.value = 'interval'
  })
  const router = createAppRouter(session, createFakeLeaveConfirm(false), history)
  await router.push({ name: 'home' })
  await router.push({ name: 'training', params: { exercise: 'benchPress' } })

  router.back()
  await waitForNavigation(router)
  expect(session.settled).toHaveBeenCalledOnce()
  expect(router.currentRoute.value.name).toBe('interval')
  expect(history.location).toBe('/benchPress/interval')
  expect(session.leave).not.toHaveBeenCalled()
})

test('キャンセルまでに最終セット完了で終端していれば、結果確認画面へ進む', async () => {
  const { phaseRef, session } = createFakeSession('setActive')
  const leaveConfirm = {
    request: vi.fn(async () => {
      phaseRef.value = 'done'
      return false
    }),
    generation: readonly(ref(0)),
  }
  const router = createAppRouter(session, leaveConfirm, createMemoryHistory())
  await router.push({ name: 'home' })
  await router.push({ name: 'training', params: { exercise: 'benchPress' } })

  router.back()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('result')
  expect(router.currentRoute.value.query).toEqual({ origin: 'session' })
  expect(session.leave).not.toHaveBeenCalled()
})

test('離脱確認を待つ間に重ねて離脱操作をしても、確定後の leave は 1 回に留まる', async () => {
  const { session } = createFakeSession('setActive')
  const store = useSessionLeaveConfirm()
  // 2 度目の問い合わせが開いたタイミングを待つため request だけ spy で包む
  const leaveConfirm = { ...store, request: vi.fn(store.request) }
  const router = createAppRouter(session, leaveConfirm, createMemoryHistory())
  await router.push({ name: 'home' })
  await router.push({ name: 'training', params: { exercise: 'benchPress' } })

  router.back()
  await vi.waitFor(() => expect(leaveConfirm.request).toHaveBeenCalledTimes(1))
  // 2 度目の離脱操作。実機ではブラウザバックの連打はアプリ外へ抜けるため到達しにくいが、
  // 前の問い合わせが取り消しで畳まれ、新しい問い合わせが開く扱いをここで固定する
  const second = router.push({ name: 'menu', params: { exercise: 'benchPress' } })
  await vi.waitFor(() => expect(leaveConfirm.request).toHaveBeenCalledTimes(2))
  leaveConfirm.confirm()
  await second
  expect(router.currentRoute.value.name).toBe('menu')
  expect(session.leave).toHaveBeenCalledOnce()
})

test('重ねた離脱操作に畳まれた問い合わせでは、phase が進んでいてもその画面へ進めない', async () => {
  const { phaseRef, session } = createFakeSession('setActive')
  const store = useSessionLeaveConfirm()
  const leaveConfirm = { ...store, request: vi.fn(store.request) }
  const router = createAppRouter(session, leaveConfirm, createMemoryHistory())
  await router.push({ name: 'home' })
  await router.push({ name: 'training', params: { exercise: 'benchPress' } })

  router.back()
  await vi.waitFor(() => expect(leaveConfirm.request).toHaveBeenCalledTimes(1))
  // 問い合わせている間にセット完了の記録が済む
  phaseRef.value = 'interval'
  // 2 度目の離脱操作で 1 度目は取り消しで畳まれる。畳まれた false はユーザーの答えではないので、
  // インターバルへ進めてこの遷移を追い越してはいけない（追い越すと後から押した確定が無効になる）
  const second = router.push({ name: 'menu', params: { exercise: 'benchPress' } })
  await vi.waitFor(() => expect(leaveConfirm.request).toHaveBeenCalledTimes(2))
  leaveConfirm.confirm()
  await second
  expect(router.currentRoute.value.name).toBe('menu')
  expect(session.leave).toHaveBeenCalledOnce()
  // 畳まれた問い合わせは書き込みを待たずに取り消す（待つと Vue Router の履歴復元が遅れて次の遷移と競合する）
  expect(session.settled).not.toHaveBeenCalled()
})

test('離脱確認をキャンセルした後にもう一度戻ると、改めて確認を挟んで離脱できる', async () => {
  const { session } = createFakeSession('setActive')
  const leaveConfirm = useSessionLeaveConfirm()
  const history = createMemoryHistory()
  const router = createAppRouter(session, leaveConfirm, history)
  await router.push({ name: 'home' })
  await router.push({ name: 'training', params: { exercise: 'benchPress' } })

  router.back()
  await vi.waitFor(() => expect(leaveConfirm.pending.value).toBe(true))
  leaveConfirm.cancel()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('training')
  expect(history.location).toBe('/benchPress/training')

  router.back()
  await vi.waitFor(() => expect(leaveConfirm.pending.value).toBe(true))
  leaveConfirm.confirm()
  await waitForNavigation(router)
  expect(router.currentRoute.value.name).toBe('home')
  expect(session.leave).toHaveBeenCalledOnce()
})
