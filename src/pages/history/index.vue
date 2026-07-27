<script setup lang="ts">
import { inject, onMounted } from 'vue'
import { useHistory } from '@/composables/pages/history/useHistory'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import { sessionRepoInjectionKey } from '@/storage/sessionRepo'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'
import ExerciseTabs from '@/components/pages/history/ExerciseTabs.vue'
import SessionSummaryCard from '@/components/pages/history/SessionSummaryCard.vue'

const { goBack } = useBackNavigation()

// main.ts で app.provide 済み。欠落はアプリ配線のバグなので即座に失敗させる
const injectedRepo = inject(sessionRepoInjectionKey)
if (!injectedRepo) throw new Error('session repo is not provided')
const repo = injectedRepo

const { exercise, sessions, selectExercise, load } = useHistory({ repo })

onMounted(load)
</script>

<template>
  <ScreenFrame>
    <template #header>
      <AppBar title="HISTORY" @back="goBack" />
    </template>

    <!-- 選択種目は URL が唯一のソースなので、v-model ではなく値と更新を分けて渡す -->
    <ExerciseTabs :model-value="exercise" @update:model-value="selectExercise" />

    <section class="sessions">
      <BaseLabel>SESSIONS</BaseLabel>
      <div v-if="sessions.length > 0" class="list">
        <SessionSummaryCard v-for="session in sessions" :key="session.id" :session />
      </div>
      <!-- 選択中の種目に記録が無い場合（spec「履歴」）。見出しは残し、行の位置に 1 行で示す
           （ホームが LAST ラベルを残して NO LOG を出すのと同じ扱い）。
           load 完了前も同じ表示になるが、これもホームと揃えてフラッシュを許容する
           — 共通初期値から増量後の値へ数値が書き換わるメニュー設定と違い、誤った値を読むリスクがない -->
      <BaseUnit v-else>NO SESSIONS</BaseUnit>
    </section>
  </ScreenFrame>
</template>

<style scoped>
.sessions {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
</style>
