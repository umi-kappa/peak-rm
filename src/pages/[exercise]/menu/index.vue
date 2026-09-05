<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Exercise, Menu } from '@/core/types'
import type { LpPreview } from '@/core/linearProgression'
import { EXERCISE_LABELS, isExercise } from '@/core/constants'
import { MENU_MAX, MENU_MIN, resolveInitialMenu } from '@/core/menu'
import { sessionRepoInjectionKey } from '@/storage/sessionRepo'
import { sessionInjectionKey } from '@/composables/shared/session/useSession'
import { audioCueInjectionKey } from '@/composables/shared/platform/useAudioCue'
import { wakeLockInjectionKey } from '@/composables/shared/platform/useWakeLock'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import { injectRequired } from '@/composables/shared/inject/injectRequired'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import NumberStepper from '@/components/shared/ui/inputs/NumberStepper.vue'
import LpIndicator from '@/components/shared/session/LpIndicator.vue'
import WeightStepper from '@/components/pages/menu/WeightStepper.vue'

const route = useRoute()
const router = useRouter()
const { goBack } = useBackNavigation()

const session = injectRequired(sessionInjectionKey)
const sessionRepo = injectRequired(sessionRepoInjectionKey)
const audioCue = injectRequired(audioCueInjectionKey)
const wakeLock = injectRequired(wakeLockInjectionKey)

// route param を Exercise へ絞り込む。この画面は param を Session.exercise として
// 保存するため、不正値で書き込まないよう型ガードで弾いてホームへ逃がす
const rawExercise = route.params.exercise
const exercise = isExercise(rawExercise) ? rawExercise : undefined

// undefined 始まりにして読み込み完了まで本体を描画しない
//（共通初期値 → 増量後の値へ表示が切り替わるフラッシュを防ぐ）
const menu = ref<Menu>()
// 増量プレビューは初期解決時の値を固定表示する（増量提案の記録のため、手動編集には追従させない）
const lpPreview = ref<LpPreview>()
// 遷移（router.replace）の完了は非同期のため、完了前の再タップで start() が再実行されると
// セッションが作り直される（id / startedAt が変わる）
const starting = ref(false)

async function loadMenu(exercise: Exercise) {
  const prevSession = await sessionRepo.latestByExercise(exercise)
  const initial = resolveInitialMenu(exercise, prevSession)
  menu.value = initial.menu
  lpPreview.value = initial.lpPreview
}

// 開始すると session フローに入る。以降 training / interval / result は replace で畳み、
// メニューへ戻れないようにする（重量・メニューはトレーニング中変更不可）。
// 種目はフロー全体で URL に引き継ぐ。
function start() {
  if (starting.value || !menu.value || !exercise) return
  // 二重起動防止。session.start 失敗時は境界へ流れページごと unmount されるため、
  // 成功時（遷移で破棄）同様このフラグは戻さない
  starting.value = true
  // AudioContext の resume と Wake Lock の取得は「開始」タップのユーザージェスチャ同期区間で
  // 行う必要がある（iOS Safari 制約。spec「インターバルタイマー」）。どちらも最善努力で
  // composable 内が失敗を握るため、完了を待たず投げっぱなしにして遷移を遅らせない
  void audioCue.prepare()
  void wakeLock.acquire()
  session.start(menu.value)
  router.replace({ name: 'training', params: { exercise } })
}

onMounted(async () => {
  if (!exercise) {
    router.replace({ name: 'home' })
    return
  }
  await loadMenu(exercise)
})
</script>

<template>
  <ScreenFrame>
    <template v-if="exercise" #header>
      <AppBar :title="EXERCISE_LABELS[exercise]" @back="goBack" />
    </template>

    <template v-if="menu">
      <section class="section" aria-labelledby="menu-weight-label">
        <BaseLabel id="menu-weight-label">WEIGHT</BaseLabel>
        <WeightStepper v-model="menu.weight" />
        <LpIndicator
          v-if="lpPreview"
          :from="lpPreview.from"
          :to="lpPreview.to"
          message="LAST SESSION COMPLETED!"
        />
      </section>

      <section class="section" aria-labelledby="menu-plan-label">
        <BaseLabel id="menu-plan-label">PLAN</BaseLabel>
        <BaseCard>
          <div class="row">
            <span class="row-label">REPS</span>
            <div class="stepper">
              <NumberStepper
                v-model="menu.reps"
                label="REPS"
                :min="MENU_MIN.reps"
                :max="MENU_MAX.reps"
                unit="REPS"
              />
            </div>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="row">
            <span class="row-label">SETS</span>
            <div class="stepper">
              <NumberStepper
                v-model="menu.sets"
                label="SETS"
                :min="MENU_MIN.sets"
                :max="MENU_MAX.sets"
                unit="SETS"
              />
            </div>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="row">
            <span class="row-label">INTERVAL</span>
            <div class="stepper">
              <NumberStepper
                v-model="menu.intervalSec"
                label="INTERVAL"
                :step="10"
                :min="MENU_MIN.intervalSec"
                :max="MENU_MAX.intervalSec"
                unit="SEC"
              />
            </div>
          </div>
        </BaseCard>
      </section>
    </template>

    <template v-if="menu" #footer>
      <BaseButton @click="start">START SESSION</BaseButton>
    </template>
  </ScreenFrame>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-label {
  font-size: var(--font-size-body);
}

/* 値の桁数が変わってもステッパーのボタン位置が動かないよう最小幅を固定する。
   最長の「3 桁 + SEC」（例: 100 SEC ≈ 178px）まで収まる幅 */
.stepper {
  min-width: 184px;
}
</style>
