<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'
import { MENU_MAX } from '@/core/menu'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'
import BigNumber from '@/components/shared/ui/typography/BigNumber.vue'
import NumberStepper from '@/components/shared/ui/inputs/NumberStepper.vue'
import type { SetResult } from '@/core/types'

const {
  exerciseLabel,
  weight,
  setNumber,
  actualReps,
  memo,
  repsReadonly = false,
} = defineProps<{
  /** 種目の表示名（EXERCISE_LABELS の値）。ヘッダーにそのまま表示する */
  exerciseLabel: string
  /** セッションに焼き込まれた重量。表示のみで編集 UI は持たない（spec「セット編集モーダル」） */
  weight: number
  /** 1 始まりのセット番号 */
  setNumber: number
  actualReps: number
  memo: string
  /** 実績 read-only モード（履歴詳細用）。ステッパーを出さず静的表示にする。メモは編集可のまま */
  repsReadonly?: boolean
}>()

const emit = defineEmits<{
  /** SAVE タップ。編集後の実績を親が保存して閉じる */
  save: [result: SetResult]
  /** ESC / backdrop タップ。編集を破棄して閉じる（閉じる用の × ボタンは置かない） */
  cancel: []
}>()

const dialogEl = useTemplateRef<HTMLDialogElement>('dialogEl')

// 編集中のドラフト。SAVE まで親へ反映せず、破棄クローズで捨てられるようにする。
// マウント = 表示（親が v-if で出し分ける）なので、初期化子が開くたびの初期化を兼ねる
const draftReps = ref(actualReps)
const draftMemo = ref(memo)

function onSave() {
  emit('save', { actualReps: draftReps.value, memo: draftMemo.value })
}

function onCancel() {
  emit('cancel')
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogEl.value) emit('cancel')
}

onMounted(() => dialogEl.value?.showModal())
</script>

<template>
  <dialog
    ref="dialogEl"
    class="set-edit-dialog"
    @cancel.prevent="onCancel"
    @click="onBackdropClick"
  >
    <div class="panel">
      <header class="context">
        <h2 class="exercise">{{ exerciseLabel }}</h2>
        <div class="prescription">
          <div class="stat">
            <BigNumber :value="weight" />
            <BaseUnit>KG</BaseUnit>
          </div>
          <span class="dot">·</span>
          <div class="stat">
            <BaseUnit>SET</BaseUnit>
            <BigNumber :value="setNumber" />
          </div>
        </div>
      </header>

      <hr class="divider" />

      <div class="field">
        <BaseLabel>REPS DONE</BaseLabel>
        <div v-if="!repsReadonly" class="stepper-box">
          <NumberStepper v-model="draftReps" large :min="0" :max="MENU_MAX.reps" unit="REPS" />
        </div>
        <!-- read-only は入力 UI を出さない（spec「実績値の編集ポリシー」実装記）。ステッパーの値表示と同じ体裁で据える -->
        <div v-else class="stat">
          <BigNumber :value="actualReps" />
          <BaseUnit>REPS</BaseUnit>
        </div>
      </div>

      <div class="field">
        <BaseLabel>NOTE</BaseLabel>
        <textarea v-model="draftMemo" class="memo" placeholder="ADD NOTE" />
      </div>

      <BaseButton @click="onSave">SAVE</BaseButton>
    </div>
  </dialog>
</template>

<style scoped>
.set-edit-dialog {
  width: calc(100% - var(--space-16) * 2);
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

.context {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.exercise {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.prescription {
  display: flex;
  align-items: baseline;
  gap: var(--space-12);
}

.stat {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
}

.dot {
  color: var(--color-text-tertiary);
}

.divider {
  width: 100%;
  height: 1px;
  margin: 0;
  border: 0;
  background: var(--color-line-dark);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.stepper-box {
  padding: var(--space-16);
  border: 1px solid var(--color-line-dark);
  border-radius: var(--radius);
}

.memo {
  min-height: 64px;
  padding: var(--space-12);
  background: var(--color-bg-light);
  border: 1px solid var(--color-line-dark);
  border-radius: var(--radius);
  color: var(--color-text);
  /* form control は body のフォントを継承しないため明示する（global.css の button リセットと同趣旨） */
  font: inherit;
  /* モバイル前提のため手動リサイズは持たせない（入力に応じた高さはブラウザのスクロールに任せる） */
  resize: none;

  &::placeholder {
    /* デザインのメモ未入力プロンプト「Add note」（fg2）に合わせる */
    color: var(--color-text-secondary);
  }
}
</style>
