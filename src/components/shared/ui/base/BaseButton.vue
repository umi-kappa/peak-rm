<script setup lang="ts">
const { variant = 'primary' } = defineProps<{ variant?: 'primary' | 'secondary' }>()
</script>

<template>
  <button class="button" :class="variant" type="button">
    <slot />
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding-block: 0;
  padding-inline: var(--space-20);
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-body);
  transition: var(--transition);
  -webkit-tap-highlight-color: transparent;
}

/* primary: アクセント色の塗りで主アクションを担う */
.button.primary {
  background: var(--color-accent);
  border: 1px solid var(--color-accent);
  color: var(--color-bg);
  font-weight: var(--font-weight-bold);
}

/* secondary: 塗りを持たず細い境界線で控えめに見せる */
.button.secondary {
  background: transparent;
  border: 1px solid var(--color-line);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

/* hover はポインタ環境のみ */
@media (hover: hover) {
  .button.primary:hover {
    background: var(--color-bg-light);
    color: var(--color-accent);
  }

  .button.secondary:hover {
    border-color: var(--color-text);
  }
}

/* active はタッチ・ポインタ共通 */
.button.primary:active {
  background: var(--color-bg-light);
  color: var(--color-accent);
}

.button.secondary:active {
  border-color: var(--color-text);
}
</style>
