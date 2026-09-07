import { afterEach, expect, test, vi } from 'vitest'
import { effectScope } from 'vue'
import {
  useVisualViewport,
  type VisualViewportLike,
} from '@/composables/shared/platform/useVisualViewport'

// offsetTop / height を書き換えて resize / scroll を発火できる最小の fake。
// 解除は本物の EventTarget と同じく type と listener 参照の両方が一致したときだけ通す
// （type だけで消す fake は、別の関数参照を渡す実装の退行を見逃す）
function makeVisualViewport(offsetTop = 0, height = 800) {
  const listeners = new Set<{ type: string; listener: () => void }>()
  const viewport = {
    offsetTop,
    height,
    addEventListener: vi.fn((type: string, listener: () => void) => {
      listeners.add({ type, listener })
    }),
    removeEventListener: vi.fn((type: string, listener: () => void) => {
      for (const entry of listeners) {
        if (entry.type === type && entry.listener === listener) listeners.delete(entry)
      }
    }),
  }
  return {
    viewport: viewport as unknown as VisualViewportLike,
    fire(type: 'resize' | 'scroll', next: { offsetTop?: number; height?: number }) {
      Object.assign(viewport, next)
      for (const entry of listeners) {
        if (entry.type === type) entry.listener()
      }
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

// stubGlobal はテストが途中で落ちても戻るよう afterEach で解除する
afterEach(() => {
  vi.unstubAllGlobals()
})

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
  // deps 省略時は window.visualViewport を見る。DOM シムが将来この API を生やしても
  // テストの意味が変わらないよう、非対応であることを明示する
  vi.stubGlobal('visualViewport', undefined)

  const { offsetTop, height } = setup()

  expect(offsetTop.value).toBe(0)
  expect(height.value).toBeUndefined()
})
