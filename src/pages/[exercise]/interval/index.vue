<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EXERCISE_LABELS } from '@/core/constants'
import { formatCentis, formatClock } from '@/core/duration'
import { sessionInjectionKey } from '@/composables/shared/session/useSession'
import {
  intervalTimerDepsInjectionKey,
  useIntervalTimer,
} from '@/composables/shared/session/useIntervalTimer'
import { useSetEdit } from '@/composables/shared/session/useSetEdit'
import { useSetTimeline } from '@/composables/shared/session/useSetTimeline'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import BigNumber from '@/components/shared/ui/typography/BigNumber.vue'
import ConfirmDialog from '@/components/shared/ui/dialog/ConfirmDialog.vue'
import SetEditDialog from '@/components/shared/ui/dialog/SetEditDialog.vue'
import MenuSummary from '@/components/shared/session/MenuSummary.vue'
import TimelineSetCard from '@/components/shared/session/TimelineSetCard.vue'

const route = useRoute()
const router = useRouter()
const { goBack } = useBackNavigation()

// main.ts で app.provide 済み。欠落はアプリ配線のバグなので即座に失敗させる
const injected = inject(sessionInjectionKey)
if (!injected) throw new Error('session store is not provided')
const session = injected

const { menu, exercise } = session

// セット完了で自動開始（この画面のマウント = セット完了直後）。停止はスコープ破棄
//（次のセット / 中断での遷移）のみで、0 秒到達では止めず超過を数え続ける。
// deps は stories が固定時計を注入するための seam（通常は未 provide で実時計）
const timer = useIntervalTimer(inject(intervalTimerDepsInjectionKey, {}))
if (menu.value) timer.start(menu.value.intervalSec)

const abortConfirmOpen = ref(false)

// セット編集モーダルの配線（SAVE の results 再保存は useSession.patchResultAt が担う）
const { editingSet, openSetEdit, closeSetEdit, saveSetEdit } = useSetEdit(
  () => session.session.value,
  session.patchResultAt,
)

// 0 秒到達後は残り時間表示を +超過時間 に切り替える（受動的な表示。延長等の操作は加えない）
const isOverrun = computed(() => timer.remainingMs.value === 0)
const clockText = computed(() =>
  isOverrun.value ? `+${formatClock(timer.overrunMs.value)}` : formatClock(timer.remainingMs.value),
)
// センチ秒は常に表示する。カウントダウン中は残り時間、超過中は超過経過を数える
const centisText = computed(() =>
  formatCentis(isOverrun.value ? timer.overrunMs.value : timer.remainingMs.value),
)
const progressWidth = computed(() => `${(timer.progress.value * 100).toFixed(1)}%`)

// 進行中なので先頭の未実施セットを next に昇格させる
const { cards } = useSetTimeline(() => session.session.value, { live: true })

// :exercise は session フロー内で不変なので、現在の params をそのまま引き継ぐ
function nextSet() {
  session.nextSet()
  router.replace({ name: 'training', params: route.params })
}

function openAbortConfirm() {
  abortConfirmOpen.value = true
}

function closeAbortConfirm() {
  abortConfirmOpen.value = false
}

// 中断を確定して結果確認へ。完了済みセットは都度保存済みのため追加書き込みは無い
function confirmAbort() {
  abortConfirmOpen.value = false
  session.abort()
  router.replace({ name: 'result', params: route.params, query: { origin: 'session' } })
}
</script>

<template>
  <ScreenFrame>
    <template v-if="exercise" #header>
      <AppBar :title="EXERCISE_LABELS[exercise]" @back="goBack" />
    </template>

    <template v-if="menu">
      <MenuSummary :weight="menu.weight" :reps="menu.reps" :sets="menu.sets" />

      <BaseCard>
        <div class="timer">
          <div class="timer-head">
            <BaseLabel>INTERVAL</BaseLabel>
            <BaseLabel>TARGET {{ formatClock(menu.intervalSec * 1000) }}</BaseLabel>
          </div>
          <div class="clock">
            <BigNumber :value="clockText" size="hero" accent />
            <span class="centis">{{ centisText }}</span>
          </div>
          <div class="track">
            <div class="fill" :style="{ width: progressWidth }" />
          </div>
        </div>
      </BaseCard>

      <section class="sets" aria-labelledby="interval-sets-label">
        <BaseLabel id="interval-sets-label">SETS</BaseLabel>
        <ul class="list" role="list">
          <li v-for="card in cards" :key="card.setNumber">
            <TimelineSetCard
              :set-number="card.setNumber"
              :state="card.state"
              :target-reps="menu.reps"
              :actual-reps="card.actualReps"
              :memo="card.memo"
              memo-prompt
              @edit="openSetEdit(card.index)"
            />
          </li>
        </ul>
      </section>
    </template>

    <template v-if="menu" #footer>
      <div class="actions">
        <BaseButton @click="nextSet">NEXT SET</BaseButton>
        <BaseButton variant="secondary" @click="openAbortConfirm">END SESSION</BaseButton>
      </div>
    </template>

    <ConfirmDialog
      v-if="abortConfirmOpen"
      title="トレーニングを中断しますか？"
      message="ここまでの記録を保存して結果確認画面へ進みます。"
      confirm-label="中断する"
      @confirm="confirmAbort"
      @cancel="closeAbortConfirm"
    />

    <!-- 編集対象がある間だけマウントする（対象由来の props にダミーの既定値を渡さず、ドラフト初期化をマウントに乗せる） -->
    <SetEditDialog
      v-if="editingSet"
      :exercise-label="editingSet.exerciseLabel"
      :weight="editingSet.weight"
      :set-number="editingSet.setNumber"
      :actual-reps="editingSet.actualReps"
      :memo="editingSet.memo"
      @save="saveSetEdit"
      @cancel="closeSetEdit"
    />
  </ScreenFrame>
</template>

<style scoped>
/* カードの padding 16px に 12px を足し、設計のタイマーヒーロー上下 28px に合わせる */
.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
  padding-bottom: var(--space-8);
}

.timer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.clock {
  display: flex;
  align-items: baseline;
}

.centis {
  color: var(--color-text-tertiary);
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
}

/* 経過割合の hairline。装飾ではなく経過時間の受動的な可視化 */
.track {
  width: 100%;
  height: 4px;
  overflow: hidden;
  background: var(--color-line);
  border-radius: var(--radius);
}

.fill {
  height: 100%;
  background: var(--color-accent);
}

.sets,
.list,
.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}
</style>
