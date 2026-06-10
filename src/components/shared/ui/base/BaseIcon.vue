<script setup lang="ts">
import { icons, type IconName } from '@/assets/icons'

const { name, size = 16 } = defineProps<{ name: IconName; size?: number }>()
</script>

<template>
  <component
    :is="icons[name]"
    class="icon"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  />
</template>

<style scoped>
/* アイコンは固定サイズの部品。窮屈な flex 行でも潰さない */
.icon {
  flex-shrink: 0;
}
</style>
