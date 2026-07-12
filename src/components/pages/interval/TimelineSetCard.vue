<script setup lang="ts">
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'
import BaseUnit from '@/components/shared/ui/base/BaseUnit.vue'

const { setNumber, state, targetReps, actualReps, memo } = defineProps<{
  /** 1 始まりのセット番号 */
  setNumber: number
  /** カードの状態。完了済み results との対応はページ側で算出して渡す */
  state: 'done' | 'next' | 'pending'
  /** メニューの目標回数。next / pending で表示する */
  targetReps: number
  /** 実績回数。done で表示する。next / pending は実績自体が無いので undefined を明示的に渡す */
  actualReps: number | undefined
  /** セットメモ。未入力はデータモデルの初期値と同じ ""。next / pending は undefined を明示的に渡す */
  memo: string | undefined
}>()

const emit = defineEmits<{
  /** 完了セットのカードのタップ。ページ側がセット編集モーダルを開く（spec「セット編集モーダル」） */
  edit: []
}>()

// 編集対象は完了セットのみ（done だけ <button> で描画する）。next / pending のタップは何もしない
function onClick() {
  if (state === 'done') emit('edit')
}
</script>

<template>
  <component
    :is="state === 'done' ? 'button' : 'div'"
    :type="state === 'done' ? 'button' : undefined"
    class="timeline-set-card"
    :class="state"
    @click="onClick"
  >
    <div class="line">
      <span class="number">{{ setNumber }}</span>
      <template v-if="state === 'done'">
        <span class="reps">{{ actualReps }}</span>
        <BaseUnit>REPS</BaseUnit>
      </template>
      <template v-else>
        <span v-if="state === 'next'" class="next-label">NEXT</span>
        <span class="target">{{ targetReps }}</span>
        <BaseUnit>REPS</BaseUnit>
      </template>
    </div>
    <!-- メモ未入力の完了セットは ADD NOTE で入力を促す（spec「セットメモ」。インターバル画面のみの表現） -->
    <div v-if="state === 'done'" class="memo">
      <BaseIcon class="memo-icon" name="file-text" :size="12" />
      <span v-if="memo" class="memo-text">{{ memo }}</span>
      <span v-else class="memo-prompt">ADD NOTE</span>
    </div>
  </component>
</template>

<style scoped>
.timeline-set-card {
  width: 100%;
  padding: var(--space-16);
  background: var(--color-bg-light);
  border: 1px solid var(--color-line-dark);
  border-radius: var(--radius);
  /* done は <button> になるため、UA 既定の色と text-align: center を打ち消す */
  color: inherit;
  text-align: left;
  transition: background-color var(--transition);

  &.done:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* タップ可能な done カードの hover / active は CardButton（ExerciseCard）と同じ背景変化で揃える */
  @media (hover: hover) {
    &.done:hover {
      background-color: var(--color-line-dark);
    }
  }

  /* media query の外に置き、hover を持たないタッチでも押下フィードバックを返す */
  &.done:active {
    background-color: var(--color-line-dark);
  }

  &.next {
    border-color: var(--color-accent);

    .number {
      color: var(--color-accent);
    }

    .target {
      color: var(--color-text);
    }
  }

  &.pending {
    opacity: 0.55;

    .number {
      color: var(--color-text-tertiary);
    }
  }
}

.line {
  display: flex;
  align-items: baseline;
  gap: var(--space-12);
}

/* 行内テキストは mono で統一し、数値 3 種はさらに桁揃え + bold を共有する */
.number,
.next-label,
.reps,
.target {
  font-family: var(--font-family-mono);
}

.number,
.reps,
.target {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
}

/* 行内テキストのベースライン揃えには参加せず、行の高さに対して上下センターに置く */
.number {
  align-self: center;
  min-width: 20px;
  color: var(--color-text-secondary);
  text-align: center;
}

.reps {
  color: var(--color-text);
  font-size: var(--font-size-title);
}

/* .number と同じく、ベースライン揃えに参加せず上下センターに置く */
.next-label {
  align-self: center;
  color: var(--color-accent);
  font-size: var(--font-size-caption);
}

/* 未実施セットは目標回数を右端に寄せる（実績の桁と揃えず「まだ予定」であることを示す） */
.target {
  margin-left: auto;
  color: var(--color-text-tertiary);
}

/* セット番号カラム（20px + gap 12px）の分だけ字下げして本文に揃える。
   アイコンは複数行メモでも 1 行目に留めるため上揃えにする */
.memo {
  display: flex;
  align-items: flex-start;
  gap: var(--space-8);
  margin-top: var(--space-8);
  padding-left: var(--space-32);
  color: var(--color-text-secondary);
}

/* caption の行ボックス（12px × 1.4 ≒ 17px）の 1 行目にアイコン（12px）を光学的にセンタリングする */
.memo-icon {
  margin-top: var(--space-2);
}

.memo-text,
.memo-prompt {
  font-size: var(--font-size-caption);
}

.memo-text {
  color: var(--color-text);
}

/* 文字色は .memo の secondary をそのまま継承する */
.memo-prompt {
  border-bottom: 1px dashed var(--color-text-tertiary);
}
</style>
