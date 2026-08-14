import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useWakeLock, type WakeLockHandle } from '@/composables/shared/platform/useWakeLock'

function makeFakeSentinel(released = false) {
  return { released, release: vi.fn(async () => {}) } satisfies WakeLockHandle
}

// 取得口・sentinel の両方を掴んだまま composable を組み立てる。
// 自動解除済みの sentinel を試すケースだけ引数で差し替える
function setup(sentinel = makeFakeSentinel()) {
  const requestScreenLock = vi.fn(async () => sentinel)
  return { wakeLock: useWakeLock({ requestScreenLock }), requestScreenLock, sentinel }
}

// 取得の解決時刻をテストから決める。終端をまたぐ順序（acquire 開始 → release → 解決）用
function setupPending() {
  const sentinel = makeFakeSentinel()
  let settle = () => {}
  const requestScreenLock = vi.fn(
    () =>
      new Promise<WakeLockHandle>((resolve) => {
        settle = () => resolve(sentinel)
      }),
  )
  return {
    wakeLock: useWakeLock({ requestScreenLock }),
    requestScreenLock,
    sentinel,
    settle: () => settle(),
  }
}

describe('useWakeLock', () => {
  beforeEach(() => {
    // 縮退時の console.error はテスト出力に出さず、呼ばれたことだけを検証する
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('acquire で Wake Lock を要求する', async () => {
    const { wakeLock, requestScreenLock } = setup()
    await wakeLock.acquire()
    expect(requestScreenLock).toHaveBeenCalledTimes(1)
  })

  test('取得済みなら acquire を繰り返しても再取得しない', async () => {
    const { wakeLock, requestScreenLock } = setup()
    await wakeLock.acquire()
    await wakeLock.acquire()
    expect(requestScreenLock).toHaveBeenCalledTimes(1)
  })

  test('release で取得した Wake Lock を解除する', async () => {
    const { wakeLock, sentinel } = setup()
    await wakeLock.acquire()
    await wakeLock.release()
    expect(sentinel.release).toHaveBeenCalledTimes(1)
  })

  test('解除後は再取得できる', async () => {
    const { wakeLock, requestScreenLock } = setup()
    await wakeLock.acquire()
    await wakeLock.release()
    await wakeLock.acquire()
    expect(requestScreenLock).toHaveBeenCalledTimes(2)
  })

  test('取得を待つ間に終端していたら、届いた Wake Lock を保持せず解除する', async () => {
    const { wakeLock, sentinel, settle } = setupPending()
    const acquiring = wakeLock.acquire()
    await wakeLock.release()
    settle()
    await acquiring
    expect(sentinel.release).toHaveBeenCalledTimes(1)
  })

  test('終端をまたいで届いた Wake Lock は次の取得を妨げない', async () => {
    const { wakeLock, requestScreenLock, settle } = setupPending()
    const acquiring = wakeLock.acquire()
    await wakeLock.release()
    settle()
    await acquiring
    // 次セッションの取得。解決は待たず、要求が届いたことだけを見る
    void wakeLock.acquire()
    expect(requestScreenLock).toHaveBeenCalledTimes(2)
  })

  test('取得していないときの release は何もしない', async () => {
    const { wakeLock, sentinel } = setup()
    await wakeLock.release()
    expect(sentinel.release).not.toHaveBeenCalled()
  })

  test('背景化でブラウザが自動解除した Wake Lock には触らない', async () => {
    const { wakeLock, sentinel } = setup(makeFakeSentinel(true))
    await wakeLock.acquire()
    await wakeLock.release()
    expect(sentinel.release).not.toHaveBeenCalled()
  })

  test('取得を拒否されても呼び出し元へ投げない', async () => {
    const wakeLock = useWakeLock({
      requestScreenLock: async () => {
        throw new Error('denied')
      },
    })
    await expect(wakeLock.acquire()).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })

  test('解除に失敗しても呼び出し元へ投げない', async () => {
    const { wakeLock, sentinel } = setup()
    sentinel.release.mockImplementation(async () => {
      throw new Error('already released')
    })
    await wakeLock.acquire()
    await expect(wakeLock.release()).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })

  test('Wake Lock 非対応の環境では何もしない', async () => {
    // happy-dom の navigator は wakeLock を持たないため、deps 未指定でこの経路に入る
    expect(navigator.wakeLock).toBeUndefined()
    const wakeLock = useWakeLock()
    await expect(wakeLock.acquire()).resolves.toBeUndefined()
    await expect(wakeLock.release()).resolves.toBeUndefined()
    expect(console.error).not.toHaveBeenCalled()
  })
})
