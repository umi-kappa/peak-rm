# コーディング規約

PeakRM のコーディング・命名・テスト・ドキュメント表記の規約をここに集約する。実装前後で必ず参照する。技術スタック・仕様の詳細は `docs/spec.md` を、デザイントークンは `docs/design/README.md` を参照する。

## ディレクトリ構成

`src/` 配下は **責務で分割** する。各レイヤを共通ルールで分岐させる: **画面専用のものは各レイヤの `pages/<画面名>/` に置く**、**複数画面で使う横断的なものは各レイヤの共有バケツ（`shared/` など）に置く**。

```
src/
  core/                # 純ロジック（副作用なし・I/O なし・型・計算・ルール）※フラット
    constants.ts  linearProgression.ts  menu.ts  oneRm.ts  session.ts  sessionHistory.ts  stepper.ts  types.ts
  storage/             # 永続化（Dexie / IndexedDB・リポジトリ・persist・backup）※フラット
    db.ts  sessionRepo.ts  backup.ts
  composables/
    pages/<画面>/       # 画面専用に切り出した composable
    shared/
      error/           # useFatalError（エラー境界の状態。main.ts が生成し app.provide で共有）
      session/         # useSession / useIntervalTimer（実行中セッションの状態系）
      platform/        # useWakeLock / useAudioCue（ブラウザ API glue）
      ui/inputs/       # useNumberStepper（入力部品のブラウザ glue・長押しリピート等）
  components/
    app/               # App ルート（App.vue）専用のコンポーネント（ErrorScreen.vue）
    pages/<画面>/        # その画面専用のコンポーネント（例: menu/WeightStepper.vue）
    shared/
      ui/              # デザインプリミティブ（汎用・presentational・ドメイン非依存）※カテゴリ別
        base/          # 基底プリミティブ（BaseButton / BaseIcon / BaseLabel / BaseUnit / BaseCard）
        buttons/       # IconButton（円形アイコン専用ボタン）/ CardButton（押せる面）。どちらも to で router-link / button を切り替える
        typography/    # 文字 / 数値の複合提示（BigNumber）
        inputs/        # NumberStepper
        layout/        # ScreenFrame / AppBar
        dialog/        # ConfirmDialog（破壊的操作の確認・通知系オーバーレイ）
      *.vue            # 横断のアプリ固有複合（SetEditDialog.vue など）
  pages/                 # 画面エントリ（各画面 index.vue。Nuxt 風命名だがファイルベースルーティングではない）
    home/index.vue       # 種目に属さない画面は pages 直下
    [exercise]/          # 種目をトップレベルに置き、セッションフローを配下にネスト（URL /:exercise/… と一致）
      menu/index.vue  training/index.vue  interval/index.vue  result/index.vue
    history/index.vue  settings/index.vue
  router/index.ts        # vue-router のルート定義
  assets/
    icons/             # lucide 純正アイコン（ISC）の SVG 実体 + 名前一覧 index.ts（iconNames / IconName）+ NOTICE。BaseIcon.vue が glob で読む
  styles/  tokens.css  global.css
  stories/  router.ts    # Storybook 補助（全 story で 1 度だけ install する共有 router など）
```

- **画面ディレクトリ名**: `home` / `menu` / `training` / `interval` / `result` / `history` / `settings`。うち `menu` / `training` / `interval` / `result` はセッションフローとして `[exercise]/` 配下にネストし、ディレクトリ構成を URL（`/:exercise/…`）と一致させる（`[exercise]` は動的セグメント `:exercise` を表すディレクトリ名。ファイルベースルーティングではなく実際のルートは `router/index.ts` で定義する）。種目に属さない `home` / `history` / `settings` は `pages/` 直下に置く
- **`core/` と `storage/` の分離**: `core/` は副作用を持たないドメインの中核（型・定数・純関数）。純関数（`oneRm` / `session` / `linearProgression` など）に加え、それらが共通語彙として使うドメインモデル（`types.ts`）と静的なドメインデータ（`constants.ts` の `EXERCISE_ORDER` / `EXERCISE_LABELS` など）も含む。型・定数は副作用ゼロで `storage → core`・`components・pages → core` の依存方向の規律にそのまま乗る最基底であり、`src/` 直下や別層に散らさず `core/` に集約する。`storage/` は IndexedDB という外部世界に触る層。依存方向は **`storage → core` の一方向**で、`core/` から `storage/` を import しない。これにより業務ルール（1RM 計算・progression）が永続化技術から独立する。
- **静的なドメインデータ定数は `readonly` を型で保証する**: `const` は再代入しか防がず、要素・プロパティは書き換え可能なため明示的に `readonly` 化する。手段は配列とオブジェクトで非対称:
  - **配列**は型注釈 `: readonly T[]` だけで readonly 配列型になる（再代入・`push` をコンパイル時に弾く）。`as const` は要素リテラル付きの readonly タプルを作るが、反復用途ではオーバーキルなので使わない（例: `EXERCISE_ORDER: readonly Exercise[]`）。
  - **オブジェクト**は型注釈（`: Record<Exercise, string>`）では readonly にならないため `as const`（プロパティを `readonly` 化し書き換え・キー追加を弾く）+ `satisfies <型>`（`Record<Exercise, string>` などで網羅・値の型を保証）を併用する（例: `EXERCISE_LABELS = { … } as const satisfies Record<Exercise, string>`）。
  - 実行時の `Object.freeze` は使わない（外部入力ではないアプリ内定数のため過剰）。
- **`components/shared/ui/`** はデザインシステムのプリミティブ専用で、フラットに並べず **カテゴリ別サブディレクトリ**（`base/` / `buttons/` / `typography/` / `inputs/` / `layout/` / `dialog/`）に分ける。`base/` は単一要素にトークンで見た目を着せるだけの基底プリミティブ（`BaseButton` / `BaseIcon` / `BaseLabel` / `BaseUnit` / `BaseCard`）専用で、`Base` プレフィックスで揃える。子要素の配置や画面領域の構造は与えず（見た目を着せるだけ）、面の土台 `BaseCard`（padding を持つだけで子の並びは制御しない）もここに含む。子要素の配置・画面領域の構造を担うもの（`ScreenFrame` の全高縦 flex 外殻 + 本文領域（左右 padding + 縦 gap、デザインの ScreenBody 相当を内包）、`AppBar` の領域分割）は `layout/`、base の文字プリミティブを組み合わせて意味を持つ文字 / 数値を提示する複合（`BigNumber` の数値提示）は `typography/` に置く。見た目の variant 違いは別コンポーネントに分けず prop で吸収する（例: `BaseButton` の `variant: 'primary' | 'secondary'`）。確認・通知系のオーバーレイは `dialog/` に置く（`ConfirmDialog` は破壊的操作の確認に使う presentational なモーダルで、`open` / `title` などを prop で受け取り `confirm` / `cancel` を emit するだけ。遷移先や実処理は呼び出し側が担い、router・業務ロジックを持たないため `ui/` プリミティブに属する）。これに対し、実行中セッションなどドメイン状態を内側に持つアプリ固有の複合コンポーネントは `components/shared/` 直下に置く。`CardButton`（`to` で `<router-link>` / `<button>` を切り替える押せる面・`buttons/`）は `BaseCard`（presentational な面・`base/`）を内包して面レシピを再利用し、押せる affordance（focus / hover / press・クリック emit）だけを足す。面の単一ソースは `BaseCard` に置き、静的な面か押せる面かという役割で配置を分ける。`ui/` のプリミティブは presentational に保ち、インタラクションは affordance + イベント発火まで（クリック emit・`@back` など）に留める。ナビゲーションや業務ロジック（遷移先の判断・状態更新・router 参照）は持たせず呼び出し側に委ねる（例: `AppBar` の `back` は押下で `@back` を emit するだけで、遷移先は画面側が決める）。
- **`components/` はオーナー（利用箇所）で三分割する**: App ルート（`App.vue`）専用は `app/`、1 つの画面でしか使わないものは `components/pages/<画面>/`、複数画面で横断的に使うものだけを `shared/` に置く。例として WeightStepper（汎用 `NumberStepper` を 0.25 kg 刻みで包む重量入力）や LpIndicator（linear progression の増量プレビュー表示）は Menu 設定画面でのみ使うため `components/pages/menu/` に、ErrorScreen（route を持たない全画面のエラー表示）は `App.vue` だけが mount するため `components/app/` に置く。「誰が使うか」が判断基準で、単一利用のものを `shared/` に置かない。
- **ステッパーのロジックは 3 層に分離**する。ルールを純関数に寄せることで単体テストで完結させ、見た目とブラウザ依存を切り離す。
  1. `core/stepper.ts` = 純関数（increment / decrement / clamp・0.25 kg 刻みなどのルール。副作用なし）
  2. `composables/shared/ui/inputs/useNumberStepper` = ブラウザ glue（長押しリピートのタイマー・イベント処理）
  3. `components/shared/ui/inputs/NumberStepper.vue` = 見た目（presentational）
- **アイコンは単一 `BaseIcon.vue` に集約**する。種類ごとの個別コンポーネントは作らない。SVG 実体は **lucide 純正ファイル**を `src/assets/icons/<name>.svg` に置き、同階層の `src/assets/icons/index.ts` が名前一覧（`iconNames` 配列と、そこから導出される union 型 `IconName`）を持ち、**vite-svg-loader（`?component` でインライン展開）+ `import.meta.glob`** でファイル名 → コンポーネントのマップ（`icons`）をモジュールスコープで構築して export する。`BaseIcon.vue` はそのマップを `name`（`IconName`）で引くだけ。出典は **lucide（ISC）に統一**し、独自に描き起こさない（公開されている純正 SVG を無加工で使う）。アイコン追加は `assets/icons/` に lucide 純正 SVG を 1 ファイル置き、隣の `index.ts` の `iconNames` に名前を 1 つ足すだけ（作業が 1 ディレクトリで完結する）。ライセンス帰属として `src/assets/icons/NOTICE`（lucide LICENSE 全文・ISC + Feather 由来分の MIT）を置く。色は SVG ルートの `stroke="currentColor"` を親の `color` から継承させる（`vite.config` の `svgLoader` は `svgo: false` で属性を保持）。`<img>` での読み込みは使わない（外部リソース化で `currentColor` が効かないため。`?component` はインライン展開なので `currentColor` が効く）。
- **状態管理**: Pinia は導入しない。共有が必要な状態（実行中セッション）は composable（`useSession()`）の単一インスタンスを App ルートで `provide` し、子孫が `inject` で共有する。依存リポジトリは composable の引数で注入する。

`@/` alias の見え方の例: `@/core/oneRm`、`@/storage/sessionRepo`、`@/composables/shared/session/useSession`、`@/components/shared/ui/base/BaseButton.vue`、`@/components/shared/ui/inputs/NumberStepper.vue`、`@/pages/home/index.vue`、`@/pages/[exercise]/menu/index.vue`。

## ファイル命名

- **Vue コンポーネント**: PascalCase（`MenuSetup.vue`、`SessionResult.vue`）。Vue 公式スタイルガイド準拠。`components/shared/ui/` 配下の基底プリミティブで名前が 1 語になるもの（`BaseIcon` / `BaseLabel` / `BaseUnit` / `BaseCard`）は、Vue 公式の base component 規約に従い `Base` プレフィックスを付けて 2 語にする（`vue/multi-word-component-names` を満たすため）。修飾子を持つものはその機能名 2 語でよい（`IconButton` / `BigNumber`）
- **画面エントリ**: `pages/<画面>/index.vue`（Nuxt 風）。ディレクトリ名で一意に識別できるため `vue/multi-word-component-names` の対象外とする（`eslint.config.js` で `src/pages/**/index.vue` に限り無効化）
- **TypeScript ロジック・composable**: camelCase（`oneRm.ts`、`useSession.ts`）
- **テストファイル**: テスト対象と同じ命名 ＋ `.spec.ts`（`oneRm.ts` → `oneRm.spec.ts`）
- **Story ファイル**: 対象コンポーネントと同じ命名 ＋ `.stories.ts`（`BaseButton.vue` → `BaseButton.stories.ts`）
- **設定ファイル（プロジェクトルート）**: ツール慣習に従う（`vite.config.ts`、`eslint.config.js`、`.prettierrc.json`）

## import

- `src/` 配下のモジュールを参照するときは alias `@/` の絶対パスを使う（`import x from '@/core/oneRm'`）
- 同階層であっても相対パス（`./`、`../`）は使わない。`vite.config.ts` の `resolve.alias` と `tsconfig.json` の `paths` に `@/* → src/*` を定義済み
- サードパーティパッケージは通常どおりパッケージ名で import する
- `storage/` のリポジトリ（`sessionRepo` など）は **メソッドを束ねた 1 つのオブジェクトを export** する（`export const sessionRepo = { insert, list, ... }`）。個々の関数を named export しないことで、主語が消える `import { get }` を構造的に不可能にする（lint ルールではなく export 形で縛る）。メソッド名は主語を繰り返さず素の動詞にし（`get` / `put` / `list` / `insert` / `remove`）、主語は呼び出し側で `sessionRepo.list()` と表現する
  - **内部スタイル**: 各メソッドはモジュールスコープの関数として定義し、末尾の `export const repo = { ... }` で参照を束ねる（オブジェクトリテラル内にメソッドを直書きしない）。関数ごとに JSDoc を持たせられ、末尾の束ねがメソッド一覧（シグネチャの索引）として機能する

## Vue コンポーネント

- script ブロックは **`<script setup lang="ts">` 1 つに統一**する。通常の `<script lang="ts">` ブロックを併設しない
- コンポーネント外から参照する型・定数（props の union 型など）は `<script setup>` から export できない（値 export はビルド時に compiler-sfc が拒否する。vue-tsc では検出されない）ため、`.ts` モジュールに切り出して双方から import する（例: `assets/icons/index.ts` の `iconNames` / `IconName`）。モジュールスコープで 1 回だけ実行したい処理（`import.meta.glob` のマップ構築など）も `<script setup>` 内ではなく `.ts` 側に置く（`<script setup>` の本文はインスタンス生成ごとに実行されるため）
- `<script setup>` 内は **変数宣言（route / inject / props / state）→ 関数 → ライフサイクル登録（`onMounted` 等）の順**に並べる。関数の間にフック登録や変数宣言を挟まない
- **composable は関数単体でなく named なオブジェクトを返す**（`return { goBack }` → `const { goBack } = useBackNavigation()`）。呼び出し側の変数名が composable の意図した名前に揃い、公開項目の追加にも形を変えず対応できる
- **template にインライン式で処理を書かない**（`@back="router.push({ name: 'home' })"` 禁止）。イベントハンドラは script の名前付き関数に切り出す（`@back="goHome"`）。presentational コンポーネント内の単純な emit 転送（`@click="emit('confirm')"`）は例外
- props は型引数つき `defineProps` を **reactive props destructure**（Vue 3.5+）で受け、デフォルト値は分割代入のデフォルト値で書く（`const { size = 16 } = defineProps<{ size?: number }>()`）。`withDefaults` は使わない
  - destructure した props を `<script setup>` 直下の式で使うとリアクティビティを失う（setup は 1 回しか走らない）。派生値は `computed` かテンプレート内の式にする

## 型定義（TypeScript）

- アプリ内部の型は、オブジェクト形状も含め原則 **`type`** で定義する（`type Session = { ... }`）。ユニオン型（例: `type Exercise = 'benchPress' | 'squat' | 'deadlift'`）が `type` 必須なため、全体を `type` に揃えて表記の混在を防ぐ
- **`interface` は declaration merging が必要な型拡張のみ**に使う（例: `vite-env.d.ts` の `ImportMetaEnv` 拡張）。アプリ内の閉じたドメインモデルは `interface` にしない。意図しない再宣言マージ（footgun）を防ぎ、`Readonly<>` で固める不変モデルの思想とも揃える
- **値の不在は `null` ではなく `undefined` で表す**（`Session | undefined`、リポジトリの「見つからない」も `undefined`）。Dexie の `.get()`・`Array.at()`・`?.`・`??` の自然な返り値が `undefined` であり、`?? null` のような変換を挟まないため。`null` リテラルは ESLint（`unicorn/no-null`）で禁止している。React リファレンス（`docs/design/source/*.jsx`）の `null` は対象外

## エラーハンドリング

想定外の失敗は境界 1 箇所で受けて全画面エラー表示にし、縮退（最善努力）だけを呼び出し元で明示的に catch する。判断基準は「**この失敗は根幹（トレーニングを実行して実績を記録し、それを正しく見せること）を壊すか？**」（spec「エラーハンドリング」）。

- **壊さない（周辺の縮退）**: Wake Lock / タイマー音 / `requestPersistentStorage` など、spec が最善努力と定めるもの。呼び出し元で catch して継続し、**spec の根拠をコメントに書く**（明示的なオプトイン）
- **壊す・不明（想定外）**: IndexedDB 読み書き失敗・配線バグ・未知の例外。**画面では catch せず境界へ流す**。分類に迷ったら catch しない（分類漏れは自動的にエラー画面側へ落ちるため安全側）
- `console.error` だけの catch（握りつぶし）は書かない。「動いているが中身が事実と違う」状態（例: 読み取り失敗を「未記録」と同じ空表示にする）は縮退ではなく根幹の破壊として扱う
- 境界の実装は `main.ts` が `installErrorBoundary`（`composables/shared/error/`）で 4 配線（`app.config.errorHandler` / `router.onError` / `unhandledrejection` / `window` の `error`）を張り、`useFatalError` へ集約 → `App.vue` が `ErrorScreen` に切り替える。Vue は async イベントハンドラ・async ライフサイクルフックの reject も `errorHandler` へ流すため、画面側は catch を書かなければ自動で境界に落ちる
- `useFatalError`（`composables/shared/error/`）の共有も「状態管理」の provide/inject 方式に乗せる。配線元の `main.ts` が component tree の外にあるため、App ルートの `provide()` ではなく **`app.provide()`** で供給する（main.ts が生成したインスタンスの `report` を 4 配線へ直接渡し、読み手の `App.vue` は inject で受ける）

## テスト

Vitest を projects 構成で動かし、ロジック層の単体テスト（`unit` project、`happy-dom`）と、Storybook の play 関数によるコンポーネントのインタラクションテスト（`storybook` project、`@storybook/addon-vitest` + **headless Chromium**）の両方を実行する。`npm test` で両 project が走る。ロジックとコンポーネントで役割を分担し、同じ振る舞いを両方で書かない。

`storage/` のテストも `unit` project で動かす。happy-dom は IndexedDB を持たないため、`unit` project の `setupFiles` に `fake-indexeddb/auto` を読み込んでグローバルを補う。リポジトリのテストは `beforeEach` で `db.delete()` → `db.open()` してケース間の状態を分離する。

### 配置

テスト対象のソースと同じディレクトリに co-located で置く（例: `src/core/oneRm.ts` の隣に `src/core/oneRm.spec.ts`）。`tests/` のような分離ディレクトリは使わない。Vitest は `src/**/*.spec.ts` を拾う。

### スタイル

- 1 つの対象について複数の振る舞いをまとめて検証する場合は `describe(対象モジュール名 or 文脈, () => { ... })` でグループ化する。独立した数本のテストを並べるだけなら `describe` は省略してトップレベルに `test()` を置いてよい
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
- **標準（代表）状態の story は `Default` という名前にする**。`meta.args` のデフォルト値で素直に描画される基準状態を全コンポーネントで `Default` に統一し、そこからの差分を variant 名（`Secondary` / `Large` / `Hero` など）で表す。variant の値そのものを story 名にしない（`primary` variant の代表を `Primary` ではなく `Default` にする）
- Story の `play` 関数では Storybook の `expect` を使い、Vitest の `describe` / `test` は呼ばない
- **コンポーネント説明や argTypes を Docs タブに表示するには `meta.tags: ['autodocs']` を必ず付ける**。Storybook v10 はデフォルトで `docs.autodocs: 'tag'` モードで、付けないと Docs ページが生成されない
- **視覚差分として価値のない story には `parameters: { chromatic: { disableSnapshot: true } }` を付ける**。snapshot は実機 UI として意味のある代表状態だけに取り、既存 variant と見た目が重複する story（後述の `Behavior` など）は対象外にする（無料枠 5,000/月 を守るため）。引数を動かして見るためだけの探索用 story は作らない（Controls はどの story でも使えるため `Default` で足りる）。viewport（390px）・ブラウザ（Chrome のみ）は `.storybook/preview.ts` でグローバル設定済みなので個別指定は不要
- **`play`（インタラクション / スモークテスト）は visual variant story に相乗りさせず、専用の `Behavior` story に分離する**。`Default` / `Large` などの variant story は見た目の提示に専念させ `play` を持たせない。`Behavior` は既存 variant と見た目が重複するため `parameters: { chromatic: { disableSnapshot: true } }` を付ける。同じ振る舞いを variant 違いで何本も検証せず、配線が成立することを 1 本で示すに留め、刻み・clamp などのロジックはロジック層の単体テストに委ねる

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

export const Default: Story = {}

export const Behavior: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
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
- **コンポーネントのルート要素のクラス名はコンポーネント名に揃える**（kebab-case。`BaseButton` → `.base-button`、`NumberStepper` → `.number-stepper`、`BigNumber` → `.big-number`）。scoped CSS で衝突しないので必須ではないが、要素を見たときどのコンポーネントの根かが一目で分かる
- ルート以外の**子要素のクラス名は短く**（`.title`、`.value`、`.unit`）。BEM 記法（`app__title`）は使わない
- 値（色・タイポグラフィ・スペーシング）は `docs/design/README.md` のデザイントークンに厳密に従う
- **余白（`padding` / `margin` / `gap`）は `--space-*` トークンを `var()` で参照する**。生の px を直書きしない。同じ役割の余白は同じトークンに揃える（例: 画面外周は `--space-24`、カード内側は `--space-16`）。余白の値は外側ほど大きい入れ子の階層（画面 ⊃ カード ⊃ バー）として意図的に段階を持たせており、段数を減らすかは実画面の実装の中で判断する
- **ヘッダーバー（`AppBar` / `BrandBar` など）は `ScreenFrame` の `#header` スロットに入れる**。高さは固定せず `padding-block`（`--space-8`）で作り、`padding-inline` は画面外周（`--space-24`）に揃えて本文（ScreenBody）と左右の縦ラインを合わせる
- **`text-transform: uppercase` は使わない**。大文字で見せたいテキストは呼び出し側がラベル文字列そのものを大文字で書く（例: `START SESSION`・`KG`）。表示とソース文字列（コピー・読み上げ内容）を一致させる
- **非対称な余白・寸法は論理プロパティで書く**（`padding: 0 20px` ではなく `padding-block: 0; padding-inline: 20px`）。四辺均等・全辺ゼロ（`padding: 24px`、`margin: 0`）は物理表記と意味が変わらないため shorthand のままでよい
- **ボタン共通の interaction reset**（`cursor: pointer`・`-webkit-tap-highlight-color: transparent`）は `global.css` の `button` ルールに置く。レシピ（見た目）と違い全ボタン無条件のリセットなので、各コンポーネントで繰り返さない
- **`transition` は対象プロパティを明示する**（`transition: background-color var(--transition), color var(--transition)`）。プロパティ省略（= `all`）は全プロパティが変更監視され、意図しない変化（レイアウト系含む）までアニメーションされるため使わない
- **親の scoped CSS から子コンポーネントのクラス名を直接指定しない**（`.diff .base-icon { … }` のような子のルートクラスへの結合は禁止）。子コンポーネントに手を入れたい場合は呼び出し側で class を渡し（`<BaseIcon class="chevron" />` → `.chevron { … }`）、自分が付けた名前に対してスタイルを書く
- **アイコンサイズは 3 値（12 / 16 / 24）に絞る**（スペーシングと同じ 4px グリッド上。14・18・20・22 などの中間値は使わない）。12 = 行内の差分 chevron・インラインマーカー、16 = 行の先頭アイコン（`BaseIcon` のデフォルトなので `size` を省略する）、24 = 大型コントロール（ステッパー large・`IconButton`）。用途に対応するサイズは `docs/design/README.md` の Assets 節と同期する
- **プリミティブの外形幅は親が決める**。`ui/` プリミティブは `width: 100%` で親に追従させ、内容幅に詰める・幅を固定するなどのレイアウト都合は使用側（wrapper 要素の `width` / `min-width`）に置く。外形サイズを切り替える variant prop（`fit` など）は作らない。レイアウト用の数値（桁数変動でボタン位置がずれないための最小幅など）はマジックナンバーになるが、プリミティブに内包せず使用側のコンテキストに置く（デザインソース `primitives.jsx` の Stepper も同方針: 幅・最小幅は使用画面が `style` で渡す）
- **state・variant はその要素のセレクタ内に `&` でネストする**。`.base-button:hover` や `.base-button.primary` を別のトップレベルルールに並べず、`.base-button { &.primary { … } &:active { … } }` のように入れ子にして同じ要素のルールを一箇所に集約する。`@media (hover: hover)` の `:hover` も対象セレクタ内に置く（`.icon-button { @media (hover: hover) { &:hover { … } } }`）。一方で**子要素を無条件に指すセレクタ（`.card` / `.button` / `.value` など単体）はネストせずトップレベルに置く**。無条件の子スタイルを親に入れ子にすると詳細度が不必要に上がり、scoped CSS では各要素が独立クラスを持つため入れ子にする利点がない。ただし**子要素のスタイルが親自身の state・variant に条件づけられる場合は、その親の `&`-state・variant 内にネストする**（例: `.number-stepper { &.large { .value { … } } }` の large 時のみの値、`.card-button { &:active .card { … } }` の押下時のみの面の色）。条件が親側にあり親を参照しないと表現できないため、トップレベルには出せない。子要素自身の state（`.card` の `:hover` など）はその子要素のルール内にネストする

### デザイントークン

- トークンの**値**は `src/styles/tokens.css` の `:root` カスタムプロパティに集約する（単一ソース）。`main.ts` / `.storybook/preview.ts` で `global.css` より前に読み込む。各コンポーネントの scoped CSS からは `var(--*)` で参照する
- 多プロパティの**レシピ**（glow 付き数字・mono タブラー数字など）は共通 CSS ではなく**プリミティブコンポーネントに内包**して使い回す
- 命名はカテゴリ接頭辞: `--color-*` / `--font-family-*` / `--font-size-*` / `--font-weight-*` / `--line-height*` / `--space-<px>` / `--radius*` / `--shadow-*` / `--easing-*` / `--transition`（`--transition` は既定値のみのトークンなので bare 名。下記の bare 規則に従う）
- **`--font-size-*` の値は rem で定義する**。`global.css` の `html { font-size: 62.5% }` により 1rem = 10px なので、値はデザインの px ÷ 10（例: 14px → `1.4rem`）。% 基準のためブラウザのフォントサイズ設定（アクセシビリティ）にも追従する。スペーシング・radius など寸法系は px のままでよい
- **既定値は接尾辞なし（bare）・変種のみ接尾辞**を付ける（例: `--line-height` / `--line-height-tight`、`--radius` / `--radius-pill`、`--color-text` / `--color-text-secondary`）
- README の抽象名は用途が湧く名前に改名してよい（`fg`→`--color-text`、`line`→`--color-line` 等）。ただし**値は実デザイン（`docs/design/source/*.jsx`）に一致**させる。`font-size` の役割名（display/hero/stat…）は標準語なので維持しコメントで補足する
- **`body`（`global.css`）が既定の `font-family: sans` / `font-size: body` / `line-height` を設定済み**。scoped CSS では**既定を上書きするときだけ**指定する（数字・ラベルの `mono`、別サイズなど）。sans 本文への `font-family` 再指定はしない（body から継承させる）。`font-size: --font-size-body` も、祖先が別サイズを設定していない普通の要素では省略してよい（body から継承）
- **`line-height` の使い分け**: 本文・折り返しうる箇所は既定の `--line-height`（1.4・body 継承で無指定）。1 行で収まる見出し・ラベル・数字（`AppBar` / `BrandBar` のヘッダー、`ExerciseCard` の種目名、`BigNumber` の数字など）は `--line-height-tight`（1）で行ボックスを詰める
- **ただし `color: --color-text` は一律省略しない**。`<button>` / `<a>`（`CardButton` など）は UA スタイルで color を継承せず、明示が実働する（例: `BaseCard` の color は CardButton の `<a>` のリンク色を打ち消している）。プリミティブは自己完結のため明示してよい。省略してよいのは「継承で `--color-text` に解決し、かつ祖先が color を変えていない」普通の要素に限る

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
