<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Exercise, Session } from '@/core/types'
import { EXERCISE_ORDER } from '@/core/constants'
import { sessionRepo } from '@/storage/sessionRepo'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import BrandBar from '@/components/pages/home/BrandBar.vue'
import ExerciseCard from '@/components/pages/home/ExerciseCard.vue'
import NavLink from '@/components/pages/home/NavLink.vue'

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

    <div class="exercises">
      <ExerciseCard
        v-for="exercise in EXERCISE_ORDER"
        :key="exercise"
        :exercise
        :session="sessions[exercise]"
      />
    </div>

    <nav class="nav">
      <NavLink :to="{ name: 'history' }" icon="history" label="HISTORY" />
    </nav>
  </ScreenFrame>
</template>

<style scoped>
.exercises {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.nav {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  margin-top: auto;
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-line-dark);
}
</style>
