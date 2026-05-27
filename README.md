# peak-rm

1RMの成長を可視化するシンプルなトレーニングアプリ

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

```bash
npm test           # 全テストを 1 回実行
npm run test:watch # ファイル変更を監視して再実行
```

## コンポーネント開発（Storybook）

初回のみ Playwright のブラウザバイナリを取得する。

```bash
npx playwright install chromium
```

```bash
npm run storybook         # http://localhost:6006 で起動
npm run build-storybook   # storybook-static/ に静的ビルド生成
npm run test-storybook    # storybook 起動中に play 関数を実行
```

## PWA

`vite-plugin-pwa`（`registerType: 'autoUpdate'`）で PWA 化している。`npm run build` で `dist/` に manifest・Service Worker・アイコンが生成され、`npm run preview` で動作確認できる（SW は本番ビルドでのみ有効、dev では動かない）。

アイコンはプレースホルダ（本番デザインは別途）。元データは `assets/icon-source.svg`。再生成は以下で行い、出力 PNG / favicon を `public/` へ移す。

```bash
npx pwa-assets-generator --preset minimal-2023 assets/icon-source.svg
```

## Git hooks（commit 時の自動チェック）

`husky` + `lint-staged` により、commit 時に pre-commit フックが自動で走る。`npm install`（`prepare` script）でフックが有効化されるため、追加設定は不要。

- **lint-staged（変更ファイルのみ）**: `*.{ts,vue}` に ESLint `--fix`、対象拡張子に Prettier `--write`
- **typecheck（全体）**: `vue-tsc --noEmit`
- **test（全体）**: Vitest を run モードで実行

いずれかが失敗すると commit は中断される。重い Storybook の `test-storybook` はフックに含めず CI に任せる。

## CI

GitHub Actions（`.github/workflows/`）で次を実行する。

- **CI（`ci.yml`）**: PR で、lint / `format:check` / `typecheck` / Vitest と、`build-storybook` → `test-storybook`（play 関数）を走らせる
- **Chromatic（`chromatic.yml`）**: `main` push のみで Chromatic にデプロイする

ローカルから Chromatic を実行する場合は `npm run chromatic`（要 `CHROMATIC_PROJECT_TOKEN`）。

## デプロイ

`main` への push で、本体は [Cloudflare Pages](https://pages.cloudflare.com/)、Storybook は [Chromatic](https://www.chromatic.com/) に自動デプロイされる。本体は検索エンジン非表示のため、全レスポンスに `X-Robots-Tag: noindex` を付与する（`public/_headers`）。

## 規約

ファイル命名・テスト・スタイル・ドキュメント表記の規約は [docs/conventions.md](docs/conventions.md) を参照する。
