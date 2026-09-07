import { expect, test, vi } from 'vitest'
import { effectScope } from 'vue'
import {
  useVisualViewport,
  type VisualViewportLike,
} from '@/composables/shared/platform/useVisualViewport'

// offsetTop / height を書き換えて resize / scroll を発火できる最小の fake
function makeVisualViewport(offsetTop = 0, height = 800) {
  const listeners = new Map<string, () => void>()
  const viewport = {
    offsetTop,
    height,
    addEventListener: vi.fn((type: string, listener: () => void) => {
      listeners.set(type, listener)
    }),
    removeEventListener: vi.fn((type: string) => {
      listeners.delete(type)
    }),
  }
  return {
    viewport: viewport as unknown as VisualViewportLike,
    fire(type: 'resize' | 'scroll', next: { offsetTop?: number; height?: number }) {
      Object.assign(viewport, next)
      listeners.get(type)?.()
    },
    listenerCount: () => listeners.size,
  }
}

function setup(visualViewport?: VisualViewportLike) {
  const scope = effectScope()
  const result = scope.run(() => useVisualViewport({ visualViewport }))
  if (!result) throw new Error('effectScope.run が undefined を返しました')
  return { scope, ...result }
}

test('初期値は現在の offsetTop / height', () => {
  const { viewport } = makeVisualViewport(12, 700)
  const { offsetTop, height } = setup(viewport)

  expect(offsetTop.value).toBe(12)
  expect(height.value).toBe(700)
})

test('resize（キーボードの出入り）と scroll（表示中のパン）に追従する', () => {
  const fake = makeVisualViewport()
  const { offsetTop, height } = setup(fake.viewport)

  fake.fire('resize', { height: 508 })
  expect(height.value).toBe(508)

  fake.fire('scroll', { offsetTop: 40 })
  expect(offsetTop.value).toBe(40)
})

test('スコープ破棄でリスナーを外す', () => {
  const fake = makeVisualViewport()
  const { scope, height } = setup(fake.viewport)
  expect(fake.listenerCount()).toBe(2)

  scope.stop()

  expect(fake.listenerCount()).toBe(0)
  fake.fire('resize', { height: 508 })
  expect(height.value).toBe(800)
})

test('非対応環境（visualViewport 無し）では height が undefined のまま', () => {
  // deps 省略時は window.visualViewport を見る。happy-dom には無いため非対応環境として振る舞う
  const { offsetTop, height } = setup()

  expect(offsetTop.value).toBe(0)
  expect(height.value).toBeUndefined()
})
