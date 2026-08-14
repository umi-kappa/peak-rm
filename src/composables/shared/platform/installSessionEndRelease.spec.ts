import { nextTick, readonly, ref, shallowRef } from 'vue'
import { expect, test, vi } from 'vitest'

import { installSessionEndRelease } from '@/composables/shared/platform/installSessionEndRelease'
import type { TrainingPhase } from '@/composables/shared/session/useSession'

// 配線対象の最小面だけを渡す。phase と fatal error はテストから任意の状態へ動かす
function install(phase: TrainingPhase) {
  const phaseRef = ref<TrainingPhase>(phase)
  const errorRef = shallowRef<Error>()
  const wakeLock = { release: vi.fn(async () => {}) }
  const audioCue = { suspend: vi.fn(async () => {}) }
  installSessionEndRelease(
    { phase: readonly(phaseRef) },
    { error: readonly(errorRef) },
    wakeLock,
    audioCue,
  )
  return { phaseRef, errorRef, wakeLock, audioCue }
}

test('セッションが終端すると Wake Lock を解除して音声出力を止める', async () => {
  const { phaseRef, wakeLock, audioCue } = install('interval')
  phaseRef.value = 'done'
  await nextTick()
  expect(wakeLock.release).toHaveBeenCalledTimes(1)
  expect(audioCue.suspend).toHaveBeenCalledTimes(1)
})

test('fatal error の報告でも解除する', async () => {
  // エラー画面への差し替えは画面遷移ではないため phase は終端しないまま残る
  const { errorRef, wakeLock, audioCue } = install('interval')
  errorRef.value = new Error('boom')
  await nextTick()
  expect(wakeLock.release).toHaveBeenCalledTimes(1)
  expect(audioCue.suspend).toHaveBeenCalledTimes(1)
})

test('セット実行中とインターバルの往復では解除しない', async () => {
  const { phaseRef, wakeLock, audioCue } = install('setActive')
  phaseRef.value = 'interval'
  await nextTick()
  phaseRef.value = 'setActive'
  await nextTick()
  expect(wakeLock.release).not.toHaveBeenCalled()
  expect(audioCue.suspend).not.toHaveBeenCalled()
})
