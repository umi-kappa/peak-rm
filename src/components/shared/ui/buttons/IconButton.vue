<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { IconName } from '@/assets/icons'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'

const { name, label, to } = defineProps<{
  name: IconName
  label: string
  /** 指定すると <router-link> として描画する。無ければ <button> */
  to?: RouteLocationRaw
}>()

const emit = defineEmits<{
  click: []
}>()

// button 版のみ emit する。to 版は RouterLink が遷移を担うため発火しない
function onClick() {
  if (!to) emit('click')
}
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    class="icon-button"
    :aria-label="label"
    @click="onClick"
  >
    <BaseIcon :name :size="20" />
  </component>
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
  /* router-link 版は <a> になり global.css の button リセットが効かないため、ここで補う */
  cursor: pointer;
  text-decoration: none;
  transition:
    background-color var(--transition),
    color var(--transition);

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  @media (hover: hover) {
    &:hover {
      background: var(--color-line);
      color: var(--color-text);
    }
  }

  &:active {
    background: var(--color-line);
    color: var(--color-text);
  }
}
</style>
