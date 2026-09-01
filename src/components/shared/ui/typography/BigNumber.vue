<script setup lang="ts">
const {
  value,
  size = 'stat',
  tone = 'default',
} = defineProps<{
  /** 表示する数値。整形済みの文字列も渡せる（例: '0:47'・'82.5'） */
  value: string | number
  size?: 'stat' | 'hero' | 'display'
  /** 階調。accent はアクセント色 + glow で強調し、tertiary は一段落とす */
  tone?: 'default' | 'accent' | 'tertiary'
}>()
</script>

<template>
  <span class="big-number" :class="[size, tone]">{{ value }}</span>
</template>

<style scoped>
.big-number {
  color: var(--color-text);
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  /* 祖先が面ごと階調を上げたとき、背景と同じ時間で追従させる（conventions「デザイントークン」）。
     accent は glow も同時に切り替わるので text-shadow を対にする */
  transition:
    color var(--transition),
    text-shadow var(--transition);

  &.stat {
    font-size: var(--font-size-stat);
  }

  &.hero {
    font-size: var(--font-size-hero);
  }

  &.display {
    font-size: var(--font-size-display);
  }

  &.accent {
    color: var(--color-accent);
    text-shadow: var(--shadow-glow);
  }

  &.tertiary {
    color: var(--color-text-tertiary);
  }
}
</style>
