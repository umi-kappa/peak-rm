<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useId, useTemplateRef } from 'vue'
import { useVisualViewport } from '@/composables/shared/platform/useVisualViewport'

const { title, inset = 16 } = defineProps<{
  /** ヘッダーの h2 に表示する見出し。dialog のアクセシブルネーム（aria-labelledby）を兼ねる */
  title: string
  /** 画面端からの横インセット。top layer に出るため通常フローの親が幅を決められず、prop で受ける */
  inset?: 16 | 24
}>()

const emit = defineEmits<{
  /** ESC / backdrop タップ。閉じる判断・後処理は呼び出し側が担う */
  cancel: []
}>()

const dialogEl = useTemplateRef<HTMLDialogElement>('dialogEl')
const titleId = useId()

// dialog 要素は可視領域（visual viewport）いっぱいの透明な配置レイヤーにし、カード（.panel）を
// その中央に置く。iOS はソフトキーボードで可視領域だけを縮めるため、レイヤーを追従させないと
// 中央配置のカード下部（SetEditDialog の SAVE）がキーボードの裏に隠れる。
// 非対応環境では undefined にして CSS のフォールバック（画面全体）に任せる
const { offsetTop, height } = useVisualViewport()
const layerStyle = computed(() =>
  height.value === undefined
    ? undefined
    : { top: `${offsetTop.value}px`, height: `${height.value}px` },
)

// click は mousedown / mouseup の共通祖先で発火するため、パネル内のドラッグ操作を
// backdrop 上で離しても target が dialog になる。押下起点も backdrop のときだけ cancel する
//（backdrop = カードの外側 = 透明な dialog 要素そのもの）。
// イベントハンドラ間の受け渡しにしか使わず表示に影響しないため、ref にしない
let pressedOnBackdrop = false

function onCancel() {
  emit('cancel')
}

function onBackdropPointerdown(event: PointerEvent) {
  pressedOnBackdrop = event.target === dialogEl.value
}

function onBackdropClick(event: MouseEvent) {
  if (pressedOnBackdrop && event.target === dialogEl.value) emit('cancel')
}

// マウント = 表示。開閉は呼び出し側の v-if が唯一のソースで、open prop は持たない。
// 初期フォーカスはネイティブに任せる（中身の autofocus を優先し、無ければ最初のフォーカス可能要素）。
// どこに置くかは中身の責務（SetEditDialog は SAVE に autofocus）
onMounted(() => dialogEl.value?.showModal())
// DOM 除去だけで閉じるとネイティブのフォーカス復元（showModal 前の要素へ戻す）が働かないため、
// アンマウント前に close() を通す
onBeforeUnmount(() => dialogEl.value?.close())
</script>

<template>
  <dialog
    ref="dialogEl"
    class="base-dialog"
    :class="`inset-${inset}`"
    :style="layerStyle"
    :aria-labelledby="titleId"
    @cancel.prevent="onCancel"
    @pointerdown="onBackdropPointerdown"
    @click="onBackdropClick"
  >
    <div class="panel">
      <header class="head">
        <h2 :id="titleId" class="title">{{ title }}</h2>
        <slot name="header" />
      </header>
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
/* 透明な配置レイヤー。UA の dialog 既定（fit-content・margin auto・max-* の余白・枠・背景）を打ち消し、
   可視領域いっぱいに広げてカードを中央に置く。top / height はキーボード表示中だけ script が
   visual viewport の値で上書きする（design「8. Modal」）。モーダル機構（top layer・inert・ESC・
   フォーカス復元・::backdrop）は dialog 要素のまま担う */
.base-dialog {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  overflow: visible;

  &.inset-16 .panel {
    width: calc(100% - var(--space-16) * 2);
  }

  &.inset-24 .panel {
    width: calc(100% - var(--space-24) * 2);
  }

  &::backdrop {
    background: var(--color-backdrop);
  }
}

/* 見えているカード。レイヤーより高くなったら（キーボード表示中の小さい端末）中をスクロールさせる */
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
  max-width: 400px;
  max-height: 100%;
  padding: var(--space-20);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--color-bg-light);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  color: var(--color-text);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

/* タイトルは件数入りの文言などで折り返しうるため、body 既定の line-height を継承させる
   （tight のままだと 2 行目が行間ゼロで詰まる） */
.title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
}
</style>
