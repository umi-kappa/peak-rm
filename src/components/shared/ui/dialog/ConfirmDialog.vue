<script setup lang="ts">
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseDialog from '@/components/shared/ui/base/BaseDialog.vue'

const {
  title,
  message,
  confirmLabel = '確定',
  cancelLabel = 'キャンセル',
} = defineProps<{
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onCancel() {
  emit('cancel')
}
</script>

<template>
  <BaseDialog :title :inset="24" @cancel="onCancel">
    <template v-if="message" #header>
      <p class="message">{{ message }}</p>
    </template>
    <div class="actions">
      <BaseButton variant="secondary" @click="onCancel">{{ cancelLabel }}</BaseButton>
      <BaseButton @click="emit('confirm')">{{ confirmLabel }}</BaseButton>
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
  gap: var(--space-12);
}
</style>
