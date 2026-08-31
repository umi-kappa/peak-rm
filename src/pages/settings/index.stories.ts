import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import SettingsPage from '@/pages/settings/index.vue'
import { sessionInjectionKey, type SessionStore } from '@/composables/shared/session/useSession'
import { backupInjectionKey, type Backup, type ImportParseResult } from '@/storage/backup'
import { storybookRouter as router } from '@/stories/router'
import { makeBackup, makeSession, makeSessionStore } from '@/stories/session'

// 各 story 共通の loader。設定画面は route を読まないが、戻る導線が router に依存するため実ルートへ置く。
// Import の検証結果は fake が返すものが唯一のソースなので、story ごとに parsed を差し替える。
// session store は設定画面が描画しないが、Import の確定で破棄されることを Behavior が見る
function loadSettingsPage(parsed?: ImportParseResult) {
  return async () => {
    await router.push('/settings')
    return { backup: makeBackup(parsed), sessionStore: await makeSessionStore({}) }
  }
}

// loader の戻りは型が失われるため、取り出しとキャストをここに閉じる
function backupOf(loaded: Record<string, unknown>): Backup {
  return loaded.backup as Backup
}

function sessionStoreOf(loaded: Record<string, unknown>): SessionStore {
  return loaded.sessionStore as SessionStore
}

function fileInputOf(canvasElement: HTMLElement): HTMLInputElement {
  const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('file input is not rendered')
  return input
}

// 選び直しの検証に使うため、全 story で同一インスタンスを使い回す。userEvent.upload は
// input.files との参照一致で変化を判定するので、画面が input.value を空へ戻していなければ
// 2 回目の change が発火せず、その退行が Behavior で落ちる
const importFile = new File(['{}'], 'peak-rm-export-2026-05-12.json', { type: 'application/json' })

// ファイル選択のダイアログは開けないため、hidden な input へ直接ファイルを渡して change を起こす。
// 中身は fake の parseImport が無視するため、形式だけ整えた JSON でよい
function selectFile(canvasElement: HTMLElement) {
  return userEvent.upload(fileInputOf(canvasElement), importFile)
}

const importedSessions = [
  makeSession('benchPress', 82.5, [8, 8, 8]),
  makeSession('squat', 100, [8, 8, 8]),
]

const meta: Meta<typeof SettingsPage> = {
  component: SettingsPage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '設定画面。データ操作（Export / Import）と Version 表示だけを置く（トレーニング挙動を変える設定は持たない）。Export は全セッションの envelope JSON をダウンロードし、Import はファイルの検証を通ったあと件数の確認ダイアログを経て全データを置き換える。検証エラーと置換完了はどちらも AlertDialog で伝える。データ源は provide された backup なので、stories は fake を provide して検証結果を再現する。',
      },
    },
  },
  decorators: [
    (_story, context) => ({
      setup() {
        provide(backupInjectionKey, backupOf(context.loaded))
        provide(sessionInjectionKey, sessionStoreOf(context.loaded))
      },
      template: '<story />',
    }),
  ],
}

export default meta

type Story = StoryObj<typeof SettingsPage>

// 標準状態。Data（Export / Import）と About（Version）の 2 セクションが並ぶ
export const Default: Story = {
  loaders: [loadSettingsPage()],
}

// 検証に失敗したファイルを選んだ状態。この見た目は内部状態でしか到達できないため play で
// 到達させるが、振る舞いの assert は ImportFailedBehavior が持つ（ここは視覚回帰専用）
export const ImportFailed: Story = {
  loaders: [loadSettingsPage({ ok: false, message: 'schemaVersion が 1 ではありません' })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await selectFile(canvasElement)
    // ファイルの読み取りが非同期なので、結果のモーダルは findBy で待つ
    await expect(await canvas.findByText('読み込みに失敗しました')).toBeVisible()
  },
}

// 置換前の確認ダイアログ。破壊的操作の警告文と確定ラベルを Chromatic に残すための状態で、
// ImportFailed と同じく到達のための play だけを持つ
export const ImportConfirm: Story = {
  loaders: [loadSettingsPage({ ok: true, sessions: importedSessions })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await selectFile(canvasElement)
    await expect(await canvas.findByText('2 件のセッションを置き換えますか？')).toBeVisible()
  },
}

// 検証エラー時は理由を伝えるだけで DB に触らない配線を確認する
export const ImportFailedBehavior: Story = {
  loaders: [loadSettingsPage({ ok: false, message: 'schemaVersion が 1 ではありません' })],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const backup = backupOf(loaded)

    await selectFile(canvasElement)

    await expect(await canvas.findByText('読み込みに失敗しました')).toBeVisible()
    await expect(canvas.getByText('schemaVersion が 1 ではありません')).toBeVisible()
    await expect(backup.replaceAll).not.toHaveBeenCalled()

    // 検証エラーのあとも Import を再開できる（prepareImport が直列化のロックを解いている）
    await userEvent.click(canvas.getByRole('button', { name: '閉じる' }))
    await selectFile(canvasElement)
    await expect(await canvas.findByText('読み込みに失敗しました')).toBeVisible()
    await expect(backup.parseImport).toHaveBeenCalledTimes(2)
  },
}

// Export の呼び出し、ファイル選択 → 件数の確認 → 確定で置換 → 完了モーダル、キャンセルでは
// 置換しない配線を確認する（検証そのものは backup.spec、ダイアログの emit は
// ConfirmDialog / AlertDialog の story が担う）
export const Behavior: Story = {
  loaders: [loadSettingsPage({ ok: true, sessions: importedSessions })],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const backup = backupOf(loaded)
    const store = sessionStoreOf(loaded)

    // 見出しがセクションのアクセシブルネームに配線されている
    await expect(canvas.getByRole('region', { name: 'DATA' })).toBeVisible()
    // MIME が割り当てられない環境でも Export ファイルを選べるよう拡張子も持たせている
    await expect(fileInputOf(canvasElement)).toHaveAttribute('accept', 'application/json,.json')

    // Export は行の押下から backup.createExport まで配線されていることだけを見る
    // （Blob の生成とダウンロード起動は DOM 側の責務で、headless では検証できない）
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }))
    await expect(backup.createExport).toHaveBeenCalledOnce()

    // 読み取りの await 中はまだ確認ダイアログが無く Import 行が生きている。ここで 2 回目を
    // 投げても、直列化のガードが効いていれば検証は 1 回しか走らない
    await selectFile(canvasElement)
    await selectFile(canvasElement)
    await expect(backup.parseImport).toHaveBeenCalledOnce()
    // 選んだファイルの本文がそのまま検証へ渡っている
    await expect(backup.parseImport).toHaveBeenCalledWith('{}')

    // ファイルの読み取りが非同期なので、ダイアログは findBy で待つ
    await expect(await canvas.findByText('2 件のセッションを置き換えますか？')).toBeVisible()
    await expect(
      canvas.getByText('現在の記録はすべて消え、ファイルの内容に置き換わります。'),
    ).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'キャンセル' }))
    await expect(backup.replaceAll).not.toHaveBeenCalled()
    await expect(canvas.queryByText('2 件のセッションを置き換えますか？')).not.toBeInTheDocument()

    // 同じファイルを選び直せる（input の選択をリセットしている）ことも同時に確認する
    await selectFile(canvasElement)
    await expect(store.session.value).toBeDefined()
    await userEvent.click(await canvas.findByRole('button', { name: '置き換える' }))

    await expect(await canvas.findByText('2 件のセッションを読み込みました')).toBeVisible()
    await expect(backup.replaceAll).toHaveBeenCalledOnce()
    // 置換の確定でメモリ上の実行中セッションも捨てている
    await expect(store.session.value).toBeUndefined()

    await userEvent.click(canvas.getByRole('button', { name: '閉じる' }))
    await expect(canvas.queryByText('2 件のセッションを読み込みました')).not.toBeInTheDocument()

    // 置換完了のあとも Import を再開できる（confirmImport が直列化のロックを解いている）
    await selectFile(canvasElement)
    await expect(backup.parseImport).toHaveBeenCalledTimes(3)
  },
}
