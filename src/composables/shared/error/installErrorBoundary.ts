import type { App } from 'vue'
import type { Router } from 'vue-router'

/**
 * 想定外エラーの境界を配線する。流入経路 4 本をすべて report へ集約し、App.vue が inject して
 * 全画面エラー表示に切り替える。縮退（最善努力）だけを呼び出し元で catch する
 * （docs/conventions.md「エラーハンドリング」）。main.ts が useFatalError の report を渡して呼ぶ。
 */
export function installErrorBoundary(app: App, router: Router, report: (e: unknown) => void) {
  // 1) Vue が捕捉するエラー（setup / render / watcher、async ライフサイクル・イベントハンドラの reject 含む）
  app.config.errorHandler = (err) => {
    // errorHandler を設定すると Vue 既定の console 出力が消えるため、境界でも握りつぶさず出力する
    console.error(err)
    report(err)
  }
  // 2) vue-router のエラー（ガード内 throw・lazy route component の読み込み失敗）は
  //    Vue の errorHandler に流れない。全ルートが lazy import + PWA autoUpdate のため、
  //    デプロイ後に旧 chunk への参照が 404 になるケースがここに落ちる
  router.onError((err) => {
    // vue-router 既定の console 出力が出ないケースに備え、補償として出力する（二重ログには
    // ならない）。3・4 の window 経路はブラウザのネイティブ出力が残るので足さない
    console.error(err)
    report(err)
  })
  // 3) Vue 管理外に漏れた floating promise の reject
  // NOTE(#68): SW 登録（自動注入の registerSW.js）が catch せず捨てた reject もここに漏れ、
  //            非致命の登録失敗を fatal 化しうる。PWA 実装側で onRegisterError を握って解消する
  window.addEventListener('unhandledrejection', (event) => {
    report(event.reason)
  })
  // 4) Vue 管理外の同期例外（setTimeout / setInterval・生の addEventListener のコールバック内 throw）
  window.addEventListener('error', (event) => {
    // 自オリジンの未捕捉例外だけを致命扱いにする。クロスオリジンの "Script error."（error === null）や
    // 拡張機能起因のノイズは根幹を壊さないため報告しない（console にはブラウザ既定の出力が残る）
    if (event.error instanceof Error) report(event.error)
  })
}
