<script setup lang="ts">
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'

const { from, to } = defineProps<{
  /** 前回ベースラインの重量（kg） */
  from: number
  /** 増量後の重量（kg） */
  to: number
}>()
</script>

<template>
  <BaseCard class="lp-indicator" border="line">
    <BaseIcon name="trending-up" />
    <div class="text">
      <BaseLabel class="title">LINEAR PROGRESSION</BaseLabel>
      <span class="message">LAST SESSION COMPLETED!</span>
    </div>
    <div class="diff">
      <span class="from">{{ from }}</span>
      <BaseIcon class="chevron" name="chevron-right" :size="12" />
      <span class="to">{{ to }}</span>
      <BaseUnit>KG</BaseUnit>
    </div>
  </BaseCard>
</template>

<style scoped>
.lp-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-16);
}

.text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.title {
  color: var(--color-text-secondary);
}

.message {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-caption);
}

.diff {
  display: flex;
  flex-shrink: 0;
  align-items: baseline;
  gap: var(--space-8);
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* baseline 揃えでは SVG の下端が文字の baseline に乗って浮くため、アイコンだけ上下中央にする */
.chevron {
  align-self: center;
}

.from {
  color: var(--color-text-tertiary);
}

.to {
  color: var(--color-accent);
  font-weight: var(--font-weight-bold);
}
</style>
