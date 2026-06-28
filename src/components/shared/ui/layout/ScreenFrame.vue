<script setup lang="ts">
const { flushBottom = false } = defineProps<{
  /** 本文下端の padding を落とす。下部固定の要素（Home のナビ行など）を画面下端まで詰める用 */
  flushBottom?: boolean
}>()
</script>

<template>
  <div class="screen-frame">
    <div v-if="$slots.header" class="header">
      <slot name="header" />
    </div>
    <div class="body" :class="{ 'flush-bottom': flushBottom }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.screen-frame {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  /* viewport-fit=cover + translucent ステータスバーのため、ノッチ・ホームインジケータを避ける
     safe-area インセットを全高（100dvh）の内側に取り込む（box-sizing: border-box）。
     高さを持つこの要素が safe-area も一元的に持つことで、外殻側の padding と二重計上にならない。 */
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
    env(safe-area-inset-left);
}

/* 固定ヘッダー領域。本文との境界に区切り線を引く（header slot がある画面のみ描画） */
.header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-line-dark);
}

.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-20);
  min-height: 0;
  padding-block: var(--space-20);
  padding-inline: var(--space-24);
  overflow-y: auto;

  &.flush-bottom {
    padding-block-end: 0;
  }
}
</style>
