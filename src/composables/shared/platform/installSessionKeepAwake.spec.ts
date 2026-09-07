import { readonly, ref, shallowRef } from 'vue'
import { expect, test, vi } from 'vitest'

import { installSessionKeepAwake } from '@/composables/shared/platform/installSessionKeepAwake'
import type { TrainingPhase } from '@/composables/shared/session/useSession'

// document の代わりに visibilityState を書き換えられる EventTarget を渡し、
// 復帰 / 背景化をテストから起こす
class FakeVisibilityTarget extends EventTarget {
  visibilityState: DocumentVisibilityState = 'visible'

  change(state: DocumentVisibilityState) {
    this.visibilityState = state
    this.dispatchEvent(new Event('visibilitychange'))
  }
}

function install(phase: TrainingPhase) {
  const phaseRef = ref<TrainingPhase>(phase)
  const errorRef = shallowRef<Error>()
  const wakeLock = { acquire: vi.fn(async () => {}) }
  const target = new FakeVisibilityTarget()
  installSessionKeepAwake(
    { phase: readonly(phaseRef) },
    { error: readonly(errorRef) },
    wakeLock,
    target,
  )
  return { phaseRef, errorRef, wakeLock, target }
}

test('セッション中に前景へ復帰すると Wake Lock を取り直す', () => {
  const { wakeLock, target } = install('interval')
  target.change('hidden')
  target.change('visible')
  expect(wakeLock.acquire).toHaveBeenCalledTimes(1)
})

test('背景化では取得しない（ブラウザの自動解除に任せる）', () => {
  const { wakeLock, target } = install('interval')
  target.change('hidden')
  expect(wakeLock.acquire).not.toHaveBeenCalled()
})

test('セッションが終端していれば復帰しても取得しない', () => {
  const { wakeLock, target } = install('done')
  target.change('hidden')
  target.change('visible')
  expect(wakeLock.acquire).not.toHaveBeenCalled()
})

test('fatal error 表示中は復帰しても取得しない', () => {
  // エラー画面への差し替えは phase を終端させないため、解除側と対称に別の契機として見る
  const { errorRef, wakeLock, target } = install('setActive')
  errorRef.value = new Error('boom')
  target.change('hidden')
  target.change('visible')
  expect(wakeLock.acquire).not.toHaveBeenCalled()
})

test('target を省略すると document の visibilitychange を購読する（main.ts の結線）', () => {
  const wakeLock = { acquire: vi.fn(async () => {}) }
  installSessionKeepAwake(
    { phase: readonly(ref<TrainingPhase>('interval')) },
    { error: readonly(shallowRef<Error>()) },
    wakeLock,
  )
  // happy-dom の document.visibilityState は常に 'visible'。配線はアプリ寿命で解除しないため
  // リスナーは document に残る。他のテストは fake の target にだけ dispatch するので干渉しないが、
  // 後ろに document を使うテストを足すと数がずれるので、このテストはファイル末尾に置く
  document.dispatchEvent(new Event('visibilitychange'))
  expect(wakeLock.acquire).toHaveBeenCalledTimes(1)
})
