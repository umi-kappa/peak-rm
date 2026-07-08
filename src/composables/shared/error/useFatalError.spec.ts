import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { AppConfig } from 'vue'
import type { Router } from 'vue-router'

import { installErrorBoundary, useFatalError } from '@/composables/shared/error/useFatalError'

describe('useFatalError', () => {
  test('report したエラーが error に反映される', () => {
    const { error, report } = useFatalError()
    expect(error.value).toBeUndefined()
    const cause = new Error('boom')
    report(cause)
    expect(error.value).toBe(cause)
  })

  test('2 回目以降の report は最初のエラーを上書きしない', () => {
    const { error, report } = useFatalError()
    const first = new Error('first')
    report(first)
    report(new Error('second'))
    expect(error.value).toBe(first)
  })

  test('Error 以外の値の report は Error に正規化して保持する', () => {
    const { error, report } = useFatalError()
    report('boom')
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toBe('boom')
  })

  test('空 message の Error の report は Unknown error に落とす', () => {
    const { error, report } = useFatalError()
    report(new Error(''))
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toBe('Unknown error')
  })

  test('値なし（undefined）の report は「エラーなし」と区別して Unknown error に正規化する', () => {
    const { error, report } = useFatalError()
    report(undefined)
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toBe('Unknown error')
  })

  test('空文字・無情報なオブジェクトの report は Unknown error に落とす', () => {
    const empty = useFatalError()
    empty.report('')
    expect(empty.error.value?.message).toBe('Unknown error')

    const object = useFatalError()
    object.report({ code: 500 })
    expect(object.error.value?.message).toBe('Unknown error')
  })

  test('文字列化で throw する値（toString/valueOf を持たない）の report も Unknown error に落とす', () => {
    const { error, report } = useFatalError()
    // Object.create(null) は String() が TypeError を throw する。最終防波堤の report が
    // 巻き込まれて throw しないことを保証する（try/catch で握り Unknown error に落とす）
    expect(() => report(Object.create(null))).not.toThrow()
    expect(error.value?.message).toBe('Unknown error')
  })
})

describe('installErrorBoundary', () => {
  // happy-dom は ErrorEvent / PromiseRejectionEvent を持たないため、リスナーが読むプロパティ
  // （error / reason）だけを Event に生やして捕捉したハンドラへ直接渡す
  function windowEvent(props: Record<string, unknown>): Event {
    return Object.assign(new Event('boundary'), props)
  }

  function install() {
    const report = vi.fn()
    const app: { config: Pick<AppConfig, 'errorHandler'> } = { config: {} }
    // vue-router の onError は 3 引数（err / to / from）のハンドラを受け unsubscribe 関数を返す。
    // テストは err だけ渡して発火を確認するので、捕捉時に err のみ受ける形へ絞って保持する
    let routerOnError: ((err: unknown) => void) | undefined
    const router: Pick<Router, 'onError'> = {
      onError: (handler) => {
        routerOnError = handler as (err: unknown) => void
        return () => {}
      },
    }
    // installErrorBoundary が window に張るリスナー（error / unhandledrejection）を捕捉する。
    // 実 window へ dispatch せず捕捉したハンドラを直接呼ぶことで、テスト間のリスナー蓄積を防ぐ
    const windowHandlers = new Map<string, (event: Event) => void>()
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      windowHandlers.set(type, listener as (event: Event) => void)
    })
    installErrorBoundary(app, router, report)
    // errorHandler の instance / info 引数はテストに無関係なので、err だけ渡す形に型を絞って呼ぶ
    const triggerVueError = app.config.errorHandler as (e: unknown) => void
    return { report, triggerVueError, routerOnError: routerOnError!, windowHandlers }
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
    const { report, windowHandlers } = install()
    const reason = new Error('floating')
    windowHandlers.get('unhandledrejection')!(windowEvent({ reason }))
    expect(report).toHaveBeenCalledWith(reason)
  })

  test('window の error は event.error が Error のときだけ report する', () => {
    const { report, windowHandlers } = install()
    const err = new Error('sync boom')
    windowHandlers.get('error')!(windowEvent({ error: err }))
    expect(report).toHaveBeenCalledWith(err)
  })

  test('window の error は error が Error でない（クロスオリジンの Script error. 等）なら report しない', () => {
    const { report, windowHandlers } = install()
    // クロスオリジンの "Script error." は event.error を持たない。Error でないことが除外条件
    windowHandlers.get('error')!(windowEvent({ error: undefined }))
    expect(report).not.toHaveBeenCalled()
  })
})
