<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EXERCISE_LABELS } from '@/core/constants'
import { useResultSession } from '@/composables/pages/result/useResultSession'
import { formatDeltaBadge } from '@/core/deltaBadge'
import { formatOneRm, hasOneRm } from '@/core/oneRm'
import { sessionInjectionKey } from '@/composables/shared/session/useSession'
import { useSetEdit } from '@/composables/shared/session/useSetEdit'
import { useSetTimeline } from '@/composables/shared/session/useSetTimeline'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import { injectRequired } from '@/composables/shared/inject/injectRequired'
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
// EXECUTED は「全セットを実行した（目標未達）」、COMPLETE は「目標にも到達した」を指す
const MARKER_LABELS = {
  aborted: 'SESSION ABORTED',
  finished: 'SESSION EXECUTED',
  complete: 'SESSION COMPLETE',
} as const satisfies Record<SessionOutcome, string>

const route = useRoute()
const router = useRouter()
// ← は履歴一覧から push で開かれた前提の戻り（直リンク時は履歴一覧へ逃がす）
const { goBack } = useBackNavigation({ name: 'history' })

// 実行中セッション store は、useResultSession が返す表示対象の session と区別するため sessionStore と呼ぶ
const sessionStore = injectRequired(sessionInjectionKey)
const sessionRepo = injectRequired(sessionRepoInjectionKey)

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
} = useResultSession(origin, sessionId, { store: sessionStore, repo: sessionRepo })

// セット編集モーダルの配線（保存先の origin 分岐は useResultSession が担う）
const { editingSet, openSetEdit, closeSetEdit, saveSetEdit } = useSetEdit(
  () => session.value,
  patchResultAt,
)

// 結果は確定済みなので next は無し（中断で未実施のセットは pending のまま）
const { cards } = useSetTimeline(() => session.value, { live: false })

const deleteConfirmOpen = ref(false)

// 算出できないときの `—` は formatOneRm が返す。数値と同じ重みで並ばないよう階調も落とす
const oneRmTone = computed(() => (hasOneRm(maxOneRm.value) ? 'accent' : 'tertiary'))
const oneRmText = computed(() => formatOneRm(maxOneRm.value))

// 前回比バッジ（整形は formatDeltaBadge。増減で矢印を出し分け、表示上 0 は矢印なしの ±0.0）
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
        <div class="hero-stack">
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
              <BigNumber :value="oneRmText" size="hero" :tone="oneRmTone" />
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

      <section class="sets" aria-labelledby="result-sets-label">
        <BaseLabel id="result-sets-label">SETS</BaseLabel>
        <ul class="list" role="list">
          <li v-for="card in cards" :key="card.setNumber">
            <TimelineSetCard
              :set-number="card.setNumber"
              :state="card.state"
              :target-reps="session.menu.reps"
              :actual-reps="card.actualReps"
              :memo="card.memo"
              @edit="openSetEdit(card.index)"
            />
          </li>
        </ul>
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

/* ステータスマーカー・推定 1RM・前回比バッジを縦に中央揃えで積む。
   上下の余白は BaseCard の padding 16px に委ね、この要素では持たない */
.hero-stack {
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

.sets,
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}
</style>
