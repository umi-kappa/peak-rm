# コーディング規約

PeakRM のコーディング・命名・テスト・ドキュメント表記の規約をここに集約する。実装前後で必ず参照する。技術スタック・仕様の詳細は `docs/spec.md` を、デザイントークンは `docs/design/README.md` を参照する。

## ファイル命名

- **Vue コンポーネント**: PascalCase（`MenuSetup.vue`、`SessionResult.vue`）。Vue 公式スタイルガイド準拠
- **TypeScript ロジック・composable・store**: camelCase（`oneRm.ts`、`useSession.ts`、`menuStore.ts`）
- **テストファイル**: テスト対象と同じ命名 ＋ `.spec.ts`（`oneRm.ts` → `oneRm.spec.ts`）
- **Story ファイル**: 対象コンポーネントと同じ命名 ＋ `.stories.ts`（`SampleButton.vue` → `SampleButton.stories.ts`）
- **設定ファイル（プロジェクトルート）**: ツール慣習に従う（`vite.config.ts`、`eslint.config.js`、`.prettierrc.json`）

## import

- `src/` 配下のモジュールを参照するときは alias `@/` の絶対パスを使う（`import x from '@/lib/oneRm'`）
- 同階層であっても相対パス（`./`、`../`）は使わない。`vite.config.ts` の `resolve.alias` と `tsconfig.json` の `paths` に `@/* → src/*` を定義済み
- サードパーティパッケージは通常どおりパッケージ名で import する

## テスト

Vitest（`node` 環境）でロジック層の単体テストを実行する。コンポーネントのインタラクションテストは Storybook の play 関数 + test runner で扱い、同じ振る舞いを両方で書かない。

### 配置

テスト対象のソースと同じディレクトリに co-located で置く（例: `src/lib/oneRm.ts` の隣に `src/lib/oneRm.spec.ts`）。`tests/` のような分離ディレクトリは使わない。Vitest は `src/**/*.spec.ts` を拾う。

### スタイル

- ファイル内は `describe(対象モジュール名 or 文脈, () => { ... })` で常にグループ化する（テストが 1 本でも省略しない）
- テストケースは `it()` ではなく `test()` を使う
- `test()` の第 1 引数（テスト名）は日本語で書く

```ts
import { describe, expect, test } from 'vitest'

describe('oneRm', () => {
  test('ベンチプレスの 1RM を FWJ 換算式で計算する', () => {
    expect(estimateOneRm('bench', 100, 5)).toBe(112.5)
  })
})
```

### Storybook（コンポーネントの play 関数）

コンポーネントのインタラクションテストは Story の `play` 関数に書き、Vitest と役割を分担する。同じ振る舞いを両方で書かない。

- Story ファイルは対象コンポーネントと同じディレクトリに co-located で置く（`SampleButton.vue` の隣に `SampleButton.stories.ts`）
- `import { expect, userEvent, within } from 'storybook/test'`（Storybook v10 以降は `@storybook/test` ではなくスコープなしの `storybook/test` から import する）
- **Story の `export` 識別子は英語 PascalCase**（`IncrementsOnClick`）。Storybook が URL ・内部 ID に使うため日本語にしない。UI 表示名は Storybook が export 識別子から自動整形する（`IncrementsOnClick` → `Increments On Click`）
- Story の `play` 関数では Storybook の `expect` を使い、Vitest の `describe` / `test` は呼ばない
- **コンポーネント説明や argTypes を Docs タブに表示するには `meta.tags: ['autodocs']` を必ず付ける**。Storybook v10 はデフォルトで `docs.autodocs: 'tag'` モードで、付けないと Docs ページが生成されない

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import SampleButton from '@/components/SampleButton.vue'

const meta: Meta<typeof SampleButton> = { component: SampleButton }
export default meta

type Story = StoryObj<typeof SampleButton>

export const IncrementsOnClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    await expect(button).toHaveTextContent('0')
    await userEvent.click(button)
    await expect(button).toHaveTextContent('1')
  },
}
```

### コマンド

```bash
npm test                # 全テストを 1 回実行
npm run test:watch      # ファイル変更を監視して再実行
npm run storybook       # http://localhost:6006 で起動
npm run build-storybook # storybook-static/ に静的ビルド生成
npm run test-storybook  # storybook 起動中に play 関数を実行（初回 npx playwright install chromium）
```

## スタイル（CSS）

- Vue の **scoped CSS** を使う。Tailwind は使わない
- クラス名は **短く（`.title`、`.list`）**。BEM 記法（`app__title`）は使わない
- 値（色・タイポグラフィ・スペーシング）は `docs/design/README.md` のデザイントークンに厳密に従う

## .gitignore

フラットな羅列ではなく、`# Dependencies`、`# Build outputs`、`# Test / coverage` のようなコメント見出しでセクション分けして記述する。

## ドキュメント表記

- **スラッシュ**: 半角 `/`（前後にスペース）。例: `Vitest / Storybook`
- **コロン**: 半角 `:`
- **句読点**: 全角（、。）
- **日本語文中の括弧**: 全角（）
- **コード・英字の括弧**: 半角 ()
