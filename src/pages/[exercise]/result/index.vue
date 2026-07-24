<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EXERCISE_LABELS } from '@/core/constants'
import { useResultSession } from '@/composables/pages/result/useResultSession'
import { formatDeltaBadge } from '@/core/deltaBadge'
import { sessionInjectionKey } from '@/composables/shared/session/useSession'
import { useSetEdit } from '@/composables/shared/session/useSetEdit'
import { useSetTimeline } from '@/composables/shared/session/useSetTimeline'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import { sessionRepoInjectionKey } from '@/storage/sessionRepo'
import type { SessionOutcome } from '@/core/session'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'
import BigNumber from '@/components/shared/ui/typography/BigNumber.vue'
import IconButton from '@/components/shared/ui/buttons/IconButton.vue'
import ConfirmDialog from '@/components/shared/ui/dialog/ConfirmDialog.vue'
import SetEditDialog from '@/components/shared/ui/dialog/SetEditDialog.vue'
import LpIndicator from '@/components/shared/session/LpIndicator.vue'
import MenuSummary from '@/components/shared/session/MenuSummary.vue'
import TimelineSetCard from '@/components/shared/session/TimelineSetCard.vue'
import type { ResultOrigin } from '@/router'

// セッション結果 3 状態の表示ラベル（spec「結果確認画面」）。
// EXECUTED は「全セット完走・目標未達」で、Session.status の executed（完遂）とは別の表示軸
const MARKER_LABELS: Record<SessionOutcome, string> = {
  aborted: 'SESSION ABORTED',
  finished: 'SESSION EXECUTED',
  complete: 'SESSION COMPLETE',
}

const route = useRoute()
const router = useRouter()
// ← は履歴一覧から push で開かれた前提の戻り（直リンク時は履歴一覧へ逃がす）
const { goBack } = useBackNavigation({ name: 'history' })

// main.ts で app.provide 済み。欠落はアプリ配線のバグなので即座に失敗させる
const injectedSession = inject(sessionInjectionKey)
if (!injectedSession) throw new Error('session store is not provided')
const store = injectedSession
const injectedRepo = inject(sessionRepoInjectionKey)
if (!injectedRepo) throw new Error('session repo is not provided')
const repo = injectedRepo

// 遷移元。origin / id は結果確認のマウント中に変わらない（フロー外へ出てからしか再入できない）
// history = ヘッダー左上「←」で履歴へ / session = 下部 FINISH でホームへ（spec「結果確認画面」）
const origin: ResultOrigin = route.query.origin === 'history' ? 'history' : 'session'
const sessionId = typeof route.query.id === 'string' ? route.query.id : undefined
// 履歴経由フラグ。← 戻り・削除導線・ヘッダ表示の分岐に使う（origin はマウント中不変）
const isHistory = origin === 'history'

const {
  session,
  marker,
  maxOneRm,
  delta,
  lpPreview,
  dayLabel,
  repsReadonly,
  load,
  patchResultAt,
  remove,
} = useResultSession(origin, sessionId, { store, repo })

// セット編集モーダルの配線（保存先の origin 分岐は useResultSession が担う）
const { editingSet, openSetEdit, closeSetEdit, saveSetEdit } = useSetEdit(
  () => session.value,
  patchResultAt,
)

// 結果は確定済みなので next は無し（中断で未実施のセットは pending のまま）
const { cards } = useSetTimeline(() => session.value, { live: false })

const deleteConfirmOpen = ref(false)

// 全セットスキップ等で推定 1RM が 0 のときは数値を出さず —（home の ExerciseCard と同じ規則）
const oneRmText = computed(() => (maxOneRm.value > 0 ? maxOneRm.value.toFixed(1) : '—'))

// 前回比バッジ（整形は formatDeltaBadge。増減で矢印を出し分け、差 0 は矢印なしの ±0.0）
const deltaBadge = computed(() => formatDeltaBadge(delta.value))

// 中断は通常境界の枠でわずかに強調する（design: aborted のみ line）
const cardBorder = computed(() => (marker.value === 'aborted' ? 'line' : 'soft'))

// 完了フローの終端。result を replace で畳み、戻るでフローに再入できないようにする
function finishTraining() {
  router.replace({ name: 'home' })
}

function openDeleteConfirm() {
  deleteConfirmOpen.value = true
}

function closeDeleteConfirm() {
  deleteConfirmOpen.value = false
}

// 削除を確定して履歴一覧へ戻る（導線は履歴経由のみ。spec「結果確認画面」）
async function confirmDelete() {
  deleteConfirmOpen.value = false
  await remove()
  goBack()
}

// 履歴経由で id 不正・削除済み（削除後のブラウザ戻り等）は履歴一覧へ逃がす
async function initialize() {
  const found = await load()
  if (!found) router.replace({ name: 'history' })
}

onMounted(initialize)
</script>

<template>
  <ScreenFrame>
    <template v-if="session" #header>
      <AppBar :title="EXERCISE_LABELS[session.exercise]" :back="isHistory" @back="goBack">
        <template v-if="isHistory" #action>
          <IconButton name="trash-2" label="Delete" @click="openDeleteConfirm" />
        </template>
      </AppBar>
    </template>

    <template v-if="session">
      <span v-if="dayLabel" class="date">{{ dayLabel }}</span>

      <MenuSummary
        :weight="session.menu.weight"
        :reps="session.menu.reps"
        :sets="session.menu.sets"
      />

      <BaseCard :border="cardBorder">
        <div class="hero">
          <div v-if="marker" class="marker" :class="{ complete: marker === 'complete' }">
            <span class="rule" />
            <span class="marker-body">
              <BaseIcon v-if="marker === 'complete'" name="check" :size="12" />
              <span class="marker-label">{{ MARKER_LABELS[marker] }}</span>
            </span>
            <span class="rule" />
          </div>

          <div class="one-rm">
            <BaseLabel>EST. 1RM</BaseLabel>
            <div class="one-rm-value">
              <BigNumber :value="oneRmText" size="hero" accent />
              <BaseUnit>KG</BaseUnit>
            </div>
          </div>

          <div v-if="deltaBadge" class="delta">
            <BaseIcon v-if="deltaBadge.icon" :name="deltaBadge.icon" :size="12" />
            <span class="delta-value">{{ deltaBadge.text }}</span>
            <BaseUnit>KG</BaseUnit>
          </div>
        </div>
      </BaseCard>

      <LpIndicator
        v-if="lpPreview"
        :from="lpPreview.from"
        :to="lpPreview.to"
        message="SESSION COMPLETED!"
      />

      <section class="sets">
        <BaseLabel>SETS</BaseLabel>
        <TimelineSetCard
          v-for="card in cards"
          :key="card.setNumber"
          :set-number="card.setNumber"
          :state="card.state"
          :target-reps="session.menu.reps"
          :actual-reps="card.actualReps"
          :memo="card.memo"
          @edit="openSetEdit(card.index)"
        />
      </section>
    </template>

    <template v-if="origin === 'session' && session" #footer>
      <BaseButton @click="finishTraining">FINISH</BaseButton>
    </template>

    <ConfirmDialog
      v-if="deleteConfirmOpen"
      title="セッションを削除しますか？"
      message="この記録は履歴と 1RM グラフから消えます。"
      confirm-label="削除する"
      @confirm="confirmDelete"
      @cancel="closeDeleteConfirm"
    />

    <!-- 編集対象がある間だけマウントする（対象由来の props にダミーの既定値を渡さず、ドラフト初期化をマウントに乗せる） -->
    <SetEditDialog
      v-if="editingSet"
      :exercise-label="editingSet.exerciseLabel"
      :weight="editingSet.weight"
      :set-number="editingSet.setNumber"
      :actual-reps="editingSet.actualReps"
      :memo="editingSet.memo"
      :reps-readonly
      @save="saveSetEdit"
      @cancel="closeSetEdit"
    />
  </ScreenFrame>
</template>

<style scoped>
.date {
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
}

/* カードの padding 16px に上 12px / 下 8px を足し、設計のヒーロー上 28px / 下 24px に合わせる */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-16);
}

.marker {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  color: var(--color-text-secondary);

  .rule {
    width: 24px;
    height: 1px;
    background: var(--color-line);
  }

  &.complete {
    color: var(--color-accent);

    .rule {
      background: var(--color-accent);
    }

    .marker-label {
      text-shadow: var(--shadow-glow);
    }
  }
}

.marker-body {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.marker-label {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-bold);
}

.one-rm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
}

.one-rm-value {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
}

/* 前回比のピル。増減の事実提示に留める（丸枠 + 矢印 + 差分） */
.delta {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding-block: var(--space-8);
  padding-inline: var(--space-16);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
}

.delta-value {
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
}

.sets {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}
</style>
