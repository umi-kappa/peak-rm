import { readonly, shallowRef, type InjectionKey } from 'vue'

/**
 * 境界が集約する想定外エラーの置き場。main.ts が生成して境界の各配線に report を
 * 接続し、`app.provide` で App.vue（エラー画面への切り替え）と共有する。
 */
export function useFatalError() {
  const error = shallowRef<Error>()

  /**
   * 想定外エラーを報告する。最初の 1 件だけを保持し、後続（初発の巻き添えが多い）では
   * 上書きしない。後続エラーも境界側で console に出力されるため情報は失わない。
   */
  function report(e: unknown) {
    if (error.value !== undefined) return
    if (e instanceof Error) {
      error.value = e
      return
    }
    // 文字列 reason や値なしの reject も画面に出せるよう、常に Error へ正規化して保持する。
    // 空文字や [object Object] のような無情報な文字列化は 'Unknown error' に落とす
    const message = String(e ?? '').trim()
    error.value = new Error(message && message !== '[object Object]' ? message : 'Unknown error')
  }

  return { error: readonly(error), report }
}

export type FatalErrorStore = ReturnType<typeof useFatalError>

export const fatalErrorInjectionKey: InjectionKey<FatalErrorStore> = Symbol('fatalError')
