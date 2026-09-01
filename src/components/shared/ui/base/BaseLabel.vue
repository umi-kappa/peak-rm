<template>
  <span class="base-label"><slot /></span>
</template>

<style scoped>
.base-label {
  color: var(--color-text-tertiary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-caption);
  /* 祖先が面ごと階調を上げたとき、背景と同じ時間で追従させる（conventions「デザイントークン」） */
  transition: color var(--transition);
}
</style>
