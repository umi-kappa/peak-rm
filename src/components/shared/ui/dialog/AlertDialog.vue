<script setup lang="ts">
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseDialog from '@/components/shared/ui/base/BaseDialog.vue'

const {
  title,
  message,
  closeLabel = '閉じる',
} = defineProps<{
  title: string
  message?: string
  closeLabel?: string
}>()

const emit = defineEmits<{
  close: []
}>()

function onClose() {
  emit('close')
}
</script>

<template>
  <BaseDialog :title :inset="24" @cancel="onClose">
    <template v-if="message" #header>
      <p class="message">{{ message }}</p>
    </template>
    <div class="actions">
      <BaseButton @click="onClose">{{ closeLabel }}</BaseButton>
    </div>
  </BaseDialog>
</template>

<style scoped>
.message {
  margin: 0;
  color: var(--color-text-secondary);
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
