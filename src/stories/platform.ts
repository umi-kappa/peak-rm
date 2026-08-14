import { readonly, ref } from 'vue'
import { fn } from 'storybook/test'
import type { AudioCueStore } from '@/composables/shared/platform/useAudioCue'
import type { WakeLockStore } from '@/composables/shared/platform/useWakeLock'

/**
 * 音を鳴らさない fake の再生口（stories の loaders / provide decorator から使う）。
 * 呼び出しは fn で記録し、play 関数から配線を assert できるようにする。
 * ringing は実物と同じく start / stop に追従させ、停止ボタンの活性表現を再現する。
 */
export function makeAudioCue(): AudioCueStore {
  const ringing = ref(false)
  return {
    prepare: fn(async () => {}),
    start: fn(() => {
      ringing.value = true
    }),
    stop: fn(() => {
      ringing.value = false
    }),
    suspend: fn(async () => {
      ringing.value = false
    }),
    ringing: readonly(ringing),
  }
}

/** ブラウザへ Wake Lock を要求しない fake（同上） */
export function makeWakeLock(): WakeLockStore {
  return {
    acquire: fn(async () => {}),
    release: fn(async () => {}),
  }
}
