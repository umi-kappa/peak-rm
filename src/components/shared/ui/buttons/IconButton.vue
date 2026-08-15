<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { IconName } from '@/assets/icons'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'

// disabled はネイティブの属性なので <button> 版にしか効かない。to との同時指定を
// 型で弾き、黙って無視される prop を作らない
const { name, label, to, disabled } = defineProps<
  { name: IconName; label: string } & (
    | {
        /** 指定すると <router-link> として描画する */
        to: RouteLocationRaw
        disabled?: never
      }
    | {
        to?: undefined
        /** 常設のコントロールが一時的に押せないことを示す（docs/conventions.md「状態表現」） */
        disabled?: boolean
      }
  )
>()

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
    :disabled
    class="icon-button"
    :aria-label="label"
    @click="onClick"
  >
    <BaseIcon :name :size="24" />
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
    &:not(:disabled):hover {
      background: var(--color-line);
      color: var(--color-text);
    }
  }

  &:not(:disabled):active {
    background: var(--color-line);
    color: var(--color-text);
  }

  /* 押せない間は一段落とす。押せるようになったら既定色へ戻り、それが活性の合図になる */
  &:disabled {
    color: var(--color-text-tertiary);
    cursor: default;
  }
}
</style>
