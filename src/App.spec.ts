import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { RouterView } from 'vue-router'

import App from '@/App.vue'
import ErrorScreen from '@/components/app/ErrorScreen.vue'
import ConfirmDialog from '@/components/shared/ui/dialog/ConfirmDialog.vue'
import {
  sessionLeaveConfirmInjectionKey,
  useSessionLeaveConfirm,
  type SessionLeaveConfirmStore,
} from '@/composables/shared/session/useSessionLeaveConfirm'
import {
  fatalErrorInjectionKey,
  useFatalError,
  type FatalErrorStore,
} from '@/composables/shared/error/useFatalError'

describe('App', () => {
  // RouterView は router を構築せず stub で置換する。store は inject 経路で注入する。
  // ConfirmDialog の見た目・振る舞いは Storybook が担う（docs/conventions.md「テスト」）ため stub にし、
  // ここでは App 側の配線（描画条件・渡す文言・confirm / cancel が問い合わせを解決すること）だけを見る
  function mountApp(
    store: FatalErrorStore,
    leaveConfirm: SessionLeaveConfirmStore = useSessionLeaveConfirm(),
  ) {
    return mount(App, {
      global: {
        stubs: { RouterView: true, ConfirmDialog: true },
        provide: {
          [fatalErrorInjectionKey as symbol]: store,
          [sessionLeaveConfirmInjectionKey as symbol]: leaveConfirm,
        },
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

  test('離脱確認の問い合わせが開いている間だけ確認ダイアログを描画する', async () => {
    const leaveConfirm = useSessionLeaveConfirm()
    const wrapper = mountApp(useFatalError(), leaveConfirm)
    expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(false)

    const asked = leaveConfirm.request()
    await nextTick()
    const dialog = wrapper.findComponent(ConfirmDialog)
    expect(dialog.exists()).toBe(true)
    // 離脱は中断の確定と同じ破壊的操作なので、問いかけと確定ラベルはインターバル画面の中断確認と揃える
    expect(dialog.props('title')).toBe('トレーニングを中断しますか？')
    expect(dialog.props('confirmLabel')).toBe('中断する')
    // 本文だけは離脱固有の結果（履歴に残る・ホームへ戻る）を書く
    expect(dialog.props('message')).toBe('完了したセットは中断として履歴に残り、ホームへ戻ります。')

    // ダイアログの確定が問い合わせを「離脱する」で解決する配線
    dialog.vm.$emit('confirm')
    await expect(asked).resolves.toBe(true)
    await nextTick()
    expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(false)
  })

  test('確認ダイアログのキャンセルは問い合わせを「離脱しない」で解決し、ダイアログを閉じる', async () => {
    const leaveConfirm = useSessionLeaveConfirm()
    const wrapper = mountApp(useFatalError(), leaveConfirm)

    const asked = leaveConfirm.request()
    await nextTick()
    // キャンセルボタン・Escape・backdrop はいずれも ConfirmDialog の cancel に集約されてここへ届く
    wrapper.findComponent(ConfirmDialog).vm.$emit('cancel')
    await expect(asked).resolves.toBe(false)
    await nextTick()
    expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(false)
  })

  test('fatalError store が provide されていないと mount 時に throw する', () => {
    // provide を渡さずマウントすると setup の inject ガードが throw する。
    // Vue が出す setup throw の警告はこのテストでのみ発生するため、抑止もここに閉じる
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(App, { global: { stubs: { RouterView: true } } })).toThrow(
      'fatalError is not provided',
    )
    warn.mockRestore()
  })
})
