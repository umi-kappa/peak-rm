import { onScopeDispose, ref } from 'vue'

/** useVisualViewport が使う面だけに絞った VisualViewport。テストはこの面だけの fake を渡せばよい */
export type VisualViewportLike = Pick<
  VisualViewport,
  'offsetTop' | 'height' | 'addEventListener' | 'removeEventListener'
>

export type VisualViewportDeps = { visualViewport?: VisualViewportLike }

/**
 * 可視領域（visual viewport）の位置と高さを追従する。
 * iOS はソフトキーボードでレイアウトビューポートを縮めず可視領域だけを縮めるため、
 * CSS（100dvh 等）ではキーボードの分を知れない。top layer に出るモーダルが可視領域に収まるよう、
 * BaseDialog がこの値で配置レイヤーの位置と高さを決める（design「8. Modal」）。
 * 非対応環境では height が undefined のままになり、呼び出し側は CSS のフォールバックに任せる。
 * deps は通常省略し、本物の window.visualViewport を使う。
 */
export function useVisualViewport(deps: VisualViewportDeps = {}) {
  // 非対応ブラウザでは window.visualViewport が null（型の上では nullable）
  const visualViewport = deps.visualViewport ?? window.visualViewport ?? undefined
  const offsetTop = ref(0)
  const height = ref<number>()

  function update() {
    if (!visualViewport) return
    offsetTop.value = visualViewport.offsetTop
    height.value = visualViewport.height
  }

  if (visualViewport) {
    update()
    // resize = キーボードの出入り・回転、scroll = キーボード表示中のパン
    visualViewport.addEventListener('resize', update)
    visualViewport.addEventListener('scroll', update)
    onScopeDispose(() => {
      visualViewport.removeEventListener('resize', update)
      visualViewport.removeEventListener('scroll', update)
    })
  }

  return { offsetTop, height }
}
