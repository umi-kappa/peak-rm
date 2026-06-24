<template>
  <div class="screen-frame">
    <div v-if="$slots.header" class="header">
      <slot name="header" />
    </div>
    <div class="body">
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
</style>
