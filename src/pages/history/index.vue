<script setup lang="ts">
import { inject, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import { sessionRepoInjectionKey } from '@/storage/sessionRepo'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import CardButton from '@/components/shared/ui/buttons/CardButton.vue'
import type { Session } from '@/core/types'

const router = useRouter()
const { goBack } = useBackNavigation()

// main.ts で app.provide 済み。欠落はアプリ配線のバグなので即座に失敗させる
const injectedRepo = inject(sessionRepoInjectionKey)
if (!injectedRepo) throw new Error('session repo is not provided')
const repo = injectedRepo

// スタブでは直近 1 件だけを開けるようにする（一覧・種目タブは後続 Issue #39）
const latest = shallowRef<Session>()

// 履歴からは push で開き、結果確認画面の戻る（←）で自然に履歴へ戻れるようにする
function openSession() {
  const session = latest.value
  if (session === undefined) return
  router.push({
    name: 'result',
    params: { exercise: session.exercise },
    query: { origin: 'history', id: session.id },
  })
}

async function loadLatest() {
  latest.value = (await repo.listForHistory()).at(0)
}

onMounted(loadLatest)
</script>

<template>
  <ScreenFrame>
    <template #header>
      <AppBar title="HISTORY" @back="goBack" />
    </template>
    <CardButton v-if="latest" @click="openSession">セッションを開く</CardButton>
  </ScreenFrame>
</template>
