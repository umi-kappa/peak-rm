<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { IconName } from '@/assets/icons'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'

const { to, icon, label } = defineProps<{
  /** 遷移先 */
  to: RouteLocationRaw
  /** ラベル左に置くアイコン */
  icon: IconName
  label: string
}>()
</script>

<template>
  <RouterLink :to class="nav-link">
    <span class="label">
      <BaseIcon :name="icon" :size="18" />
      <span class="text">{{ label }}</span>
    </span>
    <span class="chevron"><BaseIcon name="chevron-right" :size="18" /></span>
  </RouterLink>
</template>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: var(--space-16);
  padding-inline: var(--space-4);
  color: var(--color-text-secondary);
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  &:active .text {
    color: var(--color-text-secondary);
  }

  @media (hover: hover) {
    &:hover .text {
      color: var(--color-text-secondary);
    }
  }
}

.label {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.text {
  color: var(--color-text);
  font-weight: var(--font-weight-regular);
  transition: color var(--transition);
}

.chevron {
  display: inline-flex;
  color: var(--color-text-tertiary);
}
</style>
