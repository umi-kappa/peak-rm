import { computed, ref } from 'vue'

import { EXERCISE_LABELS } from '@/core/constants'
import type { ReadonlySession, SetResult } from '@/core/types'

/**
 * セット編集モーダル（SetEditDialog）の画面側 glue を共通化するヘッドレス層。
 * 対象 index の保持・モーダルへ渡す値の導出・open / close / save の配線だけを担い、
 * 保存先の規則（status 再導出の有無など）は save 関数として画面から受け取る
 * （インターバル画面 = useSession.patchResultAt / 結果確認画面 = useResultSession.patchResultAt）。
 */
export function useSetEdit(
  getSession: () => ReadonlySession | undefined,
  save: (index: number, patch: SetResult) => Promise<void>,
) {
  // セット編集モーダルの対象 index。undefined = 非表示（唯一のソース）
  const editingIndex = ref<number>()

  // 編集対象の完了セットからモーダルへ渡す値を導出する。対象が無ければモーダルごと出さない
  const editingSet = computed(() => {
    const current = getSession()
    if (current === undefined || editingIndex.value === undefined) return undefined
    const result = current.results[editingIndex.value]
    if (result === undefined) return undefined
    return {
      exerciseLabel: EXERCISE_LABELS[current.exercise],
      weight: current.menu.weight,
      setNumber: editingIndex.value + 1,
      actualReps: result.actualReps,
      memo: result.memo,
    }
  })

  function openSetEdit(index: number) {
    editingIndex.value = index
  }

  function closeSetEdit() {
    editingIndex.value = undefined
  }

  // SAVE で実績とメモを 1 回の patch で保存して閉じる
  async function saveSetEdit(result: SetResult) {
    const index = editingIndex.value
    if (index === undefined) return
    await save(index, result)
    closeSetEdit()
  }

  return { editingSet, openSetEdit, closeSetEdit, saveSetEdit }
}
