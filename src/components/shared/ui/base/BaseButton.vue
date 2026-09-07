<script setup lang="ts">
const { variant = 'primary', disabled = false } = defineProps<{
  variant?: 'primary' | 'secondary'
  /** 一時的に押せないことを示す（常設ボタンがデータの読み込み待ちなどで押せない間） */
  disabled?: boolean
}>()
</script>

<template>
  <button class="base-button" :class="variant" type="button" :disabled>
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding-block: 0;
  padding-inline: var(--space-20);
  border-radius: var(--radius);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-body);
  transition:
    background-color var(--transition),
    border-color var(--transition),
    color var(--transition);

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* primary: アクセント色の塗りで主アクションを担う */
  &.primary {
    background: var(--color-accent);
    border: 1px solid var(--color-accent);
    color: var(--color-bg);
    font-weight: var(--font-weight-bold);

    &:not(:disabled) {
      @media (hover: hover) {
        &:hover {
          background: var(--color-bg-light);
          color: var(--color-accent);
        }
      }

      &:active {
        background: var(--color-bg-light);
        color: var(--color-accent);
      }
    }
  }

  /* secondary: 塗りを持たず細い境界線で控えめに見せる */
  &.secondary {
    background: transparent;
    border: 1px solid var(--color-line);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);

    &:not(:disabled) {
      @media (hover: hover) {
        &:hover {
          border-color: var(--color-text);
        }
      }

      &:active {
        border-color: var(--color-text);
      }
    }
  }
  /* 押せない間は一段落とす（データの読み込み待ちなど、常設ボタンが一時的に押せない場合）。
     variant を問わず面と枠線をカードと同じ色（bg-light / line）に置き、文字色を 3 次に落とす。
     primary はアクセントの塗りが外れて主アクションの主張が止まり、secondary は透明だった面に
     カードの塗りが付く。
     variant の塗りより後に置いて上書きする（詳細度が同じため順序で決まる） */
  &:disabled {
    background: var(--color-bg-light);
    border-color: var(--color-line);
    color: var(--color-text-tertiary);
    cursor: default;
  }
}
</style>
