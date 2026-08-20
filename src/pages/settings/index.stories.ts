import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import SettingsPage from '@/pages/settings/index.vue'
import { backupInjectionKey, type Backup, type ImportParseResult } from '@/storage/backup'
import { storybookRouter as router } from '@/stories/router'
import { makeBackup, makeSession } from '@/stories/session'

// 各 story 共通の loader。設定画面は route を読まないが、戻る導線が router に依存するため実ルートへ置く。
// Import の検証結果は fake が返すものが唯一のソースなので、story ごとに parsed を差し替える
function loadSettingsPage(parsed?: ImportParseResult) {
  return async () => {
    await router.push('/settings')
    return { backup: makeBackup(parsed) }
  }
}

// loader の戻りは型が失われるため、取り出しとキャストをここ 1 箇所に閉じる
function backupOf(loaded: Record<string, unknown>): Backup {
  return loaded.backup as Backup
}

// ファイル選択のダイアログは開けないため、hidden な input へ直接ファイルを渡して change を起こす。
// 中身は fake の parseImport が無視するため、形式だけ整えた JSON でよい
function selectFile(canvasElement: HTMLElement) {
  const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('file input is not rendered')
  const file = new File(['{}'], 'peak-rm-export-2026-05-12.json', { type: 'application/json' })
  return userEvent.upload(input, file)
}

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

// 検証に失敗したファイルを選んだ状態。理由を添えたモーダルを出し、置換は行わない
export const ImportFailed: Story = {
  loaders: [loadSettingsPage({ ok: false, message: 'schemaVersion が 1 ではありません' })],
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await selectFile(canvasElement)

    // ファイルの読み取りが非同期なので、結果のモーダルは findBy で待つ
    await expect(await canvas.findByText('読み込みに失敗しました')).toBeVisible()
    await expect(canvas.getByText('schemaVersion が 1 ではありません')).toBeVisible()
    await expect(backupOf(loaded).replaceAll).not.toHaveBeenCalled()
  },
}

// ファイル選択 → 件数の確認 → 確定で置換 → 完了モーダル、キャンセルでは置換しない配線を確認する
// （検証そのものは backup.spec、ダイアログの emit は ConfirmDialog / AlertDialog の story が担う）
export const Behavior: Story = {
  loaders: [
    loadSettingsPage({
      ok: true,
      sessions: [makeSession('benchPress', 82.5, [8, 8, 8]), makeSession('squat', 100, [8, 8, 8])],
    }),
  ],
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const backup = backupOf(loaded)

    await selectFile(canvasElement)
    // ファイルの読み取りが非同期なので、ダイアログは findBy で待つ
    await expect(await canvas.findByText('2 件のセッションを置き換えますか？')).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'キャンセル' }))
    await expect(backup.replaceAll).not.toHaveBeenCalled()

    // 同じファイルを選び直せる（input の選択をリセットしている）ことも同時に確認する
    await selectFile(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: '置き換える' }))

    await expect(await canvas.findByText('2 件のセッションを読み込みました')).toBeVisible()
    await expect(backup.replaceAll).toHaveBeenCalledOnce()

    await userEvent.click(canvas.getByRole('button', { name: '閉じる' }))
    await expect(canvas.queryByText('2 件のセッションを読み込みました')).not.toBeInTheDocument()
  },
}
