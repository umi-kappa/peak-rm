<script setup lang="ts">
import { onBeforeUnmount, onMounted, useId, useTemplateRef } from 'vue'

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

// click は mousedown / mouseup の共通祖先で発火するため、パネル内のドラッグ操作を
// backdrop 上で離しても target が dialog になる。押下起点も backdrop のときだけ cancel する。
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

// マウント = 表示。開閉は呼び出し側の v-if が唯一のソースで、open prop は持たない
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
.base-dialog {
  max-width: 400px;
  margin: auto;
  padding: 0;
  background: var(--color-bg-light);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  color: var(--color-text);

  &.inset-16 {
    width: calc(100% - var(--space-16) * 2);
  }

  &.inset-24 {
    width: calc(100% - var(--space-24) * 2);
  }

  &::backdrop {
    background: var(--color-backdrop);
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
  padding: var(--space-20);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}
</style>
