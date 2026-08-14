import { nextTick, readonly, ref } from 'vue'
import { expect, test, vi } from 'vitest'

import { installSessionEndRelease } from '@/composables/shared/platform/installSessionEndRelease'
import type { TrainingPhase } from '@/composables/shared/session/useSession'

// 配線対象の最小面だけを渡す。phase はテストから任意のフェーズへ動かす
function install(phase: TrainingPhase) {
  const phaseRef = ref<TrainingPhase>(phase)
  const wakeLock = { release: vi.fn(async () => {}) }
  const audioCue = { suspend: vi.fn(async () => {}) }
  installSessionEndRelease({ phase: readonly(phaseRef) }, wakeLock, audioCue)
  return { phaseRef, wakeLock, audioCue }
}

test('セッションが終端すると Wake Lock を解除して音声出力を止める', async () => {
  const { phaseRef, wakeLock, audioCue } = install('interval')
  phaseRef.value = 'done'
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
