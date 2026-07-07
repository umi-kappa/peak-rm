import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { App } from 'vue'
import type { Router } from 'vue-router'

import { installErrorBoundary } from '@/composables/shared/error/installErrorBoundary'

// happy-dom は ErrorEvent / PromiseRejectionEvent を持たないため、リスナーが読むプロパティ
// （error / reason）だけを Event に生やして window へ dispatch し、経路を再現する
function dispatchWindow(type: 'error' | 'unhandledrejection', props: Record<string, unknown>) {
  window.dispatchEvent(Object.assign(new Event(type), props))
}

function install() {
  const report = vi.fn()
  const app = { config: {} } as App
  let routerOnError: ((err: unknown) => void) | undefined
  const router = {
    onError: (cb: (err: unknown) => void) => {
      routerOnError = cb
    },
  } as unknown as Router
  installErrorBoundary(app, router, report)
  // errorHandler の instance / info 引数はテストに無関係なので、err だけ渡す形に型を絞って呼ぶ
  const triggerVueError = app.config.errorHandler as unknown as (e: unknown) => void
  return { report, triggerVueError, routerOnError: routerOnError! }
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('errorHandler に設定した関数が report し、Vue 既定出力の補償として console.error も呼ぶ', () => {
  const { report, triggerVueError } = install()
  const err = new Error('render boom')
  triggerVueError(err)
  expect(report).toHaveBeenCalledWith(err)
  expect(console.error).toHaveBeenCalledWith(err)
})

test('router.onError に登録した関数が report し、console.error も呼ぶ', () => {
  const { report, routerOnError } = install()
  const err = new Error('nav boom')
  routerOnError(err)
  expect(report).toHaveBeenCalledWith(err)
  expect(console.error).toHaveBeenCalledWith(err)
})

test('window の unhandledrejection の reason を report する', () => {
  const { report } = install()
  const reason = new Error('floating')
  dispatchWindow('unhandledrejection', { reason })
  expect(report).toHaveBeenCalledWith(reason)
})

test('window の error は event.error が Error のときだけ report する', () => {
  const { report } = install()
  const err = new Error('sync boom')
  dispatchWindow('error', { error: err })
  expect(report).toHaveBeenCalledWith(err)
})

test('window の error は error が Error でない（クロスオリジンの Script error. 等）なら report しない', () => {
  const { report } = install()
  // クロスオリジンの "Script error." は event.error を持たない。Error でないことが除外条件
  dispatchWindow('error', { error: undefined })
  expect(report).not.toHaveBeenCalled()
})
