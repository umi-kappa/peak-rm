<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Exercise, Menu } from '@/core/types'
import { EXERCISE_LABELS, isExercise } from '@/core/constants'
import { resolveInitialMenu } from '@/core/menu'
import { sessionRepo } from '@/storage/sessionRepo'
import { sessionInjectionKey } from '@/composables/shared/session/useSession'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import NumberStepper from '@/components/shared/ui/inputs/NumberStepper.vue'
import LpIndicator from '@/components/pages/menu/LpIndicator.vue'
import WeightStepper from '@/components/pages/menu/WeightStepper.vue'

const route = useRoute()
const router = useRouter()
const { goBack } = useBackNavigation()

// App.vue で provide 済み。欠落はアプリ配線のバグなので即座に失敗させる
const injected = inject(sessionInjectionKey)
if (!injected) throw new Error('session store is not provided')
const session = injected

// route param を Exercise へ絞り込む。この画面は param を Session.exercise として
// 保存するため、不正値で書き込まないよう型ガードで弾いてホームへ逃がす
const rawExercise = route.params.exercise
const exercise =
  typeof rawExercise === 'string' && isExercise(rawExercise) ? rawExercise : undefined

// undefined 始まりにして読み込み完了まで本体を描画しない
//（共通初期値 → 増量後の値へ表示が切り替わるフラッシュを防ぐ）
const menu = ref<Menu>()
// 増量プレビューは初期解決時の値を固定表示する（増量提案の記録のため、手動編集には追従させない）
const lpPreview = ref<{ from: number; to: number }>()
// 遷移までに await を挟むため、二重タップで start() が並走するとセッションが重複 insert される
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
async function start() {
  if (starting.value || !menu.value || !exercise) return
  // 二重起動防止。session.start 失敗時は境界へ流れページごと unmount されるため、
  // 成功時（遷移で破棄）同様このフラグは戻さない
  starting.value = true
  // TODO(#41): AudioContext 生成・resume / Wake Lock 取得はここ（最初の await より前 =
  // 「開始」タップのユーザージェスチャ同期区間）で行う（iOS Safari 制約）。
  // これらは縮退（最善努力）なので #41 で追加する際は個別に try/catch し、境界へ流さない
  // （session.start の書き込み失敗＝根幹破壊とは分けて扱う。docs/conventions.md「エラーハンドリング」）
  await session.start(menu.value)
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
      <section class="section">
        <BaseLabel>WEIGHT</BaseLabel>
        <WeightStepper v-model="menu.weight" />
        <LpIndicator v-if="lpPreview" :from="lpPreview.from" :to="lpPreview.to" />
      </section>

      <section class="section">
        <BaseLabel>PLAN</BaseLabel>
        <BaseCard>
          <div class="row">
            <span class="row-label">REPS</span>
            <div class="stepper">
              <NumberStepper v-model="menu.reps" :min="1" unit="REPS" />
            </div>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="row">
            <span class="row-label">SETS</span>
            <div class="stepper">
              <NumberStepper v-model="menu.sets" :min="1" unit="SETS" />
            </div>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="row">
            <span class="row-label">INTERVAL</span>
            <div class="stepper">
              <NumberStepper v-model="menu.intervalSec" :step="10" :min="0" unit="SEC" />
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
