<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'

const {
  open,
  title,
  message,
  confirmLabel = '確定',
  cancelLabel = 'キャンセル',
} = defineProps<{
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialogEl = useTemplateRef<HTMLDialogElement>('dialogEl')

watch(
  () => open,
  (newOpen) => {
    const el = dialogEl.value
    if (!el) return
    if (newOpen && !el.open) el.showModal()
    else if (!newOpen && el.open) el.close()
  },
)

onMounted(() => {
  if (open) dialogEl.value?.showModal()
})

function onCancel() {
  emit('cancel')
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogEl.value) emit('cancel')
}
</script>

<template>
  <dialog ref="dialogEl" class="confirm-dialog" @cancel.prevent="onCancel" @click="onBackdropClick">
    <div class="panel">
      <div class="text">
        <h2 class="title">{{ title }}</h2>
        <p v-if="message" class="message">{{ message }}</p>
      </div>
      <div class="actions">
        <BaseButton variant="secondary" @click="onCancel">{{ cancelLabel }}</BaseButton>
        <BaseButton @click="emit('confirm')">{{ confirmLabel }}</BaseButton>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.confirm-dialog {
  width: calc(100% - var(--space-24) * 2);
  max-width: 400px;
  margin: auto;
  padding: 0;
  background: var(--color-bg-light);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  color: var(--color-text);

  &::backdrop {
    background: var(--color-backdrop);
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
  padding: var(--space-20);
}

.text {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
}

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
