<script setup lang="ts">
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'

defineProps<{
  /** 表示するエラーメッセージ */
  message: string
}>()

const emit = defineEmits<{
  reload: []
}>()
</script>

<template>
  <ScreenFrame>
    <section class="section" aria-labelledby="error-label">
      <BaseLabel id="error-label">ERROR</BaseLabel>
      <p class="message">{{ message }}</p>
    </section>

    <template #footer>
      <BaseButton @click="emit('reload')">RELOAD</BaseButton>
    </template>
  </ScreenFrame>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.message {
  margin: 0;
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  /* 例外メッセージは URL などの長い連続文字列を含みうるため、単語境界がなくても折り返す */
  overflow-wrap: anywhere;
}
</style>
