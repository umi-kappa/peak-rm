# コーディング規約

PeakRM のコーディング・命名・アクセシビリティ・テスト・スタイル・ドキュメント表記の規約をここに集約する。実装前後で必ず参照する。技術スタック・仕様の詳細は `docs/spec.md` を、デザイントークンは `docs/design/README.md` を参照する。

## ディレクトリ構成

`src/` 配下は **責務で分割** する。各レイヤを共通ルールで分岐させる: **画面専用のものは各レイヤの `pages/<画面名>/` に置く**、**複数画面で使う横断的なものは各レイヤの共有バケツ（`shared/` など）に置く**（`components/` のみ App ルート専用の `app/` を加えた 3 分類。後述）。以下のツリーは目標構造であり、未実装のモジュールも含む（実装の進捗は GitHub Issues を参照）。

```
src/
  core/                # 純ロジック（副作用なし・I/O なし・型・計算・ルール）※フラット
    chartData.ts  constants.ts  deltaBadge.ts  duration.ts  linearProgression.ts  localDay.ts  menu.ts  oneRm.ts  session.ts  stepper.ts  types.ts
  storage/             # 永続化（Dexie / IndexedDB・リポジトリ・persist・backup）※フラット
    db.ts  sessionRepo.ts  backup.ts
  composables/
    pages/<画面>/       # 画面専用に切り出した composable（例: result/useResultSession）
    shared/
      error/           # useFatalError（エラー境界の状態。main.ts が生成し app.provide で共有）+ installErrorBoundary（4 経路の配線）
      navigation/      # useBackNavigation（AppBar の戻る標準。history.state.back があれば router.back()、無ければ fallback へ replace）
      session/         # useSession / useIntervalTimer（実行中セッションの状態系。useSession は main.ts が生成し router ガードと画面で共有）
      platform/        # useWakeLock / useAudioCue（ブラウザ API glue）+ installSessionEndRelease（セッション終端で解除する配線）
      ui/inputs/       # useNumberStepper（入力部品のブラウザ glue・長押しリピート等）
  components/
    app/               # App ルート（App.vue）専用のコンポーネント（ErrorScreen.vue）
    pages/<画面>/        # その画面専用のコンポーネント（例: menu/WeightStepper.vue）
    shared/
      session/         # セッション文脈の複数画面で使う複合コンポーネント（LpIndicator / MenuSummary / TimelineSetCard）
      ui/              # デザインプリミティブ（汎用・presentational・ドメイン非依存）※カテゴリ別
        base/          # 基底プリミティブ（BaseButton / BaseIcon / BaseLabel / BaseUnit / BaseCard / BaseDialog）
        buttons/       # IconButton（円形アイコン専用ボタン）/ CardButton（押せる面）。どちらも to で router-link / button を切り替える
        typography/    # 文字 / 数値の複合提示（BigNumber）
        inputs/        # NumberStepper
        layout/        # ScreenFrame / AppBar
        dialog/        # モーダルオーバーレイ（AlertDialog / ConfirmDialog / SetEditDialog）。ドメインを知る複合ダイアログもここに集約
  pages/                 # 画面エントリ（各画面 index.vue。Nuxt 風命名だがファイルベースルーティングではない）
    home/index.vue       # 種目に属さない画面は pages 直下
    [exercise]/          # 種目をトップレベルに置き、セッションフローを配下にネスト（URL /:exercise/… と一致）
      menu/index.vue  training/index.vue  interval/index.vue  result/index.vue
    history/index.vue  settings/index.vue
  router/index.ts        # vue-router のルート定義
  assets/
    icons/             # lucide 純正アイコン（ISC）の SVG 実体 + 名前一覧 index.ts（iconNames / IconName）+ NOTICE。BaseIcon.vue が glob で読む
  styles/  tokens.css  global.css
  stories/  router.ts  session.ts  platform.ts  topLayerDocs.ts   # Storybook 補助（全 story で 1 度だけ install する共有 router・fake sessionRepo / fake backup / Session fixture / セッション状態を駆動する loaders 用ヘルパー・音を鳴らさず Wake Lock も要求しない platform の fake・top layer に出る dialog 系 stories の Docs 描画を iframe 分離する topLayerDocs）
```

- **画面ディレクトリ名**: `home` / `menu` / `training` / `interval` / `result` / `history` / `settings`。うち `menu` / `training` / `interval` / `result` はセッションフローとして `[exercise]/` 配下にネストし、ディレクトリ構成を URL（`/:exercise/…`）と一致させる（`[exercise]` は動的セグメント `:exercise` を表すディレクトリ名。ファイルベースルーティングではなく実際のルートは `router/index.ts` で定義する）。種目に属さない `home` / `history` / `settings` は `pages/` 直下に置く
- **`core/` と `storage/` の分離**: `core/` は副作用を持たないドメインの中核（型・定数・純関数）。純関数（`oneRm` / `session` / `linearProgression` など）に加え、それらが共通語彙として使うドメインモデル（`types.ts`）と静的なドメインデータ（`constants.ts` の `EXERCISE_ORDER` / `EXERCISE_LABELS` など）も含む。型・定数は副作用ゼロで `storage → core`・`components・pages → core` の依存方向の規律にそのまま乗る最基底であり、`src/` 直下や別層に散らさず `core/` に集約する。`storage/` は IndexedDB という外部世界に触る層。依存方向は **`storage → core` の一方向**で、`core/` から `storage/` を import しない。これにより業務ルール（1RM 計算・progression）が永続化技術から独立する。読むだけの純関数（`sessionMaxOneRm` / `isComplete` など）の入力は `Session` でなく `ReadonlySession`（`types.ts`）で受け、`readonly()` で包まれた実行中セッション（DeepReadonly）もキャストなしで渡せるようにする。
- **静的なドメインデータ定数は `readonly` を型で保証する**: `const` は再代入しか防がず、要素・プロパティは書き換え可能なため明示的に `readonly` 化する。手段は配列とオブジェクトで非対称:
  - **配列**は型注釈 `: readonly T[]` だけで readonly 配列型になる（再代入・`push` をコンパイル時に弾く）。`as const` は要素リテラル付きの readonly タプルを作るが、反復用途ではオーバーキルなので使わない（例: `EXERCISE_ORDER: readonly Exercise[]`）。
  - **オブジェクト**は型注釈（`: Record<Exercise, string>`）では readonly にならないため `as const`（プロパティを `readonly` 化し書き換え・キー追加を弾く）+ `satisfies <型>`（`Record<Exercise, string>` などで網羅・値の型を保証）を併用する（例: `EXERCISE_LABELS = { … } as const satisfies Record<Exercise, string>`）。
  - 実行時の `Object.freeze` は使わない（外部入力ではないアプリ内定数のため過剰）。
- **`components/shared/ui/`** はデザインシステムのプリミティブ専用で、フラットに並べず **カテゴリ別サブディレクトリ**（`base/` / `buttons/` / `typography/` / `inputs/` / `layout/` / `dialog/`）に分ける。`base/` は単一要素にトークンで見た目を着せるだけの基底プリミティブ（`BaseButton` / `BaseIcon` / `BaseLabel` / `BaseUnit` / `BaseCard` / `BaseDialog`）専用で、`Base` プレフィックスで揃える。子要素の配置や画面領域の構造は与えず（見た目を着せるだけ）、面の土台 `BaseCard`（padding を持つだけで子の並びは制御しない）もここに含む。例外は `BaseDialog` で、ネイティブ `<dialog>` を使うモーダルの共有シェルとして、開閉（マウント = 表示。開閉は呼び出し側の `v-if` が唯一のソースで、マウントで `showModal()`・アンマウント前にフォーカス復元のため `close()`）・ESC / backdrop の `cancel` 配線・アクセシブルネーム（`title` prop → `aria-labelledby`）に加え、パネル構造（panel / header slot）まで内包する（足回りの非自明なイディオムを 1 箇所に集約するため、構造を持たない原則より共有を優先する）。子要素の配置・画面領域の構造を担うもの（`ScreenFrame` の全高縦 flex 外殻 + 本文領域（左右 padding + 縦 gap、デザインの ScreenBody 相当を内包）、`AppBar` の領域分割）は `layout/`、base の文字プリミティブを組み合わせて意味を持つ文字 / 数値を提示する複合（`BigNumber` の数値提示）は `typography/` に置く。見た目の variant 違いは別コンポーネントに分けず prop で吸収する（例: `BaseButton` の `variant: 'primary' | 'secondary'`）。確認・通知系のオーバーレイは `dialog/` に置く（`ConfirmDialog` は破壊的操作の確認に使う presentational なモーダルで、`title` / `message` などを prop で受け取り `confirm` / `cancel` を emit するだけ。遷移先や実処理は呼び出し側が担い、router・業務ロジックを持たないため `ui/` プリミティブに属する。結果を伝えるだけの `AlertDialog` も同じ形で、選択を求めないため確定 / キャンセルの区別を持たず `close` だけを emit する）。ネイティブ `<dialog>` の足回り・外殻は共有シェル `base/BaseDialog` に一元化し、それを使うドメインダイアログは `ui/dialog/` に集約する: `SetResult` や種目を知る `SetEditDialog` も `ConfirmDialog` と同じ `ui/dialog/` に置き、ドメインダイアログを 2 箇所に分けない（`BaseDialog` の足回りを共有する同族であることを、ドメイン非依存原則の純度より優先する）。`CardButton`（`to` で `<router-link>` / `<button>` を切り替える押せる面・`buttons/`）は `BaseCard`（presentational な面・`base/`）を内包して面レシピを再利用し、押せる affordance（focus / hover / press・クリック emit）だけを足す。面の単一ソースは `BaseCard` に置き、静的な面か押せる面かという役割で配置を分ける。`ui/` のプリミティブは presentational に保ち、インタラクションは affordance + イベント発火まで（クリック emit・`@back` など）に留める。ナビゲーションや業務ロジック（遷移先の判断・状態更新・router 参照）は持たせず呼び出し側に委ねる（例: `AppBar` の `back` は押下で `@back` を emit するだけで、遷移先は画面側が決める）。
- **ドメイン値の「不在」判定と表示整形は `core/` のヘルパーに集約する**。`sessionMaxOneRm` は計算対象のセットが無いとき `0` を返す（= 「0 は不在のセンチネル」）ため、その判定は `hasOneRm`、`—` へのフォールバックを含む表示整形は `formatOneRm` に寄せ、画面側で `> 0` や `toFixed(1)` を書き直さない。
- **`BaseLabel` は見出し / `BaseUnit` は単位とプレースホルダ**に使い分ける。セクション見出し（`SESSIONS` / `EST. 1RM`）は `BaseLabel`、値に添える単位（`KG` / `REPS`）と「記録なし」のプレースホルダ（ホームの `NO LOG`・履歴一覧の `NO SESSIONS`）は `BaseUnit`。現状は両者の CSS が同一なため見た目では区別できないが、見出し側のトークンを変えたときにプレースホルダが巻き込まれないよう役割で選ぶ。
- **`components/` はオーナー（利用箇所）で三分割する**: App ルート（`App.vue`）専用は `app/`、1 つの画面でしか使わないものは `components/pages/<画面>/`、複数画面で横断的に使うものだけを `shared/` に置く。例として WeightStepper（汎用 `NumberStepper` を 0.25 kg 刻みで包む重量入力）は Menu 設定画面でのみ使うため `components/pages/menu/` に、ErrorScreen（route を持たない全画面のエラー表示）は `App.vue` だけが mount するため `components/app/` に置く。「誰が使うか」が判断基準で、単一利用のものを `shared/` に置かない。`shared/` のうちデザインプリミティブは `ui/`、セッション文脈の複合コンポーネント（LpIndicator = 増量プレビュー / MenuSummary = メニューの 1 行サマリー / TimelineSetCard = セットタイムラインの 1 行。メニュー設定・インターバル・結果確認で共用）は `shared/session/` に置く（`composables/shared/session/` と同じ区分）。
- **ステッパーのロジックは 3 層に分離**する。ルールを純関数に寄せることで単体テストで完結させ、見た目とブラウザ依存を切り離す。
  1. `core/stepper.ts` = 純関数（increment / decrement / clamp・0.25 kg 刻みなどのルール。副作用なし）
  2. `composables/shared/ui/inputs/useNumberStepper` = ブラウザ glue（長押しリピートのタイマー・イベント処理）
  3. `components/shared/ui/inputs/NumberStepper.vue` = 見た目（presentational）
- **アイコンは単一 `BaseIcon.vue` に集約**する。種類ごとの個別コンポーネントは作らない。SVG 実体は **lucide 純正ファイル**を `src/assets/icons/<name>.svg` に置き、同階層の `src/assets/icons/index.ts` が名前一覧（`iconNames` 配列と、そこから導出される union 型 `IconName`）を持ち、**vite-svg-loader（`?component` でインライン展開）+ `import.meta.glob`** でファイル名 → コンポーネントのマップ（`icons`）をモジュールスコープで構築して export する。`BaseIcon.vue` はそのマップを `name`（`IconName`）で引くだけ。出典は **lucide（ISC）に統一**し、独自に描き起こさない（公開されている純正 SVG を無加工で使う）。アイコン追加は `assets/icons/` に lucide 純正 SVG を 1 ファイル置き、隣の `index.ts` の `iconNames` に名前を 1 つ足すだけ（作業が 1 ディレクトリで完結する）。ライセンス帰属として `src/assets/icons/NOTICE`（lucide LICENSE 全文・ISC + Feather 由来分の MIT）を置く。色は SVG ルートの `stroke="currentColor"` を親の `color` から継承させる（`vite.config` の `svgLoader` は `svgo: false` で属性を保持）。`<img>` での読み込みは使わない（外部リソース化で `currentColor` が効かないため。`?component` はインライン展開なので `currentColor` が効く）。
- **状態管理**: Pinia は導入しない。共有が必要な状態（実行中セッション）は composable（`useSession()`）の単一インスタンスを共有する。component tree の外にある router のセッションガードも同じインスタンスを参照するため、`main.ts` が生成して `createAppRouter` へ渡しつつ **`app.provide()`** で供給し、画面（セッションフローの menu / training / interval / result と、Import の確定で破棄する settings）が `inject` で受ける（`useFatalError` と同じ配線。後述）。依存リポジトリは composable の引数で注入する。
- **ブラウザ API の glue（`composables/shared/platform/`）も同じ配線に乗せる**。`useAudioCue`（AudioContext）と `useWakeLock`（WakeLockSentinel）はセッションフロー全体で状態を保持する必要がある一方、インターバル画面はセットごとに `router.replace` で再マウントされるため画面内では保持できない。`main.ts` が単一インスタンスを生成して `app.provide()` し、メニュー / トレーニング / インターバルが `inject` で受ける（stories は `src/stories/platform.ts` の fake を provide する）。解除は画面のライフサイクルではなく実行中セッションの終端に紐づけ、その配線（`installSessionEndRelease`）は `installErrorBoundary` と同じく単体テストできるモジュールへ出す。挙動は spec「Wake Lock のライフサイクル」を参照する
- **画面が直接使うリポジトリ（`sessionRepo`）も `main.ts` が `app.provide()` で供給し、画面は `inject` で受ける**。画面（`pages/**/index.vue`）から `@/storage/sessionRepo` の実体を直接 import しない。データ源を provide 経由に統一することで、全画面が Storybook の provide decorator で fake repo（`src/stories/session.ts` の `makeSessionRepo`）に差し替えられ、実 IndexedDB に依存せずページ stories を書ける（#82 で確立。injection key は実体を定義するファイルの末尾に置く: `sessionRepoInjectionKey` は `storage/sessionRepo.ts`、`backupInjectionKey` は `storage/backup.ts`、`sessionInjectionKey` は `useSession.ts`）。Export / Import のデータ源（`backup`）も同じ配線に乗せるが、テーブル単位の `sessionRepo` ではなく DB 全体の置換を担うため相乗りさせず専用 key で配る（設定画面が `inject` で受け、stories は `makeBackup` の fake に差し替える）。

`@/` alias の見え方の例: `@/core/oneRm`、`@/storage/sessionRepo`、`@/composables/shared/session/useSession`、`@/components/shared/ui/base/BaseButton.vue`、`@/components/shared/ui/inputs/NumberStepper.vue`、`@/pages/home/index.vue`、`@/pages/[exercise]/menu/index.vue`。

## ファイル命名

- **Vue コンポーネント**: PascalCase（`MenuSetup.vue`、`SessionResult.vue`）。Vue 公式スタイルガイド準拠。`components/shared/ui/` 配下の基底プリミティブで名前が 1 語になるもの（`BaseIcon` / `BaseLabel` / `BaseUnit` / `BaseCard`）は、Vue 公式の base component 規約に従い `Base` プレフィックスを付けて 2 語にする（`vue/multi-word-component-names` を満たすため）。修飾子を持つものはその機能名 2 語でよい（`IconButton` / `BigNumber`）
- **画面エントリ**: `pages/<画面>/index.vue`（Nuxt 風）。ディレクトリ名で一意に識別できるため `vue/multi-word-component-names` の対象外とする（`eslint.config.js` で `src/pages/**/index.vue` に限り無効化）
- **TypeScript ロジック・composable**: camelCase（`oneRm.ts`、`useSession.ts`）
- **コンポーネント隣接のモジュール**: 対象コンポーネントと同じ命名 ＋ 役割の接尾辞（`<コンポーネント名>.<役割>.ts`）。役割は次の 2 つに限り、汎用の受け皿（`.utils.ts` / `.helpers.ts` など）は作らない
  - `.type.ts`: 複数コンポーネントで共有する props の union 型など（`BaseCard.vue` → `BaseCard.type.ts` の `CardBorder`）
  - `.logic.ts`: `<script setup>` に置けないそのコンポーネント専用のロジック（`OneRmChart.vue` → `OneRmChart.logic.ts` の Chart.js 登録・描画設定の生成）。`composables/` との使い分けは後述「Vue コンポーネント」
- **テストファイル**: テスト対象と同じ命名 ＋ `.spec.ts`（`oneRm.ts` → `oneRm.spec.ts`）
- **Story ファイル**: 対象コンポーネントと同じ命名 ＋ `.stories.ts`（`BaseButton.vue` → `BaseButton.stories.ts`）
- **設定ファイル（プロジェクトルート）**: ツール慣習に従う（`vite.config.ts`、`eslint.config.js`、`.prettierrc.json`）

## import

- `src/` 配下のモジュールを参照するときは alias `@/` の絶対パスを使う（`import x from '@/core/oneRm'`）
- 同階層であっても相対パス（`./`、`../`）は使わない。`vite.config.ts` の `resolve.alias` と `tsconfig.json` の `paths` に `@/* → src/*` を定義済み
- この禁止は ESLint の `no-restricted-imports`（`eslint.config.js` の `app/no-relative-imports`）で機械的に強制する。対象は `src/**` のみ（alias `@/*` を張っているのが `src/*` だけのため、`src/` 外の設定ファイル等は対象外）
- サードパーティパッケージは通常どおりパッケージ名で import する
- `storage/` のリポジトリ（`sessionRepo` など）は **メソッドを束ねた 1 つのオブジェクトを export** する（`export const sessionRepo = { insert, list, ... }`）。個々の関数を named export しないことで、主語が消える `import { get }` を構造的に不可能にする（lint ルールではなく export 形で縛る）。メソッド名は主語を繰り返さず素の動詞にし（`get` / `put` / `list` / `insert` / `remove`）、主語は呼び出し側で `sessionRepo.list()` と表現する
  - **内部スタイル**: 各メソッドはモジュールスコープの関数として定義し、末尾の `export const repo = { ... }` で参照を束ねる（オブジェクトリテラル内にメソッドを直書きしない）。関数ごとに JSDoc を持たせられ、末尾の束ねがメソッド一覧（シグネチャの索引）として機能する

## Vue コンポーネント

- script ブロックは **`<script setup lang="ts">` 1 つに統一**する。通常の `<script lang="ts">` ブロックを併設しない
- コンポーネント外から参照する型・定数（props の union 型など）は `<script setup>` から export できない（値 export はビルド時に compiler-sfc が拒否する。vue-tsc では検出されない）ため、`.ts` モジュールに切り出して双方から import する（例: `assets/icons/index.ts` の `iconNames` / `IconName`、`BaseCard.type.ts` の共有 props 型）。モジュールスコープで 1 回だけ実行したい処理（`import.meta.glob` のマップ構築、Chart.js の `Chart.register` など）も `<script setup>` 内ではなく `.ts` 側に置く（`<script setup>` の本文はインスタンス生成ごとに実行されるため）
- **切り出し先は「リアクティブか」で決める**。どちらも 1 コンポーネント専用でよく、判断基準は再利用性ではなく中身の性質
  - **リアクティブな状態・ライフサイクル・イベント配線を扱う** → `composables/` のミラーパスに `use*` として置く（`components/shared/ui/inputs/NumberStepper.vue` → `composables/shared/ui/inputs/useNumberStepper`）
  - **リアクティブでないロジック**（ライブラリの登録、設定オブジェクトの生成、純粋な計算、モジュールスコープのキャッシュを伴う glue） → 隣に `<コンポーネント名>.logic.ts` を置く（`OneRmChart.vue` → `OneRmChart.logic.ts`）。`.vue` 側には props から導出する `computed` だけを残す
  - 実務的な目安: **中身の大半が `export function use…` の外に出るなら、それは composable ではない**。既存の composable は関数外が 8〜36%（import・docstring・定数のみ）に収まっている
- `<script setup>` 内は **変数宣言（route / inject / props / state）→ 関数 → ライフサイクル登録（`onMounted` 等）の順**に並べる。関数の間にフック登録や変数宣言を挟まない。変数宣言の中でも種類でまとめ、**`ref` を先に、`computed` を後に**置く（ref と computed を交互に並べない）
- **composable は関数単体でなく named なオブジェクトを返す**（`return { goBack }` → `const { goBack } = useBackNavigation()`）。呼び出し側の変数名が composable の意図した名前に揃い、公開項目の追加にも形を変えず対応できる
- **`computed` の writable 形（`get` / `set` を渡す形）は使わない**。読み取り専用の `computed` と、更新する名前付き関数に分ける（例: `useHistory` の `exercise`（URL から導出）と `selectExercise()`（`router.replace` で URL を書き換え））。代入式の裏に副作用（router 遷移・永続化）が隠れると、書いた直後に読めない・呼び出し側が同期的な更新だと誤解するため。使用側は `v-model` の代わりに `:model-value` と `@update:model-value` を分けて渡す
- **template にインライン式で処理を書かない**（`@back="router.push({ name: 'home' })"` 禁止）。イベントハンドラは script の名前付き関数に切り出す（`@back="goHome"`）。presentational コンポーネント内の単純な emit 転送（`@click="emit('confirm')"`）は例外
- **同名の prop バインドは same-name shorthand（Vue 3.4+）で書く**（`:open="open"` ではなく `:open`。`:to` / `:name` / `:border` も同様）。バインド先が同名の単純な変数のときだけ使え、別名・メンバー式・リテラル（`:inset="24"`）は通常の記法のまま
- **単一要素の文字色の階調を切り替える prop は `tone` に統一し、値は色トークン名の階調部分から採る**（`BigNumber` の `tone: 'default' | 'accent' | 'tertiary'`、`NumberStepper` の `tone: 'default' | 'accent'`）。既定は `default`（bare の `--color-text` には階調を表す部分が無いための例外）、変種は `accent`（`--color-accent`）/ `secondary`（`--color-text-secondary`）/ `tertiary`（`--color-text-tertiary`）に揃え、`muted` のようなトークンに無い視覚語を新しく作らない。2 値でも boolean（`accent: true`）にせず union にする（階調は排他なので、3 値以上なら「accent かつ tertiary」という矛盾を型で防げ、値が増えても呼び出し側の書き方が変わらない）。`accent` に付随する glow（`text-shadow`）のように色と不可分の装飾は含めてよいが、背景・枠・太さまで束ねる意味的な variant（`BaseButton` の `variant`）と、対象プロパティ名で受ける色 prop（`BaseCard` の `border`）はこの規則の対象外。prop を持たず内部で階調クラスを出し分ける場合も語彙は揃える（`SessionSummaryCard` のステータスバッジと推定 1RM が、どちらも `tertiary` などの階調クラス名で切り替える）
- props は型引数つき `defineProps` を **reactive props destructure**（Vue 3.5+）で受け、デフォルト値は分割代入のデフォルト値で書く（`const { size = 16 } = defineProps<{ size?: number }>()`）。`withDefaults` は使わない
  - destructure した props を `<script setup>` 直下の式で使うとリアクティビティを失う（setup は 1 回しか走らない）。派生値は `computed` かテンプレート内の式にする

## アクセシビリティ

ネイティブ要素で表現できる範囲に絞り、**名前付け**と**グループ化**だけを明示的に足す。複合 role を自作すると矢印キー・roving tabindex・値の同期という実装契約を抱え込み、壊れたときに何も指定しないより悪くなるため（No ARIA is better than bad ARIA）。

- **名前付け（必須）**: 可視テキストを持たないコントロールに `aria-label`（`IconButton` の `label`、`NumberStepper` の Decrease / Increase）、装飾 SVG に `aria-hidden="true"`（`BaseIcon`）、ダイアログ・入力とラベルの紐付け（`BaseDialog` の `title` → `aria-labelledby`、`SetEditDialog` の NOTE）。**可視テキストを持つ要素には `aria-label` を付けない**（画面の文字列とアクセシブルネームが食い違うと音声コントロールが壊れる。WCAG 2.5.3 Label in Name）
- **名前の渡し方は対象で決める**: ネイティブ要素（`textarea` など）は見出しに `id` を振って `aria-labelledby` で指す（`SetEditDialog` の NOTE）。コンポーネントは名前を prop で受ける（`IconButton` / `NumberStepper` の `label`）。プリミティブは自分が何の値かを知らないため、名前の決定は呼び出し側に置く
- **グループ化（必須）**: 複数のコントロールが 1 つの意味単位を成すときだけ `role="group"` + 名前を付ける。対象は `ExerciseTabs`（種目の絞り込み）と `NumberStepper`（- / 値 / + で 1 つの数値入力）の 2 つに限る
- **複合 role は作らない**: `tablist` / `radiogroup` / `spinbutton` などに上げない。`ExerciseTabs` のタブは URL query に載る絞り込み条件でパネルの表示切替ではないため `tablist` は実態と合わず、`radiogroup` / `spinbutton` は矢印キー移動を実装契約として要求する
- **選択状態は `aria-current`**（`aria-pressed` は使わない）。`ExerciseTabs` は常に 1 つが選択されている集合であり、「独立したトグルが全 off になり得る」という `aria-pressed` の含意と合わない
- **本文の `<main>` は `ScreenFrame` が持つ**。画面側で `<main>` を書かない（`ErrorScreen` を含む全画面に一括で効く）。banner は `AppBar` / `BrandBar` の `<header>`、navigation はホーム footer の `<nav>` がそれぞれ持つ（`#header` スロットは `div` なので、中の `<header>` がそのまま banner になる）。footer のアクションバーはランドマークにしない（`contentinfo` は主 CTA と意味が合わない）
- **`<section>` は名前を付けられる領域にだけ使う**: `aria-labelledby` で見出し（`BaseLabel`）の静的な `id` を指す（`id` は `<画面 or コンポーネント>-<領域>-label`。衝突しない範囲で短縮してよい）。名前の無い `section` は region にならず見出しが視覚的な装飾で終わるため、名前を付けないなら `div` にする（カード内・ダイアログ内の見出し付き領域は `div` のまま）。静的な `id` を使えるのは 1 画面に 1 度しか描画されない領域（`v-for` の外）だけで、同一ドキュメントに複数インスタンスが立ち得る再利用プリミティブは `useId()` で振る（`BaseDialog` の `title`）。region の名前は `BaseLabel`（`<span>`）が出すため本文に見出し要素は無く、見出しナビゲーションでは辿れない（`BaseLabel` はカード内でも使う汎用プリミティブなので `<h2>` に上げられない。region ナビゲーションで辿れることを前提にする）
- **同種の項目が反復する一覧は `<ul>` / `<li>` で書く**（セット一覧・履歴一覧・ホームの種目カード）。件数と位置（「3 件中 2 件目」）が読まれる。反復しない設定行・stat 行は `div` のままにする（件数が意味を持たない）。同じコレクションを回していても、項目自身がコントロールで 1 つの意味単位を成すものは list にしない（`ExerciseTabs` は `EXERCISE_ORDER` を回すが絞り込みコントロール群なので、上記「グループ化」の `role="group"` 側）。`v-for` は `<li>` に置き、`ul` には `role="list"` を明示する（Safari は `list-style: none` で list セマンティクスを外す）。余白・マーカーのリセットは `global.css` が持つため、各画面では並べ方（`display` / `gap`）だけ書く
- **キーボードはネイティブの範囲まで保証する**: DOM 順のフォーカス移動（独自の `tabindex` は足さない）・Enter / Space でのアクティベーション・フォーカスの可視化（UA 既定の outline を消さない。ボタン・リンクは `&:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }` のリングで揃える。入力欄（`SetEditDialog` の `textarea`）はキャレットでフォーカスが分かるため UA 既定に任せる）。矢印キー移動・roving tabindex・ショートカットは作らない（Tab で辿れれば操作は完結する）。**スクロールコンテナ（`ScreenFrame` の `<main>`）に `tabindex="0"` は足さない**（モバイル前提のため、キーボードのみで長文をスクロールする経路は対象外。`ErrorScreen` の長い例外メッセージが該当しうる）。**pointer イベントだけで操作を組むと Enter / Space で動かない**ため、`@pointerdown` 系のハンドラを足すときは同じ操作がキーボードでも成立するか確認する（`NumberStepper` は `@keydown.enter` / `@keydown.space.prevent` で 1 step 適用し、長押しリピートは OS のキーリピートに任せる）
- **毎秒書き換わる値に `aria-live` / `role="timer"` を付けない**（インターバルの残り時間）。読み上げが暴走するだけで、0 秒到達の通知は音のみという spec の決定とも整合する。**ステッパーの値の変化も読み上げない**（`spinbutton` を避けた代償。`aria-live` を足すと 100ms 間隔の長押しリピートで同じく暴走するため付けない）
- **`prefers-reduced-motion` は対応しない**。現状の `transition` は背景色・文字色の短い変化のみで視差・移動・拡大がなく、プログレスバーも `width` の直接更新（`transition` 無し）で動き自体が進捗という機能表現。将来アニメーションを足すときはこの基準で再判定する
- **名前の字形は 2 種類に分ける**: 可視テキストを持たないコントロールの名前は **Title Case の英語**（`Back` / `Settings` / `Delete` / `Decrease` / `Increase` / `Exercise`）。画面に同じ文字列が出ているものをミラーする名前は**可視文字列そのまま**（`NumberStepper` の `label` = `REPS DONE` / `WEIGHT`。可視テキストと食い違わせない WCAG 2.5.3 の要請）。可視文言は大文字を文字列で書くため（`START SESSION` / `KG`。「スタイル（CSS）」節の `text-transform` 禁止を参照）後者は大文字になる。stories が渡すラベルも同じ規則に従う
- **テキストのコントラストは AA（4.5:1）を満たす**: 3 次テキスト（`--color-text-tertiary`）は不透明な常設面（`--color-bg` / `--color-bg-pending` / `--color-bg-light`）で満たす値に置いている。**面を持続的に薄くするときは `opacity` を使わない**（要素ごと減衰してテキストも一緒に落ちる。`TimelineSetCard` の pending は合成後 2.15:1 だった。押下の瞬間フラッシュのような一時的な演出は対象外）。面と枠線に専用トークン（`--color-bg-pending` / `--color-line-pending`）を当て、テキストは 3 次のまま置く（4.69:1）。hover / 押下で面が上がる箇所は、その状態で 3 次テキストも 1 段上げる。面が `--color-line-dark` に上がるカードは `TimelineSetCard` と `CardButton` の 2 つで、どちらも「デザイントークン」節のスコープ内トークン再定義で解決している（`CardButton` 側は配下の `ExerciseCard` / `SessionSummaryCard` にも自動で効く）。面が `--color-line` に上がるボタン・タブは背景と一緒に文字色を `--color-text` へ上げる（`ExerciseTabs` は 3 次から、`IconButton` は 2 次からなので AA の判定対象ではない。`NumberStepper` は値が最初から `--color-text` なので背景だけ変える）。再定義が要るのは**上がった先の面で 3 次テキストが AA を割るときだけ**（`--color-bg-light` へ上がる面なら 4.53:1 で足りるので何もしない）。そのうえで**上げたい 3 次テキストが自分の要素だけにあるか（→ `color` を直接書く）、子コンポーネントや slot の内側にもあるか（→ トークン再定義）**で決める。同じ行に並ぶアイコンは非テキスト（3:1）で単独では足りているが、見た目を揃えて一緒に上げる。色トークンの値を動かすときは 3 段（`--color-text` / `-secondary` / `-tertiary`）の間隔ごと見直す（下段だけ上げると階調が潰れる）
- **`@storybook/addon-a11y` は入れない**。方針が名前付け + グループ化に閉じており、依存と CI 時間の追加に見合わない

## 状態表現（操作できない状態）

「今は操作できない」の表し方を 2 つに分ける。判断基準は「その画面・その文脈にいる限りずっと操作できないのか、それとも一時的に押せないだけか」。

- **恒久的に操作できない（read-only な文脈）** → **入力 UI ごと出さない**。`disabled` にして残さず、静的表示へ切り替える（履歴一覧から開いた結果確認画面のセット編集。spec「実績値の編集ポリシー」）。押せないコントロールを並べても操作肢を探させるだけで、状態モデル上そもそも操作肢を持たないことを UI でも表す
- **常設のコントロールが一時的に押せないだけ** → **ネイティブの `disabled`** で活性 / 非活性を表す（インターバル画面の通知音の停止ボタン。鳴っていない間は押せない）。位置が動くと慌てて探すことになるコントロールは、消さずに置いたまま状態だけ変える

いずれの場合も**見た目だけ落として押せるままにはしない**。押せるように見えて何も起きない状態は、支援技術にも指にも嘘をつくため、ネイティブの `disabled` で「今は押せない」を正しく伝える。見た目の書き方は「スタイル（CSS）」節を参照する。

## 型定義（TypeScript）

- アプリ内部の型は、オブジェクト形状も含め原則 **`type`** で定義する（`type Session = { ... }`）。ユニオン型（例: `type Exercise = 'benchPress' | 'squat' | 'deadlift'`）が `type` 必須なため、全体を `type` に揃えて表記の混在を防ぐ
- **`interface` は declaration merging が必要な型拡張のみ**に使う（例: `vite-env.d.ts` の `ImportMetaEnv` 拡張）。アプリ内の閉じたドメインモデルは `interface` にしない。意図しない再宣言マージ（footgun）を防ぎ、`Readonly<>` で固める不変モデルの思想とも揃える
- **値の不在は `null` ではなく `undefined` で表す**（`Session | undefined`、リポジトリの「見つからない」も `undefined`）。Dexie の `.get()`・`Array.at()`・`?.`・`??` の自然な返り値が `undefined` であり、`?? null` のような変換を挟まないため。`null` リテラルは ESLint（`unicorn/no-null`）で禁止している
- **モジュールスコープの定数は SCREAMING_SNAKE_CASE で命名する**（`MENU_MAX` / `ONE_RM_DIVISOR` / `NUMBER_STEPPER_REPEAT_DELAY_MS`）。対象は値が固定のプリミティブ・静的データで、インスタンス・injection key・関数（`sessionRepo` / `db` / `sessionInjectionKey`）は camelCase のまま
  - 定数オブジェクトの**キーは大文字化せず camelCase のまま**にする。キーはドメイン型のフィールド名や値の写し（`MENU_MAX.weight` ← `Menu`、`ONE_RM_DIVISOR` のキー ← `Exercise`）であり、一致しているからこそ `satisfies` による網羅検査と spread での焼き込み（`{ exercise, ...DEFAULT_MENU }`）が成立する。大文字化の境界は識別子まで

## エラーハンドリング

想定外の失敗は境界 1 箇所で受けて全画面エラー表示にし、縮退（最善努力）だけを呼び出し元で明示的に catch する。判断基準は「**この失敗は根幹（トレーニングを実行して実績を記録し、それを正しく見せること）を壊すか？**」（spec「⚠️ エラーハンドリング」）。

- **壊さない（周辺の縮退）**: Wake Lock / タイマー音 / `requestPersistentStorage` など、spec が最善努力と定めるもの。呼び出し元で catch して継続し、**spec の根拠をコメントに書く**（明示的なオプトイン）
- 縮退が**ブラウザ API の glue に閉じ、呼び出し元に判断が要らない**場合は、catch を各呼び出し箇所へ広げず **composable 側で握り切る**（`platform/` の `useAudioCue` / `useWakeLock` は「失敗しても reject しない API」として定義し、内部で try/catch して `console.error` に留める）。呼び出し元は `void audioCue.prepare()` のように投げっぱなしでよく、同じ catch を分散させない
- **壊す・不明（想定外）**: IndexedDB 読み書き失敗・配線バグ・未知の例外。**画面では catch せず境界へ流す**。分類に迷ったら catch しない（分類漏れは自動的にエラー画面側へ落ちるため安全側）
- **ユーザーが与えた入力の不正は「失敗」ではなく結果の 1 つ**として、例外ではなく値で返す（`storage/backup.ts` の `parseImport` は `{ ok: true, sessions } | { ok: false, message }` を返す）。想定内なので画面が受けて表示に落とし、`try` / `catch` で想定外と混ぜない。同じモジュール内でも I/O の失敗（`replaceAll` の書き込み）は従来どおり throw して境界へ流す
- `console.error` だけの catch（握りつぶし）は書かない。「動いているが中身が事実と違う」状態（例: 読み取り失敗を「未記録」と同じ空表示にする）は縮退ではなく根幹の破壊として扱う
- 境界の実装は `main.ts` が `installErrorBoundary`（`composables/shared/error/`）で 4 配線（`app.config.errorHandler` / `router.onError` / `unhandledrejection` / `window` の `error`）を張り、`useFatalError` へ集約 → `App.vue` が `ErrorScreen` に切り替える。Vue は async イベントハンドラ・async ライフサイクルフックの reject も `errorHandler` へ流すため、画面側は catch を書かなければ自動で境界に落ちる
- `useFatalError`（`composables/shared/error/`）の共有も「状態管理」の provide/inject 方式に乗せる。配線元の `main.ts` が component tree の外にあるため、App ルートの `provide()` ではなく **`app.provide()`** で供給する（main.ts が生成したインスタンスの `report` を 4 配線へ直接渡し、読み手の `App.vue` は inject で受ける）

## テスト

Vitest を projects 構成で動かし、ロジック層の単体テスト（`unit` project、`happy-dom`）と、Storybook の play 関数によるコンポーネントのインタラクションテスト（`storybook` project、`@storybook/addon-vitest` + **headless Chromium**）の両方を実行する。`npm test` で両 project が走る。ロジックとコンポーネントで役割を分担し、同じ振る舞いを両方で書かない。

`storage/` のテストも `unit` project で動かす。happy-dom は IndexedDB を持たないため、`unit` project の `setupFiles` に `fake-indexeddb/auto` を読み込んでグローバルを補う。リポジトリのテストは `beforeEach` で `db.delete()` → `db.open()` してケース間の状態を分離する。

`unit` project の `env` で `TZ` を `Asia/Tokyo`（DST の無い UTC+9）に固定する。CI 既定の UTC ではローカル日付と UTC 日付が一致してしまい、`core/localDay` の「ローカル基準で日を判定する」保証（UTC の `toISOString` への退化）をテストが検出できないため。UTC+9 で両者がずれるのはローカル 0〜8 時だけなので、**日付ラベルのローカル / UTC を判別するテストはその時間帯の時刻を使う**（例: `new Date(2026, 0, 2, 0, 0)`）。`storybook` project は browser 実行のため `env` が `import.meta.env` にしか届かず TZ を変えられず、host の TZ のまま走る。**どちらの project でも、日付を扱う fixture は TZ オフセットを前提にせず** `new Date(2026, 0, 1, 9, 0)` のようにローカル日付の構成要素から組み立てる（TZ を固定した `unit` 側でも、オフセットを織り込んだエポック値は使わない）。

コンポーネントのインタラクションは原則 Storybook の play が担うが、例外として **`RouterView`（route outlet）を内包するため Storybook で Story 化できないルートコンポーネント（`App.vue` など）は `@vue/test-utils` の `mount` で `unit` project のマウントテストを書いてよい**。

- マウント時は RouterView を `global.stubs` で置換し、依存する store は `global.provide` で注入して、統合点（テンプレートの分岐・inject ガード）そのものを検証する
- `provide` / `inject` への依存だけでは例外の根拠にならない。provide / inject は本アプリ標準の状態管理機構であり、inject する presentational な画面は Storybook の provide decorator で Story 化して play + Chromatic が担う
- プレゼンテーショナルなコンポーネントの見た目・振る舞いは従来どおり Storybook が担い、二重には書かない

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
- **例外: 画面内部の状態でしか到達できない見た目（確認ダイアログ・結果モーダルなど）を snapshot に残す場合に限り、その状態へ到達させるためだけの `play` を持つ visual story を許容する**（`disableSnapshot` は付けない）。この `play` には `expect` による振る舞いの検証を置かず、状態への到達で終える（振る舞いは別立ての `Behavior` が持つ）。表示条件が prop / args にあるならこの例外には当たらないので args で到達させる（例外に当たるのは `pages/settings` の `ImportFailed` / `ImportConfirm`）
- **要素は `getByRole` の `name`（アクセシブルネーム）で引く**。`aria-label` / `aria-labelledby` の配線がそのまま検証対象になり、名前が壊れた時点でテストが落ちる（`BaseDialog` / `SetEditDialog` の story が `title` / NOTE ラベルの紐付けをこの形で守っている）。テスト用の `data-testid` は足さない
- **画面（`pages/**/index.vue`）はすべてページ stories を持つ**（代表状態の visual story + 配線確認の `Behavior`。子コンポーネント側の `Behavior` が既に担う配線は二重に書かない）。画面のデータ源（`sessionRepo` / `backup`・セッション状態）は provide 経由で注入される設計（「状態管理」節）なので、stories は provide decorator で `src/stories/session.ts` の fake（`makeSessionRepo` / `makeSessionStore` / `makeBackup`）を注入し、実 IndexedDB に依存しない

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import IconButton from '@/components/shared/ui/buttons/IconButton.vue'

const meta: Meta<typeof IconButton> = {
  component: IconButton,
  args: { name: 'plus', label: 'Add set' },
}

export default meta

type Story = StoryObj<typeof IconButton>

export const Default: Story = {}

export const Behavior: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Add set' })).toBeVisible()
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
- 値（色・タイポグラフィ・スペーシング）は `docs/design/README.md` のデザイントークンに厳密に従う。README に載っていない値の扱いは本書の「デザイントークン」節を参照する
- **余白（`padding` / `margin` / `gap`）は `--space-*` トークンを `var()` で参照する**。生の px を直書きしない。同じ役割の余白は同じトークンに揃える（例: 画面外周は `--space-24`、カード内側は `--space-16`）。余白の値は外側ほど大きい入れ子の階層（画面 ⊃ カード ⊃ バー）として意図的に段階を持たせており、段数を減らすかは実画面の実装の中で判断する
- **ヘッダーバー（`AppBar` / `BrandBar` など）は `ScreenFrame` の `#header` スロットに入れる**。高さは固定せず `padding-block`（`--space-8`）で作り、`padding-inline` は画面外周（`--space-24`）に揃えて本文（ScreenBody）と左右の縦ラインを合わせる
- **`text-transform: uppercase` は使わない**。大文字で見せたいテキストは呼び出し側がラベル文字列そのものを大文字で書く（例: `START SESSION`・`KG`）。表示とソース文字列（コピー・読み上げ内容）を一致させる
- **非対称な余白・寸法は論理プロパティで書く**（`padding: 0 20px` ではなく `padding-block: 0; padding-inline: 20px`）。四辺均等・全辺ゼロ（`padding: 24px`、`margin: 0`）は物理表記と意味が変わらないため shorthand のままでよい
- **ボタン共通の interaction reset**（`cursor: pointer`・`-webkit-tap-highlight-color: transparent`）は `global.css` の `button` ルールに置く。レシピ（見た目）と違い全ボタン無条件のリセットなので、各コンポーネントで繰り返さない。**`ul` の余白のリセット**（`margin` / `padding`）も同じ扱いで `global.css` に置く（一覧はすべて読み上げのための list で、箇条書きとしては使わない）。マーカーのリセットは `ul[role='list']` に絞り、`role` を書き忘れた `ul` にマーカーが残るようにする（セマンティクスの欠落を見た目に出す）
- **面を持続的に薄くするときは `opacity` を使わない**（テキストのコントラストが一緒に落ちる。理由と代替は「アクセシビリティ」節を参照）
- **`transition` は対象プロパティを明示する**（`transition: background-color var(--transition), color var(--transition)`）。プロパティ省略（= `all`）は全プロパティが変更監視され、意図しない変化（レイアウト系含む）までアニメーションされるため使わない
- **親の scoped CSS から子コンポーネントのクラス名を直接指定しない**（`.diff .base-icon { … }` のような子のルートクラスへの結合は禁止）。子コンポーネントに手を入れたい場合は呼び出し側で class を渡し（`<BaseIcon class="chevron" />` → `.chevron { … }`）、自分が付けた名前に対してスタイルを書く
- **親の要素のクラス名を、自テンプレートで描画する子プリミティブの modifier 語彙と同名にしない**（modifier 語彙 = prop 値がそのまま root のクラスになるもの。`BigNumber` の `size` / `tone`、`BaseCard` の `border`、`BaseUnit` の `size`、`BaseButton` の `variant`、`NumberStepper` の `large`、`TimelineSetCard` の `state`、`BaseDialog` の `inset-*`）。Vue は子コンポーネントの root にも親の scope 属性を付けるため、親の `.hero { … }` が `<BigNumber size="hero">` の root にも当たってしまう（意図せず上の禁止と同じ結合になる）。用途を表す名前にする（例: `result` / `training` のヒーロー領域は `.hero-stack`、`SetEditDialog` の値 + 単位の行は `.value-line`）。root 以外の要素に付くクラス（`NumberStepper` の `.value` の `tone` など）は親の scope 属性が届かないので対象外。判定は**そのプリミティブを自テンプレートで描画するか**で行い、描画しないコンポーネントの同名クラスも対象外（`TimelineSetCard` の `.line` は `BaseCard` を、`ScreenFrame` の `.body` は `BaseUnit` を描画しないため衝突しない。slot に流し込まれる内容は包む側の scope 属性を受け取らないので、slot 経由でも漏れない）
- **アイコンサイズは 3 値（12 / 16 / 24）に絞る**（スペーシングと同じ 4px グリッド上。14・18・20・22 などの中間値は使わない）。12 = 行内の差分 chevron・インラインマーカー、16 = 行アイコン（行頭・行末とも。`BaseIcon` のデフォルトなので `size` を省略する）、24 = 大型コントロール（ステッパー large・`IconButton`）。用途に対応するサイズは `docs/design/README.md` の Assets 節と同期する
- **プリミティブの外形幅は親が決める**。`ui/` プリミティブは `width: 100%` で親に追従させ、内容幅に詰める・幅を固定するなどのレイアウト都合は使用側（wrapper 要素の `width` / `min-width`）に置く。外形サイズを切り替える variant prop（`fit` など）は作らない。レイアウト用の数値（桁数変動でボタン位置がずれないための最小幅など）はマジックナンバーになるが、プリミティブに内包せず使用側のコンテキストに置く。例外は `BaseDialog` の `inset` prop（`16 | 24`）: top layer に描画されるため通常フローの親が幅を決められず、画面端からの横インセットを prop で受ける
- **state・variant はその要素のセレクタ内に `&` でネストする**。`.base-button:hover` や `.base-button.primary` を別のトップレベルルールに並べず、`.base-button { &.primary { … } &:active { … } }` のように入れ子にして同じ要素のルールを一箇所に集約する。`@media (hover: hover)` の `:hover` も対象セレクタ内に置く（`.icon-button { @media (hover: hover) { &:hover { … } } }`）。一方で**子要素を無条件に指すセレクタ（`.card` / `.button` / `.value` など単体）はネストせずトップレベルに置く**。無条件の子スタイルを親に入れ子にすると詳細度が不必要に上がり、scoped CSS では各要素が独立クラスを持つため入れ子にする利点がない。ただし**子要素のスタイルが親自身の state・variant に条件づけられる場合は、その親の `&`-state・variant 内にネストする**（例: `.number-stepper { &.large { .value { … } } }` の large 時のみの値、`.card-button { &:active .card { … } }` の押下時のみの面の色）。条件が親側にあり親を参照しないと表現できないため、トップレベルには出せない。子要素自身の state（`.card` の `:hover` など）はその子要素のルール内にネストする
- **`disabled` の見た目は色を一段落とす（`--color-text-tertiary`）+ `cursor: default`**。あわせて hover / active を `&:not(:disabled)` で囲い、押せない間は反応しないようにする（`IconButton`）。どの状態に `disabled` を使うかの判断基準は「状態表現（操作できない状態）」節を参照する

### デザイントークン

- トークンの**値**は `src/styles/tokens.css` の `:root` カスタムプロパティに集約する（単一ソース）。`main.ts` / `.storybook/preview.ts` で `global.css` より前に読み込む。各コンポーネントの scoped CSS からは `var(--*)` で参照する
- **例外: 面が変わるスコープでは、そのスコープに限って色トークンを再定義してよい**（例: `CardButton` / `TimelineSetCard` の hover・押下で `--color-text-tertiary: var(--color-text-secondary)`）。カスタムプロパティの継承は scoped CSS の境界を越えて slot の中まで届くため、子コンポーネントの内部クラス名を指定せずに配下の 3 次テキストを一括で 1 段上げられる（「親の scoped CSS から子コンポーネントのクラス名を直接指定しない」と両立する）。**再定義できるのはテキスト階調 3 段（`--color-text` / `-secondary` / `-tertiary`）に限り、値は `:root` にある別のトークンを指す**（新しい色をここで作らない）。**面の `transition` は配下へ継承されないので、`color` を宣言した側が `transition: color` も持つ**（プリミティブなら自分の scoped CSS に置く。持たせないと面だけフェードして文字色が瞬間で切り替わる）。3 つ目の消費者が出たら、この 1 行を配り続けるのではなく `TimelineSetCard` を `CardButton` + `BaseCard` へ寄せることを検討する
- 多プロパティの**レシピ**（glow 付き数字・mono タブラー数字など）は共通 CSS ではなく**プリミティブコンポーネントに内包**して使い回す
- 命名はカテゴリ接頭辞: `--color-*` / `--font-family-*` / `--font-size-*` / `--font-weight-*` / `--line-height*` / `--space-<px>` / `--radius*` / `--shadow-*` / `--easing-*` / `--transition`（`--transition` は既定値のみのトークンなので bare 名。下記の bare 規則に従う）
- **`--font-size-*` の値は rem で定義する**。`global.css` の `html { font-size: 62.5% }` により 1rem = 10px なので、値はデザインの px ÷ 10（例: 14px → `1.4rem`）。% 基準のためブラウザのフォントサイズ設定（アクセシビリティ）にも追従する。スペーシング・radius など寸法系は px のままでよい
- **既定値は接尾辞なし（bare）・変種のみ接尾辞**を付ける（例: `--line-height` / `--line-height-tight`、`--radius` / `--radius-pill`、`--color-text` / `--color-text-secondary`）
- **`--color-bg-*` / `--color-line-*` は `:root` 内で暗い順に並べる**。`-dark` / `-light` は明度の方向を持つが `-pending` のような用途名は持たない（`--color-bg-pending` は `--color-bg` より明るく、`--color-line-pending` は `--color-line` より暗い）ので、並びで読めるようにしておく。半透明の `--color-backdrop` はこの連なりに入れない
- README の抽象名は用途が湧く名前に改名してよい（`fg`→`--color-text`、`line`→`--color-line` 等）。ただし**値は `docs/design/README.md` に一致**させる。README はデザインの上流正本で、実装名・prop の都合を逆流させない。README に書かれていない値（個別画面のレイアウト数値など）は、`tokens.css` と各コンポーネントの実装（ソースコメントに理由を残す）が事実上の正本になる。`font-size` の役割名（display/hero/stat…）は標準語なので維持しコメントで補足する
- **`body`（`global.css`）が既定の `font-family: sans` / `font-size: body` / `font-weight: regular` / `line-height` を設定済み**。scoped CSS では**既定を上書きするときだけ**指定する（数字・ラベルの `mono`、別サイズなど）。sans 本文への `font-family` 再指定はしない（body から継承させる）。`font-size: --font-size-body` も、祖先が別サイズを設定していない普通の要素では省略してよい（body から継承）。ただし form control（`input` / `select` / `textarea`）は UA の `font` ショートハンドが継承を断つため `font: inherit` を明示する（`global.css` のリセットは `button` のみ。例: `SetEditDialog` の `<textarea>`）
- **`line-height` の使い分け**: 本文・折り返しうる箇所は既定の `--line-height`（1.4・body 継承で無指定）。1 行で収まる見出し・ラベル・数字（`AppBar` / `BrandBar` のヘッダー、`ExerciseCard` / `SessionSummaryCard` のカードルート、`BigNumber` の数字など）は `--line-height-tight`（1）で行ボックスを詰める。なお**カード等のコンテナ側に tight を敷いた場合、その中の折り返しうる子要素（両カードの `.reps`）には `--line-height` を明示して打ち消す**（継承のため無指定では tight のままになる）
- **`font-weight` の使い分け**: 既定は body が持つ `--font-weight-regular`（500）なので、明示するのは既定と違う太さのときだけ（`--font-weight-semibold` / `--font-weight-bold` の用途は `tokens.css` のコメントに従う）。`--font-weight-regular` を書くのは**祖先が別の太さを敷いている中で既定へ戻す場合**に限る（`BaseUnit` は `NumberStepper` の bold な値の内側に置かれるため打ち消しが実働する。祖先が太さを変えていない `BaseLabel` では書かない）。`line-height` の tight を子で打ち消すのと同じ構造
- **ただし `color: --color-text` は一律省略しない**。`<button>` / `<a>`（`CardButton` など）は UA スタイルで color を継承せず、明示が実働する（例: `BaseCard` の color は CardButton の `<a>` のリンク色を打ち消している）。プリミティブは自己完結のため明示してよい。省略してよいのは「継承で `--color-text` に解決し、かつ祖先が color を変えていない」普通の要素に限る

## PWA・静的アセット

- 静的アセット（PWA アイコン・favicon など）は `public/` に置き、ビルド時に `dist/` 直下へコピーする
- PWA アイコンは手書きせず `assets/icon-source.svg` を元に `@vite-pwa/assets-generator` で再生成する。`pwa-assets.config.js` で `minimal-2023` プリセットの出力サイズと追加余白なしの設定を管理し、生成した PNG / favicon を `public/` へ移して使う

## .gitignore

フラットな羅列ではなく、`# Dependencies`、`# Build outputs`、`# Test / coverage` のようなコメント見出しでセクション分けして記述する。

## ドキュメント表記

- **スラッシュ**: 半角 `/`（前後にスペース）。例: `Vitest / Storybook`
- **コロン**: 半角 `:`
- **句読点**: 全角（、。）
- **日本語文中の括弧**: 全角（）
- **コード・英字の括弧**: 半角 ()
