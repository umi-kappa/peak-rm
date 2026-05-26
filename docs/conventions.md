# コーディング規約

PeakRM のコーディング・命名・テスト・ドキュメント表記の規約をここに集約する。実装前後で必ず参照する。技術スタック・仕様の詳細は `docs/spec.md` を、デザイントークンは `docs/design/README.md` を参照する。

## ファイル命名

- **Vue コンポーネント**: PascalCase（`MenuSetup.vue`、`SessionResult.vue`）。Vue 公式スタイルガイド準拠
- **TypeScript ロジック・composable・store**: camelCase（`oneRm.ts`、`useSession.ts`、`menuStore.ts`）
- **テストファイル**: テスト対象と同じ命名 ＋ `.spec.ts`（`oneRm.ts` → `oneRm.spec.ts`）
- **設定ファイル（プロジェクトルート）**: ツール慣習に従う（`vite.config.ts`、`eslint.config.js`、`.prettierrc.json`）

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

### コマンド

```bash
npm test           # 全テストを 1 回実行
npm run test:watch # ファイル変更を監視して再実行
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
