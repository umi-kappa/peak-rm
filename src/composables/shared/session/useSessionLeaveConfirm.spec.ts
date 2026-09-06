import { describe, expect, test } from 'vitest'

import { useSessionLeaveConfirm } from '@/composables/shared/session/useSessionLeaveConfirm'

describe('useSessionLeaveConfirm', () => {
  test('request で問い合わせが開き、confirm で離脱可として解決する', async () => {
    const store = useSessionLeaveConfirm()
    const asked = store.request()
    expect(store.pending.value).toBe(true)
    store.confirm()
    await expect(asked).resolves.toBe(true)
    expect(store.pending.value).toBe(false)
  })

  test('cancel で離脱取り消しとして解決する', async () => {
    const store = useSessionLeaveConfirm()
    const asked = store.request()
    store.cancel()
    await expect(asked).resolves.toBe(false)
    expect(store.pending.value).toBe(false)
  })

  test('問い合わせ中に重ねて request されたら、前の問い合わせは取り消しで畳む', async () => {
    const store = useSessionLeaveConfirm()
    const first = store.request()
    const second = store.request()
    await expect(first).resolves.toBe(false)
    expect(store.pending.value).toBe(true)
    store.confirm()
    await expect(second).resolves.toBe(true)
  })

  test('generation は request のたびに進む', () => {
    const store = useSessionLeaveConfirm()
    expect(store.generation.value).toBe(0)
    store.request()
    expect(store.generation.value).toBe(1)
    // 前の問い合わせを畳んで開き直しても 1 回と数える
    store.request()
    expect(store.generation.value).toBe(2)
  })

  test('confirm / cancel は generation を進めない（呼び出し側は答えと畳みを generation で区別する）', () => {
    const store = useSessionLeaveConfirm()
    store.request()
    store.confirm()
    expect(store.generation.value).toBe(1)
    store.request()
    store.cancel()
    expect(store.generation.value).toBe(2)
  })

  test('問い合わせが無いときの confirm / cancel は何もしない', () => {
    const store = useSessionLeaveConfirm()
    store.confirm()
    store.cancel()
    expect(store.pending.value).toBe(false)
  })
})
