# 0005 アクセシビリティはネイティブ要素の範囲に絞る

関連 Issue: #93 / #49

## 背景

種目タブ・ステッパー・タイマーなど、ARIA の複合 role（`tablist` / `radiogroup` / `spinbutton` / `timer`）を当てたくなる UI がある。しかし複合 role は矢印キー移動・roving tabindex・値の同期という実装契約を伴い、契約を満たせない ARIA は何も付けないより支援技術を混乱させる（No ARIA is better than bad ARIA）。対象はモバイル前提の個人用アプリで、キーボード操作は主経路ではない。

## 決定

- ネイティブ要素で表現できる範囲に絞り、明示的に足すのは名前付け（`aria-label` / `aria-labelledby` / `aria-hidden`）とグループ化（`role="group"` / `role="list"`）だけにする
- 複合 role は作らない。選択状態は `aria-current` で表す（`aria-pressed` は使わない）
- キーボードはネイティブの範囲（DOM 順のフォーカス移動・Enter / Space・フォーカス可視化）まで保証する。矢印キー移動・roving tabindex・ショートカットは作らない
- 毎秒書き換わる値や長押しで連続変化する値に `aria-live` を付けない

## 検討した代替案

- **`ExerciseTabs` を `tablist` にする**: タブは URL query に載る絞り込み条件で、パネルの表示切替ではない。role が実態と合わない
- **`NumberStepper` を `spinbutton` にする**: 矢印キー移動が実装契約になる。値の読み上げに `aria-live` を足すと 100 ms 間隔の長押しリピートで読み上げが暴走する
- **スクロールコンテナに `tabindex="0"` を足す**: モバイル前提のため、キーボードのみで長文をスクロールする経路は対象外とした。`ErrorScreen` の長い例外メッセージが該当しうるが、受け入れる
- **`@storybook/addon-a11y` を入れる**: 検出できるのは属性の有無で、この方針が守りたい「契約を伴う role を足さない」は検出できない

## 帰結

- pointer イベントだけで操作を組むと Enter / Space で動かないため、`@pointerdown` 系のハンドラを足すときはキーボードでも同じ操作が成立するか確認する（`NumberStepper` は `@keydown.enter` / `@keydown.space.prevent` で 1 step 適用し、長押しリピートは OS のキーリピートに任せる）
- 各論の規約は [docs/conventions.md](../conventions.md) の「アクセシビリティ」節
