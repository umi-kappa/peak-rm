import { readonly, shallowRef, type AppConfig, type InjectionKey } from 'vue'
import type { Router } from 'vue-router'

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
      // 空 message の Error（strip されたエラー等）は画面が空描画になるため Unknown error に落とす
      error.value = e.message.trim() ? e : new Error('Unknown error')
      return
    }
    // 文字列 reason や値なしの reject も画面に出せるよう、常に Error へ正規化して保持する。
    // 空文字や [object Object] のような無情報な文字列化は 'Unknown error' に落とす
    let message = ''
    try {
      message = String(e ?? '').trim()
    } catch {
      // toString/valueOf を持たない値（Object.create(null) 等）は文字列化で throw する。
      // 4 経路の最終防波堤である report 自身が throw しないよう握り、Unknown error に落とす
    }
    error.value = new Error(message && message !== '[object Object]' ? message : 'Unknown error')
  }

  return { error: readonly(error), report }
}

export type FatalErrorStore = ReturnType<typeof useFatalError>

export const fatalErrorInjectionKey: InjectionKey<FatalErrorStore> = Symbol('fatalError')

/**
 * 想定外エラーの境界を配線する。流入経路 4 本をすべて report へ集約し、App.vue が inject して
 * 全画面エラー表示に切り替える。縮退（最善努力）だけを呼び出し元で catch する
 * （docs/conventions.md「エラーハンドリング」）。main.ts が useFatalError の report を渡して呼ぶ。
 */
export function installErrorBoundary(
  app: { config: Pick<AppConfig, 'errorHandler'> },
  router: Pick<Router, 'onError'>,
  report: (e: unknown) => void,
) {
  // 1) Vue が捕捉するエラー（setup / render / watcher、async ライフサイクル・イベントハンドラの reject 含む）
  app.config.errorHandler = (err) => {
    // errorHandler を設定すると Vue 既定の console 出力が消えるため、境界でも握りつぶさず出力する
    console.error(err)
    report(err)
  }
  // 2) vue-router のエラー（ガード内 throw・lazy route component の読み込み失敗）は
  //    Vue の errorHandler に流れない。全ルートが lazy import + PWA autoUpdate のため、
  //    デプロイ後に旧 chunk への参照が 404 になるケースがここに落ちる
  router.onError((err: unknown) => {
    // vue-router 既定の console 出力が出ないケースに備え、補償として出力する（二重ログには
    // ならない）。3・4 の window 経路はブラウザのネイティブ出力が残るので足さない
    console.error(err)
    report(err)
  })
  // 3) Vue 管理外に漏れた floating promise の reject
  //    （SW 登録失敗は main.ts の onRegisterError で握るためここには漏れない）
  window.addEventListener('unhandledrejection', (event) => {
    report(event.reason)
  })
  // 4) Vue 管理外の同期例外（setTimeout / setInterval・生の addEventListener のコールバック内 throw）
  window.addEventListener('error', (event) => {
    // error が Error の未捕捉例外だけを致命扱いにする。クロスオリジン（拡張機能含む）の
    // "Script error."（error が null）を除外するのが主目的。非 Error の同期 throw は経路 3 の
    // reject と違いここでは拾わない（console にはブラウザ既定の出力が残る）
    if (event.error instanceof Error) report(event.error)
  })
}
