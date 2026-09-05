import { inject, type InjectionKey } from 'vue'

/**
 * main.ts が app.provide 済みの必須依存を受け取る。
 * 欠落はアプリ配線のバグなので、undefined を呼び出し側へ返さず setup で即座に throw して
 * エラー境界へ流す。任意依存（default 付き）は素の inject(key, default) を使う。
 * メッセージは InjectionKey の Symbol description から生成する（手書き文字列を持たない）。
 */
export function injectRequired<T>(key: InjectionKey<T>): T {
  const injected = inject(key)
  if (injected === undefined) {
    throw new Error(`${key.description ?? String(key)} is not provided`)
  }
  return injected
}
