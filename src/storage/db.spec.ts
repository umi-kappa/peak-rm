import { afterEach, describe, expect, test, vi } from 'vitest'

import { requestPersistentStorage } from '@/storage/db'

describe('requestPersistentStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('navigator.storage が無い環境では false を返し例外を投げない', async () => {
    vi.stubGlobal('navigator', {})
    await expect(requestPersistentStorage()).resolves.toBe(false)
  })

  test('persist が true を返せば true を返す', async () => {
    vi.stubGlobal('navigator', { storage: { persist: () => Promise.resolve(true) } })
    await expect(requestPersistentStorage()).resolves.toBe(true)
  })

  test('既に永続化済み（persisted が true）なら persist を要求せず true を返す', async () => {
    const persist = vi.fn(() => Promise.resolve(true))
    vi.stubGlobal('navigator', { storage: { persisted: () => Promise.resolve(true), persist } })
    await expect(requestPersistentStorage()).resolves.toBe(true)
    expect(persist).not.toHaveBeenCalled()
  })

  test('persist が false を resolve（拒否）すれば false を返す', async () => {
    vi.stubGlobal('navigator', { storage: { persist: () => Promise.resolve(false) } })
    await expect(requestPersistentStorage()).resolves.toBe(false)
  })

  test('persist が reject しても false を返す', async () => {
    vi.stubGlobal('navigator', { storage: { persist: () => Promise.reject(new Error('denied')) } })
    await expect(requestPersistentStorage()).resolves.toBe(false)
  })
})
