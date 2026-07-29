<script setup lang="ts">
import { MENU_MAX } from '@/core/menu'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import NumberStepper from '@/components/shared/ui/inputs/NumberStepper.vue'

const model = defineModel<number>({ required: true })
</script>

<template>
  <BaseCard class="weight-stepper">
    <NumberStepper
      v-model="model"
      label="WEIGHT"
      large
      accent
      unit="KG"
      :step="0.25"
      :min="0"
      :max="MENU_MAX.weight"
    />
    <BaseLabel>STEP · 0.25 KG</BaseLabel>
  </BaseCard>
</template>

<style scoped>
.weight-stepper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
}
</style>
