<script setup lang="ts">
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import NumberStepper from '@/components/shared/ui/inputs/NumberStepper.vue'

const model = defineModel<number>({ required: true })
</script>

<template>
  <div class="weight-stepper">
    <NumberStepper v-model="model" large accent unit="KG" :step="0.25" :min="0" />
    <BaseLabel>STEP · 0.25 KG</BaseLabel>
  </div>
</template>

<style scoped>
.weight-stepper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-16);
  background: var(--color-bg-light);
  border: 1px solid var(--color-line-dark);
  border-radius: var(--radius);
}
</style>
