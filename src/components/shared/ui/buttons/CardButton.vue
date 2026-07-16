<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import type { CardBorder } from '@/components/shared/ui/base/BaseCard.type'

const { to, border = 'soft' } = defineProps<{
  /** 指定すると <router-link> として描画する。無ければ <button> */
  to?: RouteLocationRaw
  border?: CardBorder
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
    :to
    :type="to ? undefined : 'button'"
    class="card-button"
    @click="onClick"
  >
    <BaseCard :border class="card"><slot /></BaseCard>
  </component>
</template>

<style scoped>
.card-button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  /* router-link 版は <a> になり global.css の button リセットが効かないため、ここで補う */
  cursor: pointer;
  text-decoration: none;
  /* <button> 版の UA 既定（text-align: center）を打ち消し、内側 BaseCard を左寄せに保つ */
  text-align: left;

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* 押下面は内側の不透明な BaseCard。外側ラッパーは透明なため :active を内側へ当てる */
  &:active .card {
    background-color: var(--color-line-dark);
  }
}

.card {
  transition: background-color var(--transition);

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-line-dark);
    }
  }
}
</style>
