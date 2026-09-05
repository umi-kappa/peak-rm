<script setup lang="ts">
import { ref, shallowRef, useTemplateRef } from 'vue'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import { sessionInjectionKey } from '@/composables/shared/session/useSession'
import { injectRequired } from '@/composables/shared/inject/injectRequired'
import { backupInjectionKey } from '@/storage/backup'
import type { Session } from '@/core/types'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseCard from '@/components/shared/ui/base/BaseCard.vue'
import BaseIcon from '@/components/shared/ui/base/BaseIcon.vue'
import BaseLabel from '@/components/shared/ui/base/BaseLabel.vue'
import CardButton from '@/components/shared/ui/buttons/CardButton.vue'
import AlertDialog from '@/components/shared/ui/dialog/AlertDialog.vue'
import ConfirmDialog from '@/components/shared/ui/dialog/ConfirmDialog.vue'

type Notice = { title: string; message?: string }

const { goBack } = useBackNavigation()

const backup = injectRequired(backupInjectionKey)
const session = injectRequired(sessionInjectionKey)

const version = import.meta.env.VITE_APP_VERSION

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

// 検証を通った置換対象。確認ダイアログの表示条件も兼ねる。
// deep proxy のまま Dexie へ渡すと structured clone が壊れるため shallowRef で持つ
const pendingSessions = shallowRef<Session[]>()

// Import の結果（検証エラー / 置換完了）を伝えるモーダルの内容。表示条件も兼ねる
const notice = ref<Notice>()

// ファイルの読み取り開始から置換完了までを 1 本に直列化する。読み取りの await 中はまだ
// 確認ダイアログが無く Import 行が生きているため、ガードが無いと後着した検証結果が
// 表示中のダイアログの件数と置換対象を裏で差し替える
const importing = ref(false)

async function exportData() {
  const { fileName, json } = await backup.createExport()
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  // Safari は DOM に無い anchor の click を無視することがあるため、一度挿入してから押す
  document.body.append(link)
  link.click()
  link.remove()
  // ダウンロード開始前に revoke するとブラウザが転送を取り消すため、転送が始まるまで待って解放する
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function openFilePicker() {
  // 置換中はピッカーを開かない。開いても prepareImport のガードで捨てられるため、
  // ファイルを選ばせてから無視するより押せない方が正直
  if (importing.value) return
  fileInput.value?.click()
}

async function prepareImport() {
  const input = fileInput.value
  if (!input) return

  const file = input.files?.[0]
  // 同じファイルを選び直しても change が発火するよう、読み取り前に選択を空へ戻す
  input.value = ''
  if (!file || importing.value) return
  // 読み取りの失敗は境界へ流れページごと unmount されるため、その経路では戻さない
  importing.value = true

  const parsed = backup.parseImport(await file.text())
  if (!parsed.ok) {
    notice.value = { title: '読み込みに失敗しました', message: parsed.message }
    importing.value = false
    return
  }
  // 確認ダイアログを出している間は握り続け、confirmImport / cancelImport が解く
  pendingSessions.value = parsed.sessions
}

async function confirmImport() {
  const sessions = pendingSessions.value
  if (!sessions) return
  pendingSessions.value = undefined
  // 置換の失敗も読み取りと同じく境界へ流れページごと unmount されるため、その経路では戻さない
  await backup.replaceAll(sessions)
  session.discard()
  notice.value = { title: `${sessions.length} 件のセッションを読み込みました` }
  importing.value = false
}

function cancelImport() {
  pendingSessions.value = undefined
  importing.value = false
}

function dismissNotice() {
  notice.value = undefined
}
</script>

<template>
  <ScreenFrame>
    <template #header>
      <AppBar title="SETTINGS" @back="goBack" />
    </template>

    <section class="section" aria-labelledby="settings-data-label">
      <div class="intro">
        <BaseLabel id="settings-data-label">DATA</BaseLabel>
        <p class="description">Back up all sessions to a single file, or restore from one.</p>
      </div>

      <div class="rows">
        <CardButton @click="exportData">
          <div class="row">
            <span>Export</span>
            <BaseIcon name="download" class="icon" />
          </div>
        </CardButton>
        <CardButton @click="openFilePicker">
          <div class="row">
            <span>Import</span>
            <BaseIcon name="upload" class="icon" />
          </div>
        </CardButton>
      </div>

      <!-- Import 行から click() で開く。ファイル選択そのものはブラウザの UI が担う -->
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        hidden
        @change="prepareImport"
      />
    </section>

    <section class="section" aria-labelledby="settings-about-label">
      <BaseLabel id="settings-about-label">ABOUT</BaseLabel>
      <BaseCard>
        <div class="row">
          <span>Version</span>
          <span class="version">{{ version }}</span>
        </div>
      </BaseCard>
    </section>

    <ConfirmDialog
      v-if="pendingSessions"
      :title="`${pendingSessions.length} 件のセッションを置き換えますか？`"
      message="現在の記録はすべて消え、ファイルの内容に置き換わります。"
      confirm-label="置き換える"
      @confirm="confirmImport"
      @cancel="cancelImport"
    />

    <AlertDialog
      v-if="notice"
      :title="notice.title"
      :message="notice.message"
      @close="dismissNotice"
    />
  </ScreenFrame>
</template>

<style scoped>
/* セクション内の間隔はデザインの ScreenBody と同じ 20。行同士だけ 12 で詰める */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.intro {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.description {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-caption);
  /* 2 行以上に折り返す唯一の説明文なので、ここだけ行間を広げる（design README「Line Height」の例外） */
  line-height: 1.5;
}

/* 設定行。左にラベル、右にアイコン / 値を置く（反復要素ではないので ul にしない） */
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
}

.icon,
.version {
  color: var(--color-text-secondary);
}

.version {
  font-family: var(--font-family-mono);
  font-variant-numeric: tabular-nums;
}
</style>
