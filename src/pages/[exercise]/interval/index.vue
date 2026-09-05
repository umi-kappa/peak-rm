<script setup lang="ts">
import { computed, inject, onScopeDispose, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EXERCISE_LABELS } from '@/core/constants'
import { formatCentis, formatClock } from '@/core/duration'
import { sessionInjectionKey } from '@/composables/shared/session/useSession'
import {
  intervalTimerDepsInjectionKey,
  useIntervalTimer,
} from '@/composables/shared/session/useIntervalTimer'
import { audioCueInjectionKey } from '@/composables/shared/platform/useAudioCue'
import { useSetEdit } from '@/composables/shared/session/useSetEdit'
import { useSetTimeline } from '@/composables/shared/session/useSetTimeline'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import { injectRequired } from '@/composables/shared/inject/injectRequired'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import BigNumber from '@/components/shared/ui/typography/BigNumber.vue'
import IconButton from '@/components/shared/ui/buttons/IconButton.vue'
import ConfirmDialog from '@/components/shared/ui/dialog/ConfirmDialog.vue'
import SetEditDialog from '@/components/shared/ui/dialog/SetEditDialog.vue'
import MenuSummary from '@/components/shared/session/MenuSummary.vue'
import TimelineSetCard from '@/components/shared/session/TimelineSetCard.vue'

const route = useRoute()
const router = useRouter()
const { goBack } = useBackNavigation()

const session = injectRequired(sessionInjectionKey)
const audioCue = injectRequired(audioCueInjectionKey)

const { menu, exercise } = session
// 停止ボタンの活性表現に使う。テンプレートで自動アンラップさせるため、ここで取り出す
const { ringing } = audioCue

// セット完了で自動開始（この画面のマウント = セット完了直後）。この画面からは止めず、
// 0 秒到達でも止まらず超過を数え続ける。止まるのは超過上限（+3:00）到達と
// スコープ破棄（次のセット / 中断での遷移）の 2 つ。
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

// 0 秒到達でアラームを鳴らし始め、超過上限（+3:00）でタイマーが止まったら鳴り止ませる
//（spec: 音のみ。バイブ・画面遷移は行わない）。インターバルは 0 秒に設定でき、
// その場合はマウント時点で到達済みなので、watch を張る前にここで拾う
if (timer.reachedZero.value) audioCue.start()

watch(timer.reachedZero, (reached) => {
  if (reached) audioCue.start()
  else audioCue.stop()
})

// 他画面への遷移（NEXT SET / 中断 / ブラウザの戻る）でも鳴り止ませる
onScopeDispose(audioCue.stop)
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
            <div class="value">
              <BigNumber :value="clockText" size="hero" tone="accent" />
              <span class="centis">{{ centisText }}</span>
            </div>
            <IconButton
              name="volume-x"
              label="Stop alarm"
              class="stop-alarm"
              :disabled="!ringing"
              @click="audioCue.stop"
            />
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
/* ラベル行・タイマー・進捗バーを縦に中央揃えで積む。
   上の余白は BaseCard の padding 16px に委ね、下だけ 8px 足して 24px にする */
.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
  padding-block-end: var(--space-8);
}

.timer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 時刻を常にカードの中央に置き、停止ボタンは右側の余白へ逃がす。
   両端を 1fr で挟むことで、ボタンの有無や活性状態で数字の中心が動かない */
.clock {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
}

.value {
  display: flex;
  grid-column: 2;
  align-items: baseline;
}

.stop-alarm {
  justify-self: end;
}

.centis {
  color: var(--color-text-tertiary);
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
}

/* 経過割合の progress bar。装飾ではなく経過時間の受動的な可視化 */
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
