# PeakRM

1RM の成長を可視化するシンプルなトレーニングアプリ。ベンチプレス / スクワット / デッドリフトの記録から推定 1RM を算出し、その推移を追う PWA。データはログイン不要で端末ローカル（IndexedDB）に保存する。

**[主な機能](#主な機能)は一通り実装済み**。仕上げ（アクセシビリティ改善）が残っている。

## コンセプト

**計画通りに実行させる筋トレアプリ（甘え防止）**。トレーニング中の意思決定を排除することを核の価値に置く。

- **メニューはトレーニング前に確定する**。開始時点のメニューはセッションに焼き込まれ、実行中は変更できない（UX 上の制約ではなく設計上の不変条件）
- **「入力」ではなく「実行」にフォーカスする**。操作ステップを最小化し、確認ダイアログや設定変更の導線をトレーニング画面に持ち込まない（例外は破壊的操作であるスキップ・中断のみ）
- **記録するのは実績のみ**。セットのスキップもセッションの中断も記録対象で、なかったことにはしない
- **増量は自動で提案する**（linear progression）。直前セッションを完遂していれば、次回のメニューに増量幅を上乗せした重量を初期表示する

利便性のために選択肢を増やす変更はこのコンセプトと衝突するため、種目の追加・クラウド同期・詳細分析・トレーニング挙動を変える設定項目は意図的にスコープ外としている。想定ユーザーは作者本人および同じ価値観を持つ個人トレーニーで、linear progression が機能する初心者〜中級者期間を対象とする。

判断の背景は [docs/spec.md](docs/spec.md) に集約している。

## 主な機能

| 画面           | 内容                                                                            | 状況     |
| -------------- | ------------------------------------------------------------------------------- | -------- |
| ホーム         | 3 種目の選択。前回の記録と現状の推定 1RM を表示                                 | 実装済み |
| メニュー設定   | 重量 / 回数 / セット数 / インターバルの設定。linear progression による増量提案  | 実装済み |
| トレーニング中 | 現在のセット表示と「セット完了」（実績回数のステッパー付き）                    | 実装済み |
| インターバル中 | セット間タイマー・実施済みセットのタイムライン・セットメモ                      | 実装済み |
| 結果確認       | セッション終了後のサマリと 1RM 差分。履歴から開いた場合はセッションの削除も可能 | 実装済み |
| 履歴           | セッション一覧                                                                  | 実装済み |
| 履歴           | 1RM 推移グラフ（日付ごと 1 点・直近 8 点）                                      | 実装済み |
| インターバル中 | タイマー音 / Screen Wake Lock（iOS Safari 対応）                                | 実装済み |
| 設定           | データ Export / Import                                                          | 実装済み |

推定 1RM は FWJ 換算式（ベンチプレスは `w × (1 + r / 40)`、スクワット / デッドリフトは `w × (1 + r / 33.3)`）で算出する。

## Storybook / ビジュアルテスト

UI コンポーネントは Storybook でカタログ化し、`main` への push で Chromatic に自動デプロイしている。

- **[Storybook](https://main--6a16dbf86b6f51628d6ee2a9.chromatic.com/)** — 各コンポーネントの状態バリエーションと、`play` 関数によるインタラクションを実際に操作できる
- **[Chromatic のビルド一覧](https://www.chromatic.com/builds?appId=6a16dbf86b6f51628d6ee2a9)** — スナップショット差分によるビジュアルリグレッションテストの結果

## 技術スタック

| 区分                     | 採用                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| フレームワーク           | Vue 3 + Vite + TypeScript（Composition API + `<script setup>`）                                                 |
| ルーティング             | vue-router                                                                                                      |
| スタイリング             | scoped CSS + CSS カスタムプロパティ（Tailwind なし）                                                            |
| グラフ                   | vue-chartjs（Chart.js ベース）                                                                                  |
| ストレージ               | IndexedDB（Dexie.js）                                                                                           |
| PWA                      | vite-plugin-pwa（インストール可能・オフライン対応）                                                             |
| コンポーネント開発       | Storybook（Vue 3 + Vite）                                                                                       |
| テスト                   | Vitest projects（ロジックは `happy-dom`、Story の `play` 関数は `@storybook/addon-vitest` + headless Chromium） |
| ビジュアルリグレッション | Chromatic                                                                                                       |
| Lint / Format            | ESLint + Prettier                                                                                               |
| Git hooks                | husky + lint-staged                                                                                             |
| CI / デプロイ            | GitHub Actions / Cloudflare Pages（本体）・Chromatic（Storybook）                                               |

選定理由を含む詳細は [docs/spec.md](docs/spec.md) の「技術スタック」節を参照する。

## ドキュメント

| ドキュメント                                   | 内容                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [docs/spec.md](docs/spec.md)                   | 仕様の唯一のソース。コンセプト・機能仕様・1RM 計算式・データモデル・エラーハンドリング方針 |
| [docs/conventions.md](docs/conventions.md)     | コーディング・命名・アクセシビリティ・テスト・スタイル・ドキュメント表記の規約             |
| [docs/design/README.md](docs/design/README.md) | デザイントークン（色・タイポグラフィ・スペーシング）・画面リファレンス・トーンガイド       |
| [AGENTS.md](AGENTS.md)                         | AI コーディングエージェント向けのリポジトリガイド                                          |

## ディレクトリ構成

`src/` は責務で分割している。各レイヤは **画面専用（`pages/<画面>/`）** と **横断（`shared/`）** で分岐する。

```
src/
├─ core/          純ロジック（型・1RM 計算・linear progression・日付整形）。副作用なし
├─ storage/       永続化（Dexie / IndexedDB・リポジトリ・Export / Import）
├─ composables/   Vue composable
│  ├─ shared/<分類>/      横断の composable（session / error / navigation / ui など）
│  └─ pages/<画面>/       画面専用ロジック
├─ components/    Vue コンポーネント
│  ├─ app/               App ルート専用（ErrorScreen など）
│  ├─ shared/ui/         デザインプリミティブ（汎用・ドメイン非依存。dialog/ に AlertDialog / ConfirmDialog / SetEditDialog）
│  ├─ shared/session/    セッション文脈の複合（LpIndicator / MenuSummary / TimelineSetCard）
│  └─ pages/<画面>/       画面専用コンポーネント
├─ pages/         画面エントリ（<画面>/index.vue。セッションフローは [exercise]/ 配下にネスト）
├─ router/        vue-router のルート定義
├─ assets/icons/  lucide 純正アイコン（ISC）の SVG 実体と名前一覧（BaseIcon が glob で読む）
├─ styles/        デザイントークン・グローバル CSS
└─ stories/       Storybook 補助（共有 router・fake sessionRepo / backup・Session fixture・platform の fake・topLayerDocs）
```

分岐ルールの詳細（`shared/` の使い分け、`core ↔ storage` の依存方向など）は [docs/conventions.md](docs/conventions.md) の「ディレクトリ構成」節を参照する。

## 開発

Node 22 LTS / npm 前提。

```bash
npm install
npm run dev      # http://localhost:5173 で起動
npm run build    # dist/ に本番ビルド生成
npm run preview  # build 後の dist/ をローカルで確認
```

### Lint / Format

```bash
npm run lint          # ESLint で静的解析
npm run lint:fix      # ESLint の自動修正
npm run format        # Prettier で整形
npm run format:check  # Prettier の差分確認のみ
```

### テスト

初回のみ、Story テスト用に Playwright の Chromium を取得する。

```bash
npx playwright install chromium
```

```bash
npm test              # 全テストを 1 回実行（unit + Story の play 関数）
npm run test:storybook # Story の play 関数のみ実行
npm run test:watch    # ファイル変更を監視して再実行
```

Vitest を projects 構成で動かす。`unit`（ロジック spec、`happy-dom`）と `storybook`（Story の `play` 関数、`@storybook/addon-vitest` で **headless Chromium** 実行）。`npm test` は両方を走らせるため、pre-commit でも play 関数が headless ブラウザで検証される。

### Storybook のローカル起動

```bash
npm run storybook         # http://localhost:6006 で起動
npm run build-storybook   # storybook-static/ に静的ビルド生成
```

### PWA

`vite-plugin-pwa`（`registerType: 'autoUpdate'`）で PWA 化している。`npm run build` で `dist/` に manifest・Service Worker・アイコンが生成され、`npm run preview` で動作確認できる（SW は本番ビルドでのみ有効、dev では動かない）。

アプリアイコンの元データは `assets/icon-source.svg`（デザインの意図は `docs/design/README.md` の PWA app icon 節）。再生成は以下で行い、出力 PNG / favicon を `public/` へ移す。`pwa-assets.config.js` は `minimal-2023` プリセットの出力サイズを使い、SVG が内包する背景とセーフゾーンを原寸のまま維持する（追加余白なし）。

```bash
npx pwa-assets-generator assets/icon-source.svg
```

### Git hooks（commit 時の自動チェック）

`husky` + `lint-staged` により、commit 時に pre-commit フックで lint-staged → typecheck → test が自動で走り、いずれか失敗すると commit は中断される。`npm install`（`prepare` script）でフックが有効化されるため、追加設定は不要。

対象 glob・実行順・設計方針など詳細は [docs/conventions.md](docs/conventions.md) の「Git hooks」節を参照する。

## CI

GitHub Actions（`.github/workflows/`）で次を実行する。

- **CI（`ci.yml`）**: PR で、lint / `format:check` / `typecheck` / Vitest（ロジック spec ＋ Story の play 関数）と、`build-storybook`（Story のビルド検証）を走らせる
- **Chromatic（`chromatic.yml`）**: `main` push のみで Chromatic にデプロイする

ローカルから Chromatic を実行する場合は `npm run chromatic`（要 `CHROMATIC_PROJECT_TOKEN`）。

## デプロイ

`main` への push で、本体は [Cloudflare Pages](https://pages.cloudflare.com/)、Storybook は [Chromatic](https://www.chromatic.com/) に自動デプロイされる。本体は検索エンジン非表示のため、全レスポンスに `X-Robots-Tag: noindex` を付与する（`public/_headers`）。
