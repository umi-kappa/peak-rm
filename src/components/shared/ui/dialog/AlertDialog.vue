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
  <!-- 結果を読む前に消えないよう backdrop では閉じない。開いた直後の連打 2 打目は backdrop に落ちる -->
  <BaseDialog :title :inset="24" :dismiss-on-backdrop="false" @cancel="onClose">
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
