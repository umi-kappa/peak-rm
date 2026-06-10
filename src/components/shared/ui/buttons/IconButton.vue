<script setup lang="ts">
import type { IconName } from '@/assets/icons'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'

const { name } = defineProps<{ name: IconName }>()
</script>

<template>
  <button class="button" type="button">
    <BaseIcon :name :size="20" />
  </button>
</template>

<style scoped>
.button {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  /* 正方形（width = height）なので pill の頭打ちで正円になる */
  border-radius: var(--radius-pill);
  background: var(--color-bg-light);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition);
  -webkit-tap-highlight-color: transparent;
}

/* hover はポインタ環境のみ */
@media (hover: hover) {
  .button:hover {
    background: var(--color-line);
    color: var(--color-text);
  }
}

/* active はタッチ・ポインタ共通 */
.button:active {
  background: var(--color-line);
  color: var(--color-text);
}
</style>
