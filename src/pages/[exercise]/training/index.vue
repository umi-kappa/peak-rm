<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EXERCISE_LABELS } from '@/core/constants'
import { MENU_MAX } from '@/core/menu'
import { sessionInjectionKey } from '@/composables/shared/session/useSession'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'
import BigNumber from '@/components/shared/ui/typography/BigNumber.vue'
import NumberStepper from '@/components/shared/ui/inputs/NumberStepper.vue'

const route = useRoute()
const router = useRouter()
const { goBack } = useBackNavigation()

// main.ts で app.provide 済み。欠落はアプリ配線のバグなので即座に失敗させる
const injected = inject(sessionInjectionKey)
if (!injected) throw new Error('session store is not provided')
const session = injected

// 表示するのは開始時に焼き込んだ Session.menu のみ。変更 UI を持たず「トレーニング中変更不可」を担保する
const { menu, exercise, currentReps, currentSetIndex, setsTotal } = session

const isFinalSet = computed(() => currentSetIndex.value + 1 === setsTotal.value)

// 二重タップで completeSet が並走すると同一セットが重複記録されるのを防ぐ。
// 失敗時も遷移時もページごと破棄されるため false には戻さない
const completing = ref(false)

// セット完了で interval へ、最終セット完了なら結果確認へ進む（いずれも replace で履歴を畳む）。
// :exercise は session フロー内で不変なので、現在の params をそのまま引き継ぐ
async function completeSet() {
  if (completing.value) return
  completing.value = true
  await session.completeSet()
  // await 中にブラウザバック等で training を離脱していたら遷移しない（離脱先から引き戻さない）
  if (route.name !== 'training') return
  if (session.phase.value === 'done') {
    router.replace({ name: 'result', params: route.params, query: { origin: 'session' } })
    return
  }
  router.replace({ name: 'interval', params: route.params })
}
</script>

<template>
  <ScreenFrame>
    <template v-if="exercise" #header>
      <AppBar :title="EXERCISE_LABELS[exercise]" @back="goBack" />
    </template>

    <div v-if="menu" class="hero">
      <div class="context" :class="{ final: isFinalSet }">
        <span class="rule" />
        <span class="context-label">{{ isFinalSet ? 'FINAL SET' : 'SET' }}</span>
        <span class="context-count">{{ currentSetIndex + 1 }}/{{ setsTotal }}</span>
        <span class="rule" />
      </div>

      <div class="prescription">
        <div class="weight">
          <BigNumber :value="menu.weight" size="display" accent />
          <BaseUnit size="body">KG</BaseUnit>
        </div>
        <div class="target">
          <span class="target-reps">× {{ menu.reps }}</span>
          <BaseUnit>REPS</BaseUnit>
        </div>
      </div>
    </div>

    <BaseCard v-if="menu">
      <div class="row">
        <span class="row-label">REPS DONE</span>
        <div class="stepper">
          <NumberStepper
            large
            :min="0"
            :max="MENU_MAX.reps"
            unit="REPS"
            :model-value="currentReps"
            @update:model-value="session.editCurrentReps"
          />
        </div>
      </div>
    </BaseCard>

    <template v-if="menu" #footer>
      <BaseButton @click="completeSet">
        {{ isFinalSet ? 'FINISH SESSION' : 'COMPLETE SET' }}
      </BaseButton>
    </template>
  </ScreenFrame>
</template>

<style scoped>
/* 処方（このセットでやること）を画面中央に大きく据える */
.hero {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-24);
}

.context {
  display: flex;
  align-items: center;
  gap: var(--space-12);

  &.final {
    .rule {
      background: var(--color-accent);
    }

    .context-label {
      color: var(--color-accent);
    }

    .context-count {
      color: var(--color-accent);
      text-shadow: var(--shadow-glow);
    }
  }
}

.rule {
  width: 24px;
  height: 1px;
  background: var(--color-line);
}

/* コンテキスト行と目標回数のテキストは mono で統一する */
.context-label,
.context-count,
.target-reps {
  font-family: var(--font-family-mono);
}

.context-label,
.context-count {
  font-weight: var(--font-weight-bold);
}

.context-label {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-caption);
}

.context-count {
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.prescription {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
}

.weight,
.target {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
}

.target-reps {
  color: var(--color-text-secondary);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-label {
  color: var(--color-text-secondary);
}

/* 44px ボタン ×2 + gap 16px ×2 + 値カラム 72px。桁数が変わってもボタン位置が動かない幅 */
.stepper {
  min-width: 192px;
}
</style>
