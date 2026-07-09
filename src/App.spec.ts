import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { RouterView } from 'vue-router'

import App from '@/App.vue'
import ErrorScreen from '@/components/app/ErrorScreen.vue'
import {
  fatalErrorInjectionKey,
  useFatalError,
  type FatalErrorStore,
} from '@/composables/shared/error/useFatalError'

describe('App', () => {
  // RouterView は router を構築せず stub で置換する。fatalError store は inject 経路で注入する。
  function mountApp(store: FatalErrorStore) {
    return mount(App, {
      global: {
        stubs: { RouterView: true },
        provide: { [fatalErrorInjectionKey as symbol]: store },
      },
    })
  }

  test('error を持つ store のときは ErrorScreen を描画し RouterView は描画しない', () => {
    const store = useFatalError()
    store.report(new Error('boom'))
    const wrapper = mountApp(store)
    const errorScreen = wrapper.findComponent(ErrorScreen)
    expect(errorScreen.exists()).toBe(true)
    expect(errorScreen.props('message')).toBe('boom')
    expect(wrapper.findComponent(RouterView).exists()).toBe(false)
  })

  test('error が無い store のときは RouterView を描画し ErrorScreen は描画しない', () => {
    const wrapper = mountApp(useFatalError())
    expect(wrapper.findComponent(RouterView).exists()).toBe(true)
    expect(wrapper.findComponent(ErrorScreen).exists()).toBe(false)
  })

  test('fatalError store が provide されていないと mount 時に throw する', () => {
    // provide を渡さずマウントすると setup の inject ガードが throw する。
    // Vue が出す setup throw の警告はこのテストでのみ発生するため、抑止もここに閉じる
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(App, { global: { stubs: { RouterView: true } } })).toThrow(
      'fatal error store is not provided',
    )
    warn.mockRestore()
  })
})
