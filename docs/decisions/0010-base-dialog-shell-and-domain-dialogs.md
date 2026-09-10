# 0010 `BaseDialog` は構造を持ち、ドメインダイアログも `ui/dialog/` に置く

関連 Issue: #32 / #87

## 背景

`components/shared/ui/base/` の原則は「単一要素にトークンで見た目を着せるだけで、構造を持たない」、`ui/` 全体の原則は「ドメイン非依存」である。一方、ネイティブ `<dialog>` を使うモーダルには非自明な足回りがある。開閉のソースを 1 つにする、マウントで `showModal()` してアンマウント前にフォーカス復元のため `close()` する、ESC / backdrop の `cancel` を配線する、`title` を `aria-labelledby` に紐付ける。`ConfirmDialog` / `AlertDialog` / `SetEditDialog` の 3 つがこれを各自で持つと、同じイディオムが 3 箇所に散る。

## 決定

- `base/BaseDialog` を共有シェルとし、足回りに加えてパネル構造（panel / header slot）まで内包する。「構造を持たない」原則の例外
- 開閉は呼び出し側の `v-if` を唯一のソースにする（マウント = 表示）。`open` prop は持たない
- ドメインを知る `SetEditDialog` も `ConfirmDialog` / `AlertDialog` と同じ `ui/dialog/` に置き、ダイアログを 2 箇所に分けない。「ドメイン非依存」原則の例外

## 検討した代替案

- **`BaseDialog` は足回りだけ持ち、パネル構造は各ダイアログが書く**: header の配置と `title` の紐付けが構造と不可分で、分けると各ダイアログが同じ header を書くことになる
- **`open` prop で開閉を制御する（#32 の初期実装）**: `v-if` と `open` の 2 つのソースが生まれ、同期の watch が要る。マウント = 表示なら同期そのものが不要になる（#87）
- **`SetEditDialog` を `components/pages/` や `shared/session/` に置く**: `BaseDialog` の足回りを共有する同族であることの方が、置き場所の純度より探しやすさに効く。ダイアログを探すとき 1 箇所で済む

## 帰結

- 例外は 2 つとも「足回りの非自明なイディオムを 1 箇所に集約する」ことを原則の純度より優先した結果である。同種の例外を足すときは同じ基準で判断する
- `BaseDialog` は top layer に描画され通常フローの親が幅を決められないため、画面端からの横インセットを `inset` prop で受ける（「プリミティブの外形幅は親が決める」の例外）
