# コーディング規約

PeakRM のコーディング・命名・テスト・ドキュメント表記の規約をここに集約する。実装前後で必ず参照する。技術スタック・仕様の詳細は `docs/spec.md` を、デザイントークンは `docs/design/README.md` を参照する。

## ディレクトリ構成

`src/` 配下は **責務で分割** する。各レイヤを共通ルールで分岐させる: **画面専用のものは各レイヤの `pages/<画面名>/` に置く**、**複数画面で使う横断的なものは各レイヤの共有バケツ（`shared/` など）に置く**。

```
src/
  core/                # 純ロジック（副作用なし・I/O なし・型・計算・ルール）※フラット
    types.ts  oneRm.ts  linearProgression.ts  session.ts  chartData.ts
  storage/             # 永続化（Dexie / IndexedDB・リポジトリ・persist・backup）※フラット
    db.ts  sessionRepo.ts  menuPresetRepo.ts  backup.ts
  composables/
    pages/<画面>/       # 画面専用に切り出した composable
    shared/
      session/         # useSession / useIntervalTimer（実行中セッションの状態系）
      platform/        # useWakeLock / useAudioCue（ブラウザ API glue）
  components/
    pages/<画面>/        # その画面専用のコンポーネント
    shared/
      ui/              # デザインプリミティブ（汎用・presentational・ドメイン非依存）
      *.vue            # 横断のアプリ固有複合（ConfirmDialog.vue / SetEditModal.vue など）
  pages/<画面>/index.vue # 画面エントリ（Nuxt 風の index.vue 命名。ファイルベースルーティングではない）
  router/index.ts        # vue-router のルート定義
  styles/  tokens.css  global.css
```

- **画面ディレクトリ名**: `home` / `menu` / `training` / `interval` / `result` / `history` / `settings`
- **`core/` と `storage/` の分離**: `core/` は副作用を持たない純関数（純粋ユニットテストで完結）。`storage/` は IndexedDB という外部世界に触る層。依存方向は **`storage → core` の一方向**で、`core/` から `storage/` を import しない。これにより業務ルール（1RM 計算・progression）が永続化技術から独立する。
- **`components/shared/ui/`** はデザインシステムのプリミティブ専用。プリミティブを組み合わせた横断複合コンポーネントは `components/shared/` 直下に置く。
- **状態管理**: Pinia は導入しない。共有が必要な状態（実行中セッション）は composable（`createSession()`）の単一インスタンスを App ルートで `provide` し、子孫が `inject` で共有する。依存リポジトリは composable の引数で注入する。

`@/` alias の見え方の例: `@/core/oneRm`、`@/storage/sessionRepo`、`@/composables/shared/session/useSession`、`@/components/shared/ui/PrimaryButton.vue`、`@/pages/home/index.vue`。

## ファイル命名

- **Vue コンポーネント**: PascalCase（`MenuSetup.vue`、`SessionResult.vue`）。Vue 公式スタイルガイド準拠
- **TypeScript ロジック・composable**: camelCase（`oneRm.ts`、`useSession.ts`）
- **テストファイル**: テスト対象と同じ命名 ＋ `.spec.ts`（`oneRm.ts` → `oneRm.spec.ts`）
- **Story ファイル**: 対象コンポーネントと同じ命名 ＋ `.stories.ts`（`SampleButton.vue` → `SampleButton.stories.ts`）
- **設定ファイル（プロジェクトルート）**: ツール慣習に従う（`vite.config.ts`、`eslint.config.js`、`.prettierrc.json`）

## import

- `src/` 配下のモジュールを参照するときは alias `@/` の絶対パスを使う（`import x from '@/core/oneRm'`）
- 同階層であっても相対パス（`./`、`../`）は使わない。`vite.config.ts` の `resolve.alias` と `tsconfig.json` の `paths` に `@/* → src/*` を定義済み
- サードパーティパッケージは通常どおりパッケージ名で import する

## テスト

Vitest を projects 構成で動かし、ロジック層の単体テスト（`unit` project、`happy-dom`）と、Storybook の play 関数によるコンポーネントのインタラクションテスト（`storybook` project、`@storybook/addon-vitest` + **headless Chromium**）の両方を実行する。`npm test` で両 project が走る。ロジックとコンポーネントで役割を分担し、同じ振る舞いを両方で書かない。

### 配置

テスト対象のソースと同じディレクトリに co-located で置く（例: `src/core/oneRm.ts` の隣に `src/core/oneRm.spec.ts`）。`tests/` のような分離ディレクトリは使わない。Vitest は `src/**/*.spec.ts` を拾う。

### スタイル

- ファイル内は `describe(対象モジュール名 or 文脈, () => { ... })` で常にグループ化する（テストが 1 本でも省略しない）
- テストケースは `it()` ではなく `test()` を使う
- `test()` の第 1 引数（テスト名）は日本語で書く

```ts
import { describe, expect, test } from 'vitest'

describe('oneRm', () => {
  test('ベンチプレスの 1RM を FWJ 換算式で計算する', () => {
    expect(estimateOneRm('benchPress', 100, 5)).toBe(112.5)
  })
})
```

### Storybook（コンポーネントの play 関数）

コンポーネントのインタラクションテストは Story の `play` 関数に書き、Vitest と役割を分担する。同じ振る舞いを両方で書かない。

`play` 関数は `@storybook/addon-vitest` の `storybookTest` プラグインが `.storybook/main.ts` の Story を自動でテスト化し、headless Chromium（Playwright）で実行する（`vitest.config.ts` の `storybook` project）。**Story を書けば自動でテスト対象になる**ため、play 用の spec を個別に書かない。実描画に依存する視覚的な差分検証は Chromatic（visual regression）が担う。

> Story から生成されるテスト名は Story の `export` 識別子（英語 PascalCase）由来になる。「テスト名は日本語」の原則に対する例外として許容する（Story 識別子は英語固定のため）。

- Story ファイルは対象コンポーネントと同じディレクトリに co-located で置く（`SampleButton.vue` の隣に `SampleButton.stories.ts`）
- `import { expect, userEvent, within } from 'storybook/test'`（Storybook v10 以降は `@storybook/test` ではなくスコープなしの `storybook/test` から import する）
- **Story の `export` 識別子は英語 PascalCase**（`IncrementsOnClick`）。Storybook が URL ・内部 ID に使うため日本語にしない。UI 表示名は Storybook が export 識別子から自動整形する（`IncrementsOnClick` → `Increments On Click`）
- Story の `play` 関数では Storybook の `expect` を使い、Vitest の `describe` / `test` は呼ばない
- **コンポーネント説明や argTypes を Docs タブに表示するには `meta.tags: ['autodocs']` を必ず付ける**。Storybook v10 はデフォルトで `docs.autodocs: 'tag'` モードで、付けないと Docs ページが生成されない
- **Chromatic の snapshot を消費しない Playground 系 story には `parameters: { chromatic: { disableSnapshot: true } }` を付ける**。引数を動かして見るだけの探索用 story は視覚差分の対象にせず、実機 UI として価値ある代表状態のみ snapshot を取る（無料枠 5,000/月 を守るため）。viewport（390px）・ブラウザ（Chrome のみ）は `.storybook/preview.ts` でグローバル設定済みなので個別指定は不要

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

初回のみ Story テスト用に Playwright の Chromium を取得する（`npx playwright install chromium`）。

```bash
npm test                # 全テストを 1 回実行（unit + Story の play 関数）
npm run test:storybook  # Story の play 関数のみ（storybook project）
npm run test:watch      # ファイル変更を監視して再実行
npm run storybook       # http://localhost:6006 で起動
npm run build-storybook # storybook-static/ に静的ビルド生成
```

## Git hooks

`husky` + `lint-staged` を導入し、commit 時に pre-commit フック（`.husky/pre-commit`）で品質チェックを自動実行する。`npm install`（`prepare: "husky"` script）でフックが有効化される。

- 実行順は `npx lint-staged` → `npm run typecheck` → `npm run test`。いずれか失敗で commit を中断する
- `lint-staged`（設定は `package.json`）は **変更ファイルのみ** 対象。`*.{ts,vue}` は ESLint `--fix` → Prettier `--write` を順に実行し、`*.{js,cjs,json,md,css,html}` は Prettier `--write`。glob を重複させると同一ファイルへ並行書き込みが起きるため、`ts` / `vue` は1エントリに配列でまとめて直列化する
- `typecheck` / `test` は **プロジェクト全体** を対象に実行する
- `npm run test` は `vitest run`（run モード）。watch にしないこと（フックが終了しなくなる）。Story の play 関数も `storybook` project（headless Chromium）として含まれるため、フックで一緒に検証される（初回 `npx playwright install chromium` が必要）
- フックは pre-commit に集約する。pre-push は設けない

## スタイル（CSS）

- Vue の **scoped CSS** を使う。Tailwind は使わない
- クラス名は **短く（`.title`、`.list`）**。BEM 記法（`app__title`）は使わない
- 値（色・タイポグラフィ・スペーシング）は `docs/design/README.md` のデザイントークンに厳密に従う

## PWA・静的アセット

- 静的アセット（PWA アイコン・favicon など）は `public/` に置き、ビルド時に `dist/` 直下へコピーする
- PWA アイコンは手書きせず `assets/icon-source.svg` を元に `@vite-pwa/assets-generator`（`minimal-2023` プリセット）で再生成する。生成した PNG / favicon を `public/` へ移して使う

## .gitignore

フラットな羅列ではなく、`# Dependencies`、`# Build outputs`、`# Test / coverage` のようなコメント見出しでセクション分けして記述する。

## ドキュメント表記

- **スラッシュ**: 半角 `/`（前後にスペース）。例: `Vitest / Storybook`
- **コロン**: 半角 `:`
- **句読点**: 全角（、。）
- **日本語文中の括弧**: 全角（）
- **コード・英字の括弧**: 半角 ()
