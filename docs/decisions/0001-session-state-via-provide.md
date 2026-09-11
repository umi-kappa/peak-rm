# 0001 状態管理に Pinia を使わず、`useSession` の単一インスタンスを provide する

関連 Issue: #33 / #82

## 背景

画面をまたいで共有が必要な状態は「実行中セッション」だけである。セッションフロー（menu / training / interval / result）の各画面に加え、component tree の外にある router のセッションガードも同じ状態を参照する。Import の確定でセッションを破棄する設定画面も同様。

## 決定

- Pinia は導入しない。共有状態は composable `useSession()` の単一インスタンスを共有する
- `main.ts` がインスタンスを生成し、`createAppRouter` へ渡しつつ `app.provide()` で供給する。画面は `inject` で受ける
- 依存リポジトリ（`sessionRepo` / `backup`）も同じ配線に乗せ、画面は `@/storage/*` の実体を直接 import しない
- 必須依存は `injectRequired` で受け、欠落ガードを手書きしない。素の `inject(key, default)` は default を持つ任意依存だけに使う

## 検討した代替案

- **Pinia を導入する**: 共有状態が 1 つで、store 間の依存も devtools の要件も無い。ライブラリを足す理由が無く、composable で同じことができる
- **画面ごとに `useSession()` を呼ぶ（モジュールスコープの singleton）**: router ガードと画面が同じインスタンスを見ることは満たせるが、Storybook やテストで fake に差し替えられない
- **App ルートの `provide()`**: router ガードは component tree の外にあるため届かない。`main.ts` が生成して `app.provide()` する形なら、tree の内外どちらからも同じインスタンスに到達できる

## 帰結

- 全画面が Storybook の provide decorator で fake（`src/stories/session.ts`）に差し替えられ、実 IndexedDB に依存せずページ stories を書ける（#82 で確立）
- injection key は実体を定義するファイルの末尾に置く（`sessionRepoInjectionKey` は `storage/sessionRepo.ts` など）
- 共有状態が増えて store 間の依存や devtools が要るようになったら再検討する
