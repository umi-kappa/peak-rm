# 0003 ロジックは Vitest、見た目は Storybook + Chromatic で分担する

関連 Issue: #21 / #26

## 背景

検証したいものは 3 種類ある。純粋なロジック（1RM 計算・セッションの状態遷移・永続化）、コンポーネントのインタラクション（押す・入力する・表示が変わる）、そして実描画の見た目である。E2E テストを書けばまとめて検証できるが、個人開発で維持するコストが高く、失敗時に原因の層が分からない。

## 決定

- ロジックは Vitest の `unit` project（`happy-dom`）で単体テストを書く
- コンポーネントのインタラクションは Storybook の Story に `play` 関数で書き、`@storybook/addon-vitest` + headless Chromium で実行する（`storybook` project）。Story を書けば自動でテスト対象になる
- 実描画に依存する視覚検証は Chromatic の visual regression が担う
- 同じ振る舞いを 2 つの層で書かない。刻みや clamp のような分岐はロジック層の単体テストに置き、Story の `play` は配線の確認 1 本に留める

## 検討した代替案

- **E2E（Playwright / Cypress）で画面ごとに検証する**: 起動が重く、pre-commit に組み込めない。ロジックの分岐まで E2E で網羅すると本数が爆発する
- **`@vue/test-utils` でコンポーネントを単体テストする**: Story と重複する。Story は Storybook 上で目視でき Chromatic の snapshot にもなるため、同じ記述で 3 つの用途を賄える方を選んだ
- **Portable Stories + jsdom で `play` を実行する（#21 で一度採用）**: ブラウザ起動なしで速いが、`<dialog>` の top layer や pointer capture など jsdom が持たない挙動が増え、実ブラウザへ移行した（#26）

## 帰結

- Story テストはブラウザ起動を伴うため、pre-commit ではなく CI で走らせる（[docs/conventions.md](../conventions.md) の「Git hooks」節）
- Chromatic の snapshot は無料枠に収める運用が要る。制約と運用ルール、消費が想定を超えた場合の撤退条件は [docs/spec.md](../spec.md) の「Snapshot 節約の運用方針」を正本とする
