import { readonly, ref } from 'vue'
import type { InjectionKey } from 'vue'

/**
 * セッションフロー離脱の確認（spec「セッションフローからの離脱」）を router のガードと画面の間で
 * 待ち合わせる状態。ガード（component tree の外）が request() で問い合わせを開き、
 * App.vue が pending を見て確認ダイアログを描き、confirm / cancel で問い合わせを解決する。
 * generation は問い合わせを開いた回数で、ガードとトレーニング画面が await をまたいで比較し、
 * その間に別の問い合わせが開いたかを判定する。
 * main.ts が単一インスタンスを生成し、createAppRouter へ渡しつつ app.provide で配る（useSession と同じ配線）。
 */
export function useSessionLeaveConfirm() {
  const pending = ref(false)
  // 問い合わせを開いた回数。答えは false（取り消し）に畳まれると「ユーザーの答え」と区別が付かないため、
  // 呼び出し側は await をまたいで比較し、その間に別の問い合わせが開いたかを判定する
  const generation = ref(0)
  let settle: ((leave: boolean) => void) | undefined

  /** 離脱してよいか問い合わせる。confirm で true、cancel で false に解決する */
  function request(): Promise<boolean> {
    // 戻るの連打で前の問い合わせが残っていれば取り消しで畳む。前の遷移は false を受けて中止（abort）され、
    // popstate 由来なら Vue Router がその分の履歴を戻し直す
    settle?.(false)
    generation.value += 1
    pending.value = true
    return new Promise((settleLeave) => {
      settle = settleLeave
    })
  }

  function resolve(leave: boolean) {
    pending.value = false
    const current = settle
    settle = undefined
    current?.(leave)
  }

  function confirm() {
    resolve(true)
  }

  function cancel() {
    resolve(false)
  }

  return { pending: readonly(pending), generation: readonly(generation), request, confirm, cancel }
}

export type SessionLeaveConfirmStore = ReturnType<typeof useSessionLeaveConfirm>

export const sessionLeaveConfirmInjectionKey: InjectionKey<SessionLeaveConfirmStore> =
  Symbol('sessionLeaveConfirm')
