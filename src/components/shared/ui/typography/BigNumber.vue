<script setup lang="ts">
const {
  value,
  size = 'stat',
  accent = false,
} = defineProps<{
  /** 表示する数値。整形済みの文字列も渡せる（例: '0:47'・'82.5'） */
  value: string | number
  size?: 'stat' | 'hero' | 'display'
  /** アクセント扱い（アクセント色 + glow）で強調する */
  accent?: boolean
}>()
</script>

<template>
  <span class="number" :class="[size, { accent }]">{{ value }}</span>
</template>

<style scoped>
.number {
  color: var(--color-text);
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.number.stat {
  font-size: var(--font-size-stat);
}

.number.hero {
  font-size: var(--font-size-hero);
}

.number.display {
  font-size: var(--font-size-display);
}

.number.accent {
  color: var(--color-accent);
  text-shadow: var(--shadow-glow);
}
</style>
