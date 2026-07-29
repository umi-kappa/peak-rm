<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import type { Exercise, Session } from '@/core/types'
import { EXERCISE_ORDER } from '@/core/constants'
import { sessionRepoInjectionKey } from '@/storage/sessionRepo'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import BrandBar from '@/components/pages/home/BrandBar.vue'
import ExerciseCard from '@/components/pages/home/ExerciseCard.vue'
import NavLink from '@/components/pages/home/NavLink.vue'

// main.ts で app.provide 済み。欠落はアプリ配線のバグなので即座に失敗させる
const injectedRepo = inject(sessionRepoInjectionKey)
if (!injectedRepo) throw new Error('session repo is not provided')
const sessionRepo = injectedRepo

const sessions = ref<Partial<Record<Exercise, Session>>>({})

async function loadSessions() {
  const next: Partial<Record<Exercise, Session>> = {}
  await Promise.all(
    EXERCISE_ORDER.map(async (exercise) => {
      const session = await sessionRepo.latestByExercise(exercise)
      if (session) next[exercise] = session
    }),
  )
  sessions.value = next
}

onMounted(loadSessions)
</script>

<template>
  <ScreenFrame flush-bottom>
    <template #header>
      <BrandBar />
    </template>

    <ul class="exercises" role="list">
      <li v-for="exercise in EXERCISE_ORDER" :key="exercise">
        <ExerciseCard :exercise :session="sessions[exercise]" />
      </li>
    </ul>

    <template #footer>
      <nav class="nav">
        <NavLink :to="{ name: 'history' }" icon="history" label="HISTORY" />
      </nav>
    </template>
  </ScreenFrame>
</template>

<style scoped>
.exercises {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.nav {
  border-top: 1px solid var(--color-line-dark);
}
</style>
