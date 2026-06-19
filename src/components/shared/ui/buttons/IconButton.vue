<script setup lang="ts">
import type { IconName } from '@/assets/icons'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'

const { name, label } = defineProps<{ name: IconName; label: string }>()
</script>

<template>
  <button class="icon-button" type="button" :aria-label="label">
    <BaseIcon :name :size="20" />
  </button>
</template>

<style scoped>
.icon-button {
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
  transition:
    background-color var(--transition),
    color var(--transition);
}

/* hover はポインタ環境のみ */
@media (hover: hover) {
  .icon-button:hover {
    background: var(--color-line);
    color: var(--color-text);
  }
}

/* active はタッチ・ポインタ共通 */
.icon-button:active {
  background: var(--color-line);
  color: var(--color-text);
}
</style>
