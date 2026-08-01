<script setup lang="ts">
const { flushBottom = false } = defineProps<{
  /** footer 下端の padding を落とす。ナビ行（Home）など画面下端まで詰める footer 用 */
  flushBottom?: boolean
}>()
</script>

<template>
  <div class="screen-frame">
    <div v-if="$slots.header" class="header">
      <slot name="header" />
    </div>
    <!-- 全画面（ErrorScreen 含む）のランドマークをここ 1 箇所で出す。画面側では <main> を書かない -->
    <main class="body">
      <slot />
    </main>
    <div v-if="$slots.footer" class="footer" :class="{ 'flush-bottom': flushBottom }">
      <slot name="footer" />
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
}

/* 下部固定のアクション領域（footer slot がある画面のみ描画）。
   本文と同じ左右 padding を持ち、本文がスクロールしても画面下端に残る */
.footer {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding-block-end: var(--space-20);
  padding-inline: var(--space-24);

  &.flush-bottom {
    padding-block-end: 0;
  }
}
</style>
