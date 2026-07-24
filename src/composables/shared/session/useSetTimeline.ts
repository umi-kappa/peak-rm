import { computed } from 'vue'

import type { ReadonlySession } from '@/core/types'

/**
 * セットタイムライン（TimelineSetCard の列）へ渡す view-model の導出を共通化するヘッドレス層。
 * results[i] があるのは done のみで、未実施セットの実績・メモは undefined のままカードへ渡す。
 * live = 進行中（インターバル画面）のときだけ先頭の未実施セットを next に昇格させる
 * （結果確認画面は done / pending の 2 状態。spec「結果確認画面」）。
 */
export function useSetTimeline(
  getSession: () => ReadonlySession | undefined,
  options: { live: boolean },
) {
  const cards = computed(() => {
    const current = getSession()
    if (current === undefined) return []
    const doneCount = current.results.length
    return Array.from({ length: current.menu.sets }, (_, i) => ({
      index: i,
      setNumber: i + 1,
      state: cardState(i, doneCount, options.live),
      actualReps: current.results[i]?.actualReps,
      memo: current.results[i]?.memo,
    }))
  })

  return { cards }
}

function cardState(index: number, doneCount: number, live: boolean): 'done' | 'next' | 'pending' {
  if (index < doneCount) return 'done'
  return live && index === doneCount ? 'next' : 'pending'
}
