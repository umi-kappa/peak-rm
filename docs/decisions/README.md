# 設計判断の記録（ADR）

規約や仕様の「何をするか」に対して、「なぜそう決めたか」「何を検討して退けたか」をここに残す。規約（[docs/conventions.md](../conventions.md)）と仕様（[docs/spec.md](../spec.md)）は決定だけを短く書き、背景はこのディレクトリの記録へリンクする。

## 形式

ファイル名は `NNNN-<slug>.md`（4 桁の連番）。タイトルの直後に `関連 Issue: #<番号>`（複数は ` / ` 区切り）を置く。各記録は次の 4 節で書く。

1. **背景**: 何が問題だったか。前提となる制約
2. **決定**: 何をどうすると決めたか（命令形で短く）
3. **検討した代替案**: 退けた案と、退けた理由
4. **帰結**: 決定によって受け入れたトレードオフ。再検討のトリガーがあれば書く

決定を覆すときは新しい記録を足し、古い記録の冒頭に「→ NNNN で置き換え」と書く（古い記録は消さない）。

## 一覧

| 番号                                                       | 決定                                                                   | 関連 Issue       |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------- |
| [0001](0001-session-state-via-provide.md)                  | 状態管理に Pinia を使わず、`useSession` の単一インスタンスを provide する | #33 / #82        |
| [0002](0002-plain-css-with-custom-properties.md)           | スタイリングはプレーン CSS + カスタムプロパティ（Tailwind / Sass なし）  | #31 / #48        |
| [0003](0003-test-split-vitest-storybook-chromatic.md)      | ロジックは Vitest、見た目は Storybook + Chromatic で分担する            | #21 / #26        |
| [0004](0004-menu-immutability-in-state-model.md)           | メニュー不変条件を状態モデル（deep copy + `Readonly`）で担保する        | #33              |
| [0005](0005-accessibility-native-scope.md)                 | アクセシビリティはネイティブ要素の範囲に絞る                            | #93 / #49        |
| [0006](0006-single-error-boundary-explicit-degradation.md) | エラー境界は 1 箇所、縮退は明示的にオプトインする                        | #59 / #68        |
| [0007](0007-scoped-css-boundary-token-redefinition.md)     | scoped CSS の境界は子のクラス指定でなくトークン再定義で越える           | #35 / #102 / #110 |
| [0008](0008-dimming-with-tokens-not-opacity.md)            | 面の減光は `opacity` でなく専用トークンで AA を満たす                    | #110 / #115      |
| [0009](0009-leave-confirmation-decided-by-router-guard.md) | セッションフロー離脱の確認は router ガードだけが行き先を決める          | #36 / #120       |
| [0010](0010-base-dialog-shell-and-domain-dialogs.md)       | `BaseDialog` は構造を持ち、ドメインダイアログも `ui/dialog/` に置く      | #32 / #87        |
