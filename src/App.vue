<script setup lang="ts">
import { RouterView } from 'vue-router'

import { fatalErrorInjectionKey } from '@/composables/shared/error/useFatalError'
import { injectRequired } from '@/composables/shared/inject/injectRequired'
import { sessionLeaveConfirmInjectionKey } from '@/composables/shared/session/useSessionLeaveConfirm'
import ErrorScreen from '@/components/app/ErrorScreen.vue'
import ConfirmDialog from '@/components/shared/ui/dialog/ConfirmDialog.vue'

// main.ts（境界の 4 配線）が app.provide 済み。error は境界が報告した想定外エラーで、
// 発生後はアプリ全体をエラー画面に置き換え、事実と違う表示・記録の続行をさせない。復帰導線はページ再読み込みのみ
const { error } = injectRequired(fatalErrorInjectionKey)

// router の離脱確認ガード（component tree の外）が開いた問い合わせをここで描く。
// トレーニング中・インターバル中に戻るで離脱すると中断が確定するため、確認を挟む（spec「セッションフローからの離脱」）
const {
  pending: leavePending,
  confirm: confirmLeave,
  cancel: cancelLeave,
} = injectRequired(sessionLeaveConfirmInjectionKey)

// 再読み込み後は router の起動時ガード（新規ロードは常にホーム起動）でホームへ復帰する
function reload() {
  window.location.reload()
}
</script>

<template>
  <ErrorScreen v-if="error" :message="error.message" @reload="reload" />
  <template v-else>
    <RouterView />
    <ConfirmDialog
      v-if="leavePending"
      title="トレーニングを中断しますか？"
      message="完了したセットは中断として履歴に残り、ホームへ戻ります。"
      confirm-label="中断する"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </template>
</template>
