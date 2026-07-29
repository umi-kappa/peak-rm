# peak-rm

1RMの成長を可視化するシンプルなトレーニングアプリ

## ディレクトリ構成

`src/` は責務で分割している。各レイヤは **画面専用（`pages/<画面>/`）** と **横断（`shared/`）** で分岐する。

```
src/
├─ core/          純ロジック（型・1RM 計算・linear progression・集約）。副作用なし
├─ storage/       永続化（Dexie / IndexedDB・リポジトリ・Export / Import）
├─ composables/   Vue composable
│  ├─ shared/<分類>/      横断の composable（session / error / navigation / ui など）
│  └─ pages/<画面>/       画面専用ロジック
├─ components/    Vue コンポーネント
│  ├─ app/               App ルート専用（ErrorScreen など）
│  ├─ shared/ui/         デザインプリミティブ（汎用・ドメイン非依存。dialog/ に ConfirmDialog）
│  ├─ shared/*.vue       横断のアプリ固有複合（SetEditDialog など）
│  └─ pages/<画面>/       画面専用コンポーネント
├─ pages/         画面エントリ（<画面>/index.vue。セッションフローは [exercise]/ 配下にネスト）
├─ router/        vue-router のルート定義
└─ styles/        デザイントークン・グローバル CSS
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

## Lint / Format

```bash
npm run lint          # ESLint で静的解析
npm run lint:fix      # ESLint の自動修正
npm run format        # Prettier で整形
npm run format:check  # Prettier の差分確認のみ
```

## テスト

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

## コンポーネント開発（Storybook）

```bash
npm run storybook         # http://localhost:6006 で起動
npm run build-storybook   # storybook-static/ に静的ビルド生成
```

## PWA

`vite-plugin-pwa`（`registerType: 'autoUpdate'`）で PWA 化している。`npm run build` で `dist/` に manifest・Service Worker・アイコンが生成され、`npm run preview` で動作確認できる（SW は本番ビルドでのみ有効、dev では動かない）。

アイコンはプレースホルダ（本番デザインは別途）。元データは `assets/icon-source.svg`。再生成は以下で行い、出力 PNG / favicon を `public/` へ移す。

```bash
npx pwa-assets-generator --preset minimal-2023 assets/icon-source.svg
```

## Git hooks（commit 時の自動チェック）

`husky` + `lint-staged` により、commit 時に pre-commit フックで lint-staged → typecheck → test が自動で走り、いずれか失敗すると commit は中断される。`npm install`（`prepare` script）でフックが有効化されるため、追加設定は不要。

対象 glob・実行順・設計方針など詳細は [docs/conventions.md](docs/conventions.md) の「Git hooks」節を参照する。

## CI

GitHub Actions（`.github/workflows/`）で次を実行する。

- **CI（`ci.yml`）**: PR で、lint / `format:check` / `typecheck` / Vitest（ロジック spec ＋ Story の play 関数）と、`build-storybook`（Story のビルド検証）を走らせる
- **Chromatic（`chromatic.yml`）**: `main` push のみで Chromatic にデプロイする

ローカルから Chromatic を実行する場合は `npm run chromatic`（要 `CHROMATIC_PROJECT_TOKEN`）。

## デプロイ

`main` への push で、本体は [Cloudflare Pages](https://pages.cloudflare.com/)、Storybook は [Chromatic](https://www.chromatic.com/) に自動デプロイされる。本体は検索エンジン非表示のため、全レスポンスに `X-Robots-Tag: noindex` を付与する（`public/_headers`）。

## 規約

ファイル命名・アクセシビリティ・テスト・スタイル・ドキュメント表記の規約は [docs/conventions.md](docs/conventions.md) を参照する。
