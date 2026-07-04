<script setup lang="ts">
import { inject, onMounted, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Exercise, MenuPreset } from '@/core/types'
import { EXERCISE_LABELS, isExercise } from '@/core/constants'
import { resolveInitialMenu } from '@/core/menuPreset'
import { menuPresetRepo } from '@/storage/menuPresetRepo'
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

// route param を Exercise へ絞り込む。この画面は param を DB キー（menuPresets.put）として
// 使うため、不正値で書き込まないよう型ガードで弾いてホームへ逃がす
const rawExercise = route.params.exercise
const exercise =
  typeof rawExercise === 'string' && isExercise(rawExercise) ? rawExercise : undefined

// undefined 始まりにして読み込み完了まで本体を描画しない
//（共通初期値 → 増量後の値へ表示が切り替わるフラッシュを防ぐ）
const menu = ref<MenuPreset>()
// 増量プレビューは初期解決時の値を固定表示する（増量提案の記録のため、手動編集には追従させない）
const lpPreview = ref<{ from: number; to: number }>()
// 遷移までに await を挟むため、二重タップで start() が並走するとセッションが重複 insert される
const starting = ref(false)

async function loadMenu(exercise: Exercise) {
  const [preset, prevSession] = await Promise.all([
    menuPresetRepo.get(exercise),
    sessionRepo.latestByExercise(exercise),
  ])
  const initial = resolveInitialMenu(exercise, preset, prevSession)
  menu.value = initial.menu
  lpPreview.value = initial.lpPreview
}

// 開始すると session フローに入る。以降 training / interval / result は replace で畳み、
// メニューへ戻れないようにする（重量・メニューはトレーニング中変更不可）。
// 種目はフロー全体で URL に引き継ぐ。
async function start() {
  if (starting.value || !menu.value || !exercise) return
  starting.value = true
  // TODO(#41): AudioContext 生成・resume / Wake Lock 取得はここ（最初の await より前 =
  // 「開始」タップのユーザージェスチャ同期区間）で行う（iOS Safari 制約）
  try {
    await session.start(menu.value)
  } catch (error) {
    console.error('Failed to start session', error)
    // 開始に失敗したときだけ解除して再試行を許す（成功時は遷移して破棄される）
    starting.value = false
    return
  }
  try {
    // 開始時の値を保存し、次回の初期表示・linear progression のベースラインにする（編集は累積）。
    // セッション insert より後に置く: 先に保存すると insert 失敗時にベースラインだけ前進し、
    // 次回の LP 適用で増量が二重にかかる。ここで失敗しても増量が保存されないだけ（据え置き）なので遷移は続行する
    await menuPresetRepo.put(toRaw(menu.value))
  } catch (error) {
    console.error('Failed to save menu preset', error)
  }
  router.replace({ name: 'training', params: { exercise } })
}

onMounted(() => {
  if (!exercise) {
    router.replace({ name: 'home' })
    return
  }
  loadMenu(exercise).catch((error) => {
    console.error('Failed to load menu preset', error)
  })
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
