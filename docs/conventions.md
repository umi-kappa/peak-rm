# コーディング規約

PeakRM のコーディング・命名・テスト・ドキュメント表記の規約をここに集約する。実装前後で必ず参照する。技術スタック・仕様の詳細は `docs/spec.md` を、デザイントークンは `docs/design/README.md` を参照する。

## ディレクトリ構成

`src/` 配下は **責務で分割** する。各レイヤを共通ルールで分岐させる: **画面専用のものは各レイヤの `pages/<画面名>/` に置く**、**複数画面で使う横断的なものは各レイヤの共有バケツ（`shared/` など）に置く**。

```
src/
  core/                # 純ロジック（副作用なし・I/O なし・型・計算・ルール）※フラット
    types.ts  oneRm.ts  linearProgression.ts  stepper.ts  session.ts  sessionHistory.ts  chartData.ts
  storage/             # 永続化（Dexie / IndexedDB・リポジトリ・persist・backup）※フラット
    db.ts  sessionRepo.ts  menuPresetRepo.ts  backup.ts
  composables/
    pages/<画面>/       # 画面専用に切り出した composable
    shared/
      session/         # useSession / useIntervalTimer（実行中セッションの状態系）
      platform/        # useWakeLock / useAudioCue（ブラウザ API glue）
      inputs/          # useStepper（入力部品のブラウザ glue・長押しリピート等）
  components/
    pages/<画面>/        # その画面専用のコンポーネント（例: menu/WeightStepper.vue）
    shared/
      ui/              # デザインプリミティブ（汎用・presentational・ドメイン非依存）※カテゴリ別
        base/          # 基底プリミティブ（BaseButton / BaseIcon / BaseLabel / BaseUnit）
        buttons/       # IconButton（円形アイコン専用ボタン）
        typography/    # BigNumber（複合の文字表示）
        inputs/        # Stepper
        layout/        # ScreenBody / AppBar / Card / SectionTitle
      *.vue            # 横断のアプリ固有複合（ConfirmDialog.vue / SetEditModal.vue など）
  pages/<画面>/index.vue # 画面エントリ（Nuxt 風の index.vue 命名。ファイルベースルーティングではない）
  router/index.ts        # vue-router のルート定義
  assets/
    icons/             # lucide 純正アイコン（ISC）の SVG 実体 + 名前一覧 index.ts（iconNames / IconName）+ NOTICE。BaseIcon.vue が glob で読む
  styles/  tokens.css  global.css
```

- **画面ディレクトリ名**: `home` / `menu` / `training` / `interval` / `result` / `history` / `settings`
- **`core/` と `storage/` の分離**: `core/` は副作用を持たない純関数（純粋ユニットテストで完結）。`storage/` は IndexedDB という外部世界に触る層。依存方向は **`storage → core` の一方向**で、`core/` から `storage/` を import しない。これにより業務ルール（1RM 計算・progression）が永続化技術から独立する。
- **`components/shared/ui/`** はデザインシステムのプリミティブ専用で、フラットに並べず **カテゴリ別サブディレクトリ**（`base/` / `buttons/` / `typography/` / `inputs/` / `layout/`）に分ける。`base/` は単一の HTML 要素をラップする基底プリミティブ（`BaseButton` / `BaseIcon` / `BaseLabel` / `BaseUnit`）専用で、`Base` プレフィックスで揃える。見た目の variant 違いは別コンポーネントに分けず prop で吸収する（例: `BaseButton` の `variant: 'primary' | 'secondary'`）。プリミティブを組み合わせた横断複合コンポーネントは `components/shared/` 直下に置く。
- **画面専用は `shared/` に置かない**: 1 つの画面でしか使わないコンポーネントは `components/shared/ui/` ではなく `components/pages/<画面>/` に置く。例として WeightStepper は Menu 設定画面でのみ使う重量入力（汎用 `Stepper` を 0.25 kg 刻み・linear progression のベースライン表示など Menu 固有の振る舞いで包む）ため、`ui/inputs/` ではなく `components/pages/menu/WeightStepper.vue` に置く。「複数画面で使う汎用プリミティブか／単一画面のドメイン固有部品か」が判断基準。
- **ステッパーのロジックは 3 層に分離**する。ルールを純関数に寄せることで単体テストで完結させ、見た目とブラウザ依存を切り離す。
  1. `core/stepper.ts` = 純関数（increment / decrement / clamp・0.25 kg 刻みなどのルール。副作用なし）
  2. `composables/shared/inputs/useStepper` = ブラウザ glue（長押しリピートのタイマー・イベント処理）
  3. `components/shared/ui/inputs/Stepper.vue` = 見た目（presentational）
- **アイコンは単一 `BaseIcon.vue` に集約**する。種類ごとの個別コンポーネントは作らない。SVG 実体は **lucide 純正ファイル**を `src/assets/icons/<name>.svg` に置き、同階層の `src/assets/icons/index.ts` が名前一覧（`iconNames` 配列と、そこから導出される union 型 `IconName`）を持ち、**vite-svg-loader（`?component` でインライン展開）+ `import.meta.glob`** でファイル名 → コンポーネントのマップ（`icons`）をモジュールスコープで構築して export する。`BaseIcon.vue` はそのマップを `name`（`IconName`）で引くだけ。出典は **lucide（ISC）に統一**し、独自に描き起こさない（公開されている純正 SVG を無加工で使う）。アイコン追加は `assets/icons/` に lucide 純正 SVG を 1 ファイル置き、隣の `index.ts` の `iconNames` に名前を 1 つ足すだけ（作業が 1 ディレクトリで完結する）。ライセンス帰属として `src/assets/icons/NOTICE`（lucide LICENSE 全文・ISC + Feather 由来分の MIT）を置く。色は SVG ルートの `stroke="currentColor"` を親の `color` から継承させる（`vite.config` の `svgLoader` は `svgo: false` で属性を保持）。`<img>` での読み込みは使わない（外部リソース化で `currentColor` が効かないため。`?component` はインライン展開なので `currentColor` が効く）。
- **状態管理**: Pinia は導入しない。共有が必要な状態（実行中セッション）は composable（`createSession()`）の単一インスタンスを App ルートで `provide` し、子孫が `inject` で共有する。依存リポジトリは composable の引数で注入する。

`@/` alias の見え方の例: `@/core/oneRm`、`@/storage/sessionRepo`、`@/composables/shared/session/useSession`、`@/components/shared/ui/base/BaseButton.vue`、`@/components/shared/ui/inputs/Stepper.vue`、`@/pages/home/index.vue`。

## ファイル命名

- **Vue コンポーネント**: PascalCase（`MenuSetup.vue`、`SessionResult.vue`）。Vue 公式スタイルガイド準拠。`components/shared/ui/` 配下の基底プリミティブで名前が 1 語になるもの（`BaseIcon` / `BaseLabel` / `BaseUnit`）は、Vue 公式の base component 規約に従い `Base` プレフィックスを付けて 2 語にする（`vue/multi-word-component-names` を満たすため）。修飾子を持つものはその機能名 2 語でよい（`IconButton` / `BigNumber`）
- **TypeScript ロジック・composable**: camelCase（`oneRm.ts`、`useSession.ts`）
- **テストファイル**: テスト対象と同じ命名 ＋ `.spec.ts`（`oneRm.ts` → `oneRm.spec.ts`）
- **Story ファイル**: 対象コンポーネントと同じ命名 ＋ `.stories.ts`（`BaseButton.vue` → `BaseButton.stories.ts`）
- **設定ファイル（プロジェクトルート）**: ツール慣習に従う（`vite.config.ts`、`eslint.config.js`、`.prettierrc.json`）

## import

- `src/` 配下のモジュールを参照するときは alias `@/` の絶対パスを使う（`import x from '@/core/oneRm'`）
- 同階層であっても相対パス（`./`、`../`）は使わない。`vite.config.ts` の `resolve.alias` と `tsconfig.json` の `paths` に `@/* → src/*` を定義済み
- サードパーティパッケージは通常どおりパッケージ名で import する
- `storage/` のリポジトリ（`sessionRepo` / `menuPresetRepo`）は **メソッドを束ねた 1 つのオブジェクトを export** する（`export const sessionRepo = { insert, list, ... }`）。個々の関数を named export しないことで、主語が消える `import { get }` を構造的に不可能にする（lint ルールではなく export 形で縛る）。メソッド名は主語を繰り返さず素の動詞にし（`get` / `put` / `list` / `insert` / `remove`）、主語は呼び出し側で `sessionRepo.list()` / `menuPresetRepo.get()` と表現する
  - **内部スタイル**: 各メソッドはモジュールスコープの関数として定義し、末尾の `export const repo = { ... }` で参照を束ねる（オブジェクトリテラル内にメソッドを直書きしない）。関数ごとに JSDoc を持たせられ、末尾の束ねがメソッド一覧（シグネチャの索引）として機能する

## Vue コンポーネント

- script ブロックは **`<script setup lang="ts">` 1 つに統一**する。通常の `<script lang="ts">` ブロックを併設しない
- コンポーネント外から参照する型・定数（props の union 型など）は `<script setup>` から export できない（値 export はビルド時に compiler-sfc が拒否する。vue-tsc では検出されない）ため、`.ts` モジュールに切り出して双方から import する（例: `assets/icons/index.ts` の `iconNames` / `IconName`）。モジュールスコープで 1 回だけ実行したい処理（`import.meta.glob` のマップ構築など）も `<script setup>` 内ではなく `.ts` 側に置く（`<script setup>` の本文はインスタンス生成ごとに実行されるため）
- props は型引数つき `defineProps` を **reactive props destructure**（Vue 3.5+）で受け、デフォルト値は分割代入のデフォルト値で書く（`const { size = 16 } = defineProps<{ size?: number }>()`）。`withDefaults` は使わない
  - destructure した props を `<script setup>` 直下の式で使うとリアクティビティを失う（setup は 1 回しか走らない）。派生値は `computed` かテンプレート内の式にする

## 型定義（TypeScript）

- アプリ内部の型は、オブジェクト形状も含め原則 **`type`** で定義する（`type Session = { ... }`）。ユニオン型（例: `type Exercise = 'benchPress' | 'squat' | 'deadlift'`）が `type` 必須なため、全体を `type` に揃えて表記の混在を防ぐ
- **`interface` は declaration merging が必要な型拡張のみ**に使う（例: `vite-env.d.ts` の `ImportMetaEnv` 拡張）。アプリ内の閉じたドメインモデルは `interface` にしない。意図しない再宣言マージ（footgun）を防ぎ、`Readonly<>` で固める不変モデルの思想とも揃える
- **値の不在は `null` ではなく `undefined` で表す**（`Session | undefined`、リポジトリの「見つからない」も `undefined`）。Dexie の `.get()`・`Array.at()`・`?.`・`??` の自然な返り値が `undefined` であり、`?? null` のような変換を挟まないため。`null` リテラルは ESLint（`unicorn/no-null`）で禁止している。React リファレンス（`docs/design/source/*.jsx`）の `null` は対象外

## テスト

Vitest を projects 構成で動かし、ロジック層の単体テスト（`unit` project、`happy-dom`）と、Storybook の play 関数によるコンポーネントのインタラクションテスト（`storybook` project、`@storybook/addon-vitest` + **headless Chromium**）の両方を実行する。`npm test` で両 project が走る。ロジックとコンポーネントで役割を分担し、同じ振る舞いを両方で書かない。

`storage/` のテストも `unit` project で動かす。happy-dom は IndexedDB を持たないため、`unit` project の `setupFiles` に `fake-indexeddb/auto` を読み込んでグローバルを補う。リポジトリのテストは `beforeEach` で `db.delete()` → `db.open()` してケース間の状態を分離する。

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

- Story ファイルは対象コンポーネントと同じディレクトリに co-located で置く（`BaseButton.vue` の隣に `BaseButton.stories.ts`）
- `import { expect, userEvent, within } from 'storybook/test'`（Storybook v10 以降は `@storybook/test` ではなくスコープなしの `storybook/test` から import する）
- **Story の `export` 識別子は英語 PascalCase**（`IncrementsOnClick`）。Storybook が URL ・内部 ID に使うため日本語にしない。UI 表示名は Storybook が export 識別子から自動整形する（`IncrementsOnClick` → `Increments On Click`）
- Story の `play` 関数では Storybook の `expect` を使い、Vitest の `describe` / `test` は呼ばない
- **コンポーネント説明や argTypes を Docs タブに表示するには `meta.tags: ['autodocs']` を必ず付ける**。Storybook v10 はデフォルトで `docs.autodocs: 'tag'` モードで、付けないと Docs ページが生成されない
- **Chromatic の snapshot を消費しない Playground 系 story には `parameters: { chromatic: { disableSnapshot: true } }` を付ける**。引数を動かして見るだけの探索用 story は視覚差分の対象にせず、実機 UI として価値ある代表状態のみ snapshot を取る（無料枠 5,000/月 を守るため）。viewport（390px）・ブラウザ（Chrome のみ）は `.storybook/preview.ts` でグローバル設定済みなので個別指定は不要

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import IconButton from '@/components/shared/ui/buttons/IconButton.vue'

const meta: Meta<typeof IconButton> = {
  component: IconButton,
  args: { name: 'plus', label: 'セットを追加' },
}

export default meta

type Story = StoryObj<typeof IconButton>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'セットを追加' })).toBeVisible()
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

- Vue の **scoped CSS** を使う。Tailwind は使わない（Sass も使わない。プレーン CSS + カスタムプロパティで足り、必要になった時点で後付けする）
- クラス名は **短く（`.title`、`.list`）**。BEM 記法（`app__title`）は使わない
- 値（色・タイポグラフィ・スペーシング）は `docs/design/README.md` のデザイントークンに厳密に従う
- **`text-transform: uppercase` は使わない**。大文字で見せたいテキストは呼び出し側がラベル文字列そのものを大文字で書く（例: `START SESSION`・`KG`）。表示とソース文字列（コピー・読み上げ内容）を一致させる
- **非対称な余白・寸法は論理プロパティで書く**（`padding: 0 20px` ではなく `padding-block: 0; padding-inline: 20px`）。四辺均等・全辺ゼロ（`padding: 24px`、`margin: 0`）は物理表記と意味が変わらないため shorthand のままでよい
- **ボタン共通の interaction reset**（`cursor: pointer`・`-webkit-tap-highlight-color: transparent`）は `global.css` の `button` ルールに置く。レシピ（見た目）と違い全ボタン無条件のリセットなので、各コンポーネントで繰り返さない
- **`transition` は対象プロパティを明示する**（`transition: background-color var(--transition), color var(--transition)`）。プロパティ省略（= `all`）は全プロパティが変更監視され、意図しない変化（レイアウト系含む）までアニメーションされるため使わない

### デザイントークン

- トークンの**値**は `src/styles/tokens.css` の `:root` カスタムプロパティに集約する（単一ソース）。`main.ts` / `.storybook/preview.ts` で `global.css` より前に読み込む。各コンポーネントの scoped CSS からは `var(--*)` で参照する
- 多プロパティの**レシピ**（glow 付き数字・mono タブラー数字など）は共通 CSS ではなく**プリミティブコンポーネントに内包**して使い回す
- 命名はカテゴリ接頭辞: `--color-*` / `--font-family-*` / `--font-size-*` / `--font-weight-*` / `--line-height*` / `--space-<px>` / `--radius*` / `--shadow-*` / `--easing-*` / `--transition`（`--transition` は既定値のみのトークンなので bare 名。下記の bare 規則に従う）
- **`--font-size-*` の値は rem で定義する**。`global.css` の `html { font-size: 62.5% }` により 1rem = 10px なので、値はデザインの px ÷ 10（例: 14px → `1.4rem`）。% 基準のためブラウザのフォントサイズ設定（アクセシビリティ）にも追従する。スペーシング・radius など寸法系は px のままでよい
- **既定値は接尾辞なし（bare）・変種のみ接尾辞**を付ける（例: `--line-height` / `--line-height-tight`、`--radius` / `--radius-pill`、`--color-text` / `--color-text-secondary`）
- README の抽象名は用途が湧く名前に改名してよい（`fg`→`--color-text`、`line`→`--color-line` 等）。ただし**値は実デザイン（`docs/design/source/*.jsx`）に一致**させる。`font-size` の役割名（display/hero/stat…）は標準語なので維持しコメントで補足する

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
