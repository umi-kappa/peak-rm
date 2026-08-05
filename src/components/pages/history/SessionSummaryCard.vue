<script setup lang="ts">
import { computed } from 'vue'
import { formatLocalMonthDay } from '@/core/localDay'
import { formatOneRm, hasOneRm } from '@/core/oneRm'
import { formatSetReps, sessionMaxOneRm, sessionOutcome } from '@/core/session'
import type { SessionOutcome } from '@/core/session'
import type { Session } from '@/core/types'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'
import CardButton from '@/components/shared/ui/buttons/CardButton.vue'

// ステータスバッジの表示。ラベルは結果確認画面のマーカーと同じ 3 状態に対応する。
// tone は色クラス名で、core の union 名を CSS に直結させない（値名を変えても壊れるのはこの表だけ）。
// 色は 3 状態の区別だけに使い、完遂だけをアクセントで立てて他は本文より落とす
const BADGE = {
  aborted: { label: 'ABORTED', tone: 'tertiary' },
  finished: { label: 'EXECUTED', tone: 'secondary' },
  complete: { label: 'COMPLETED', tone: 'accent' },
} as const satisfies Record<
  SessionOutcome,
  { label: string; tone: 'accent' | 'secondary' | 'tertiary' }
>

const { session } = defineProps<{
  session: Session
}>()

const dayLabel = computed(() => formatLocalMonthDay(session.startedAt))
const oneRm = computed(() => sessionMaxOneRm(session))
const oneRmText = computed(() => formatOneRm(oneRm.value))
const oneRmTone = computed(() => (hasOneRm(oneRm.value) ? 'default' : 'tertiary'))
const badge = computed(() => BADGE[sessionOutcome(session)])
const reps = computed(() => formatSetReps(session))
</script>

<template>
  <!-- 履歴詳細（結果確認画面の履歴モード）。push で開き、結果側の ← で一覧へ戻る -->
  <CardButton
    :to="{
      name: 'result',
      params: { exercise: session.exercise },
      query: { origin: 'history', id: session.id },
    }"
  >
    <div class="session-summary-card">
      <span class="date">{{ dayLabel }}</span>

      <div class="one-rm">
        <span class="one-rm-value" :class="oneRmTone">{{ oneRmText }}</span>
        <BaseUnit>KG</BaseUnit>
      </div>

      <div class="detail">
        <div class="weight-line">
          <span class="weight">{{ session.menu.weight }}</span>
          <BaseUnit>KG</BaseUnit>
        </div>
        <div class="reps-line">
          <span class="reps">{{ reps }}</span>
          <BaseUnit>REPS</BaseUnit>
        </div>
        <!-- ステータスは実績から導出した結論なので、根拠（実績回数）の直後に置く -->
        <span class="badge" :class="badge.tone">{{ badge.label }}</span>
      </div>
    </div>
  </CardButton>
</template>

<style scoped>
/* 日付は MM/DD の固定 5 桁（tabular-nums）なので、auto でも行をまたいで推定 1RM の左端が揃う */
.session-summary-card {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--space-12);
  align-items: center;
  line-height: var(--line-height-tight);
}

/* 行内テキストは mono で統一し、各クラスには差分（色・サイズ・太さ）だけ置く。
   太さを立てるのは推定 1RM とバッジだけで、日付・重量・実績回数は数字でも
   body 既定の regular に留める */
.date,
.one-rm-value,
.weight,
.reps,
.badge {
  font-family: var(--font-family-mono);
}

/* 桁揃えは数値だけ（バッジは文字のみで効かない） */
.date,
.one-rm-value,
.weight,
.reps {
  font-variant-numeric: tabular-nums;
}

/* 値と単位の横並び。1RM・重量・実績回数で共通 */
.one-rm,
.weight-line,
.reps-line {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
}

/* 値のうち色で立てるのは推定 1RM だけなので、日付と重量は一段落とす */
.date,
.weight {
  color: var(--color-text-secondary);
}

/* 行内の title サイズは BigNumber の size union（stat / hero / display）に無いため、
   推定 1RM は BigNumber を使わず自前で持つ（mono と桁揃えは上の共通セレクタ、
   サイズ・太さ・階調はこのブロック） */
.one-rm-value {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);

  /* 算出できない（全セットスキップ）ときの — は、実績値と同じ重みで並ばないよう階調を落とす */
  &.tertiary {
    color: var(--color-text-tertiary);
  }
}

.detail {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-4);
}

.reps {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-caption);
  /* 折り返しうるのでルートの tight ではなく既定の行間（conventions「line-height の使い分け」） */
  line-height: var(--line-height);
  text-align: right;
  word-break: break-word;
}

.badge {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-bold);

  &.accent {
    color: var(--color-accent);
  }

  &.secondary {
    color: var(--color-text-secondary);
  }

  &.tertiary {
    color: var(--color-text-tertiary);
  }
}
</style>
