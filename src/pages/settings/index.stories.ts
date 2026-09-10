import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SettingsPage from '@/pages/settings/index.vue'
import { sessionInjectionKey, type SessionStore } from '@/composables/shared/session/useSession'
import { backupInjectionKey, type Backup, type ImportParseResult } from '@/storage/backup'
import { storybookRouter as router } from '@/stories/router'
import { makeBackup, makeSession, makeSessionStore } from '@/stories/session'

// 各 story 共通の loader。設定画面は route を読まないが、戻る導線が router に依存するため実ルートへ置く。
// Import の検証結果は fake が返すものが唯一のソースなので、story ごとに parsed を差し替える。
// session store は設定画面が描画しないが、Import の確定で破棄されることを Behavior が見る。
// 設定画面はホームからしか開けず、実行中セッションが残っている場合は必ず離脱後（終端済み）になる
function loadSettingsPage(parsed?: ImportParseResult) {
  return async () => {
    await router.push('/settings')
    const sessionStore = await makeSessionStore({ completedReps: [8] })
    sessionStore.leave()
    return { backup: makeBackup(parsed), sessionStore }
  }
}

// loader の戻りは型が失われるため、backup の取り出しとキャストをここに閉じる
function backupOf(loaded: Record<string, unknown>): Backup {
  return loaded.backup as Backup
}

function fileInputOf(canvasElement: HTMLElement): HTMLInputElement {
  const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('file input is not rendered')
  return input
}

type ExportResult = Awaited<ReturnType<Backup['createExport']>>

// createExport を任意のタイミングで解決させるため、resolve を外へ出した Promise を作る。
// 解決を止めている間が「書き出し中」なので、その間の再押下が捨てられることを ExportBehavior が見る
function makeDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
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
          '設定画面。データ操作（Export / Import）と Version 表示だけを置く（トレーニング挙動を変える設定は持たない）。Export は全セッションの envelope JSON をダウンロードし、完了時に件数とファイル名を AlertDialog で伝える。Import はファイルの検証を通ったあと件数の確認ダイアログを経て全データを置き換える。置換の確定ではメモリ上の実行中セッションも破棄する。検証エラーと置換完了はどちらも AlertDialog で伝える。データ源は provide された backup なので、stories は fake を provide して検証結果を再現する。',
      },
    },
  },
  decorators: [
    (_story, context) => ({
      setup() {
        provide(backupInjectionKey, backupOf(context.loaded))
        provide(sessionInjectionKey, context.loaded.sessionStore as SessionStore)
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

// 書き出し完了のモーダル。ImportFailed / ImportConfirm と同じく到達のための play だけを持ち、
// 件数とファイル名は fake（makeBackup）の既定値がそのまま出る
export const ExportDone: Story = {
  loaders: [loadSettingsPage()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }))
    await expect(await canvas.findByText('2 件のセッションを書き出しました')).toBeVisible()
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

// Export は行の押下から backup.createExport まで配線されていることと、書き出し中の再押下を
// 捨てること、完了モーダルを閉じたあとに再実行できることを見る（Blob の生成とダウンロード起動は
// DOM 側の責務で、headless では検証できない）
export const ExportBehavior: Story = {
  loaders: [
    async () => {
      const loaded = await loadSettingsPage()()
      const exportDeferred = makeDeferred<ExportResult>()
      const backup: Backup = { ...loaded.backup, createExport: fn(() => exportDeferred.promise) }
      return { ...loaded, backup, exportDeferred }
    },
  ],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const backup = backupOf(loaded)
    const exportDeferred = loaded.exportDeferred as ReturnType<typeof makeDeferred<ExportResult>>

    // createExport の await 中に 2 回目を押しても、ガードが効いていれば書き出しは 1 回しか走らない
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }))
    await expect(backup.createExport).toHaveBeenCalledOnce()

    // 件数とファイル名が createExport の戻り値から配線されていることを見るため、実装に文言を
    // 直書きしても通らない値（ExportDone が出す既定値の 2 件とも別の値）で解決し、同じ変数から文言を組む
    const exportResult = { fileName: 'peak-rm-export-2026-01-31.json', json: '{}', count: 7 }
    exportDeferred.resolve(exportResult)
    const dialog = within(
      await canvas.findByRole('dialog', {
        name: `${exportResult.count} 件のセッションを書き出しました`,
      }),
    )
    await expect(dialog.getByText(exportResult.fileName)).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: '閉じる' }))
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()

    // 完了のあとも Export を再開できる（exportData がガードを解いている）
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }))
    await expect(backup.createExport).toHaveBeenCalledTimes(2)
  },
}

// ファイル選択 → 件数の確認 → 確定で置換 → 完了モーダル、キャンセルでは
// 置換しない配線を確認する（検証そのものは backup.spec、ダイアログの emit は
// ConfirmDialog / AlertDialog の story が担う）
export const Behavior: Story = {
  loaders: [loadSettingsPage({ ok: true, sessions: importedSessions })],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const backup = backupOf(loaded)
    const store = loaded.sessionStore as SessionStore

    // 見出しがセクションのアクセシブルネームに配線されている
    await expect(canvas.getByRole('region', { name: 'DATA' })).toBeVisible()
    await expect(canvas.getByRole('region', { name: 'ABOUT' })).toBeVisible()
    // MIME が割り当てられない環境でも Export ファイルを選べるよう拡張子も持たせている
    await expect(fileInputOf(canvasElement)).toHaveAttribute('accept', 'application/json,.json')

    // 読み取りの await 中はまだ確認ダイアログが無く Import 行が生きている。ここで 2 回目を
    // 投げても、直列化のガードが効いていれば検証は 1 回しか走らない
    await selectFile(canvasElement)
    await selectFile(canvasElement)

    // ファイルの読み取りが非同期なので、ダイアログは findBy で待つ。検証の呼び出し回数は
    // 読み取り完了後にしか確定しないため、ダイアログを待ってから見る
    await expect(await canvas.findByText('2 件のセッションを置き換えますか？')).toBeVisible()
    await expect(backup.parseImport).toHaveBeenCalledOnce()
    // 選んだファイルの本文がそのまま検証へ渡っている
    await expect(backup.parseImport).toHaveBeenCalledWith('{}')
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
    // 確定でも確認ダイアログは閉じる（完了モーダルの裏に残さない）
    await expect(canvas.queryByText('2 件のセッションを置き換えますか？')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: '閉じる' }))
    await expect(canvas.queryByText('2 件のセッションを読み込みました')).not.toBeInTheDocument()

    // 置換完了のあとも Import を再開できる（confirmImport が直列化のロックを解いている）
    await selectFile(canvasElement)
    await expect(backup.parseImport).toHaveBeenCalledTimes(3)
  },
}
