import { useSession, type SessionStore } from '@/composables/shared/session/useSession'
import type { Menu } from '@/core/types'

// 実 DB へ書かない fake repo。stories は表示状態だけ欲しいので永続化はすべて握りつぶす
const noopRepo = {
  insert: async () => {},
  patchResults: async () => {},
  patchResultsAndStatus: async () => {},
  finalize: async () => {},
}

/**
 * Storybook 用に useSession を実際に駆動して途中状態の store を作る（stories の loaders から使う）。
 * completedReps を先頭から completeSet で積み、phase: 'setActive' なら続けて nextSet で
 * 次セット実行中へ進める（training 画面用。interval 画面はインターバル中のまま渡す）。
 */
export async function makeSessionStore(options: {
  menu?: Partial<Menu>
  /** 完了済みセットの実績回数（先頭から順に積む） */
  completedReps?: number[]
  /** completedReps を積んだ後に到達させるフェーズ。省略時は interval のまま */
  phase?: 'setActive' | 'interval'
}): Promise<SessionStore> {
  const menu: Menu = {
    exercise: 'benchPress',
    weight: 82.5,
    reps: 8,
    sets: 3,
    intervalSec: 90,
    ...options.menu,
  }
  const store = useSession({ sessionRepo: noopRepo })
  await store.start(menu)
  for (const reps of options.completedReps ?? []) {
    // completeSet 直後は interval フェーズになるため、次のセットを積む前に setActive へ戻す
    if (store.phase.value === 'interval') store.nextSet()
    store.editCurrentReps(reps)
    await store.completeSet()
  }
  if (options.phase === 'setActive') store.nextSet()
  return store
}
