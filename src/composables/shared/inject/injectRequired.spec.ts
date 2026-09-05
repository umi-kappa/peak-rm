import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, type InjectionKey } from 'vue'

import { fatalErrorInjectionKey } from '@/composables/shared/error/useFatalError'
import { injectRequired } from '@/composables/shared/inject/injectRequired'
import { audioCueInjectionKey } from '@/composables/shared/platform/useAudioCue'
import { wakeLockInjectionKey } from '@/composables/shared/platform/useWakeLock'
import { sessionInjectionKey } from '@/composables/shared/session/useSession'
import { backupInjectionKey } from '@/storage/backup'
import { sessionRepoInjectionKey } from '@/storage/sessionRepo'

// setup 内で injectRequired を呼び、受け取った値を描画するだけのコンポーネント
function mountWith<T>(key: InjectionKey<T>, provide?: Record<symbol, unknown>) {
  const Consumer = defineComponent({
    setup() {
      const value = injectRequired(key)
      return () => String(value)
    },
  })
  return mount(Consumer, { global: { provide } })
}

beforeEach(() => {
  // 未 provide のケースを含むため、Vue の警告（injection not found / setup throw）を抑止する
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('provide 済みの値をそのまま返す', () => {
  const key: InjectionKey<number> = Symbol('answer')
  const wrapper = mountWith(key, { [key as symbol]: 42 })
  expect(wrapper.text()).toBe('42')
})

test('falsy な値でも provide されていれば throw しない', () => {
  const key: InjectionKey<number> = Symbol('zero')
  const wrapper = mountWith(key, { [key as symbol]: 0 })
  expect(wrapper.text()).toBe('0')
})

test('未 provide なら Symbol の description を載せて throw する', () => {
  const key: InjectionKey<number> = Symbol('answer')
  expect(() => mountWith(key)).toThrow('answer is not provided')
})

test('description の無い Symbol は Symbol() を載せて throw する', () => {
  const key: InjectionKey<number> = Symbol()
  expect(() => mountWith(key)).toThrow('Symbol() is not provided')
})

describe('injection key の description', () => {
  // 欠落メッセージは description から生成されるため、injectRequired で受ける必須依存の key 全件で固定する
  // （default 付きの任意依存 intervalTimerDeps は対象外）
  const REQUIRED_KEYS: [name: string, key: InjectionKey<unknown>][] = [
    ['fatalError', fatalErrorInjectionKey],
    ['session', sessionInjectionKey],
    ['sessionRepo', sessionRepoInjectionKey],
    ['audioCue', audioCueInjectionKey],
    ['wakeLock', wakeLockInjectionKey],
    ['backup', backupInjectionKey],
  ]

  test.each(REQUIRED_KEYS)('%s の injection key は description に名前を持つ', (name, key) => {
    expect(key.description).toBe(name)
  })
})
