import { useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

/**
 * AppBar の戻る用ハンドラを返す。アプリ内履歴があればブラウザバックで戻って
 * 履歴を汚さず、無いとき（直リンク・ブックマーク起動）は fallback へ replace で
 * 逃がしてアプリ外に抜けないようにする。
 */
export function useBackNavigation(fallback: RouteLocationRaw = { name: 'home' }) {
  const router = useRouter()

  function goBack() {
    // Vue Router は直前のアプリ内ルートを history.state.back に記録している（無ければ null）
    if (history.state?.back) {
      router.back()
    } else {
      router.replace(fallback)
    }
  }

  return { goBack }
}
