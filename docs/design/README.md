# Design

PeakRM のデザインリファレンス (デザイントークン・画面構造・トーン)。機能仕様とプロダクトコンセプトの実装指針は `../spec.md` を参照。

## このデザインについて

この README がデザインの上流正本で、ここに書かれたトークンとレイアウト値を `../spec.md`「技術スタック」指定の Vue 3 + Vite + TypeScript、scoped CSS で実装する。Tailwind は使わない。コンポーネント境界は実装側の責務分割に従い、README の語彙 (Card / AppBar 等) を実装名に揃えることはしない (`../conventions.md`「デザイントークン」)。

## Fidelity

**High-fidelity**: 色・タイポグラフィ・スペーシング・インタラクションすべて確定済み。実装はピクセル単位で一致させ、変更時も同じ精度で揃える。デザイントークン (色・フォントサイズ・ウエイト・スペース) には厳密に従い、独自の値や中間サイズを足さない。ここに載っていない値の扱いは `../conventions.md`「デザイントークン」を参照。

---

## Design Tokens

以下の各表がトークン値の正本。実装は `src/styles/tokens.css` の CSS カスタムプロパティとして持つ（命名規則は `../conventions.md`「デザイントークン」）。

### Color (Dark mode・モノトーン + シアンアクセント)

| Token | 値 | 用途 |
| --- | --- | --- |
| `bg` | `#0a0a0b` | 画面背景 (最暗) |
| `surfaceDim` | `#101011` | 予告 (pending) セットの面 |
| `surface` | `#141416` | カード面 |
| `lineDim` | `#161618` | 予告 (pending) セットの枠線 |
| `lineSoft` | `#1f1f22` | 弱い区切り線 / カードの hover・押下面 |
| `line` | `#2a2a2e` | 通常の境界線 / ボタン・タブの hover |
| `fg3` | `#807e78` | 3次テキスト (キャプション・単位) |
| `fg2` | `#bab7b0` | 2次テキスト |
| `fg` | `#f4f1ea` | 主要テキスト (warm off-white) |
| `accent` | `#22e8ff` | シアン: 1RM・現在重量・active timer・primary CTA・glow |
| `backdrop` | `rgba(0, 0, 0, 0.6)` | モーダルの暗幕 (黒 60%) |

テキスト 3 段の階調は WCAG AA (通常文字 4.5:1) から決めている。`fg3` は不透明な常設面 (`bg` / `surfaceDim` / `surface`) で AA を満たす下限 (`surface` で 4.53:1)、`fg2` は `fg3` と `fg` の間隔を均す位置に置く。`fg3` を上げすぎると `fg2` との差が潰れ、階調が 3 段として読めなくなるため下限に留める。予告 (pending) の減衰に `opacity` を使わないのはこの下限を守るためで、面ごと薄くするとテキストも一緒に落ちて合成後 2.15:1 になる。面と枠線だけを `surfaceDim` / `lineDim` へ落とし、テキストは `fg3` のまま置く (`surfaceDim` で 4.69:1)。

`lineSoft` 面 (カードの hover / 押下) では `fg3` が 4.05:1 で AA に足りない。トークンを上げて全画面の階調を犠牲にせず、面が上がるその状態でだけ 3 次テキストを `fg2` へ 1 段上げて解決する (`lineSoft` 面で 8.21:1)。対象は同じ面へ上がる押せるカードすべて (セット一覧の完了行・Home の種目カード・History のセッション行)。

アクセントを使う場面では neon glow を付与:

```css
text-shadow:
  0 0 4px rgba(34, 232, 255, 0.45),
  0 0 12px rgba(34, 232, 255, 0.45);
```

### Type Scale (6段階・全偶数・最小 12px)

| Role | px | Family | Weight | 用途 |
| --- | --- | --- | --- | --- |
| `display` | 96 | mono | bold | training 重量ヒーロー (1画面 1つだけ) |
| `hero` | 64 | mono | bold | result 1RM・interval timer |
| `stat` | 32 | mono | bold | home/chart 1RM・stepper(大)・modal 重量 |
| `title` | 20 | sans | semibold | AppBar・card title・modal title・× 8 reps |
| `body` | 14 | sans/mono | regular / bold (numbers) | 行ラベル・メモ・サマリ数値 (mono numbers は bold) |
| `caption` | 12 | mono | regular / bold (active) | Label・unit・日付軸・badge |

**ルール:**

- すべて偶数のみ。**10 / 11 / 13 px などは禁止**
- 半端なサイズ (16 / 24 / 28 等) は作らない
- 1 画面に `display` は最大 1 つだけ
- 行内補助単位 (kg, reps) は常に `caption`。例外は Training の `display` ヒーローに添える `KG` だけで、`body` (14) にする

### Font Family

```css
--font-sans: system-ui, -apple-system, sans-serif;
--font-mono: ui-monospace, Menlo, Consolas, monospace;
```

- **Sans**: 本文・タイトル・ヘッドライン
- **Mono**: すべての数字・大文字ラベル (タブラー数字必須: `font-variant-numeric: tabular-nums`)
- **Mono の `Menlo` / `Consolas` は省略しない**: `ui-monospace` は WebKit 系のみで Chrome では無視され、generic `monospace` の実体はブラウザの固定幅フォント設定次第でプロポーショナル体になり得る。そうなると tabular-nums の桁揃えと `−` (U+2212) の字幅が崩れる。`Menlo` が Apple・`Consolas` が Windows を受け、Android は generic が確実に等幅なので名前を挙げず任せる
- **web font は読み込まない**: スタックは `system-ui` 始まりで、iOS=SF / macOS=SF / Windows=Segoe UI / Android=Roboto の各システムフォントを使う。日本語は OS のグリフ補完 (Hiragino / Yu Gothic / Noto CJK) に任せる。PWA の軽量・オフライン性を優先し `@font-face` / Google Fonts は使わない

### Font Weight (3段階)

| Role | Weight | 用途 |
| --- | --- | --- |
| `regular` | 500 | body・行ラベル・メモ・Label・Unit・日付軸 |
| `semibold` | 600 | sans タイトル (card / AppBar / modal)・× 8 reps・secondary button caps |
| `bold` | 700 | すべての数字・brand・primary button caps・badge・active state |

**覚え方: 数字は bold ・ sans タイトルは semibold ・ それ以外は regular**

### Spacing (8 px base grid)

`2 px` はタイトスタックのみ許可。それ以外は 4 の倍数。

| px | 用途 |
| --- | --- |
| 2 | baseline tweak・tight stack gap |
| 4 | inline label/value gap |
| 8 | default chip・sub-row gap |
| 12 | card row gap・grid gap |
| 16 | card padding・section gap |
| 20 | ScreenBody gap・本文 padding-y |
| 24 | screen pad (画面外周)・stage gap |
| 32 | interval timeline の memo 字下げ |

### Radius

| px | 用途 |
| --- | --- |
| 4 | カード・ボタン・stepper・modal |
| 999 | status pill・delta badge |

### Motion

| Token | 値 | 用途 |
| --- | --- | --- |
| `easing-ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | 変化が前半に集中する ease-out。transition の既定イージング |
| `transition` | `300ms var(--easing-ease-out-expo)` | ボタン等の状態変化 (hover / active) の既定 transition |

装飾的なアニメーションには使わず、状態変化のフィードバックのみに使う（トーンガイド準拠）。

### Tap Target

最小 **44 px** (iOS HIG)。全ボタン・stepper で遵守。

例外: `IconButton` は 40 × 40 px とする（AppBar の戻る・補助操作、Home のブランド行の Settings、インターバルの通知音の停止に使う。いずれも隣接要素と十分な間隔を取って単独で置く前提。ただし通知音の停止だけは鳴っている最中に押す操作で、この前提が弱い）。

例外: History の種目タブは高さ 33 px (padding 8)。padding を一律に上げて 44 px にすると最長ラベル `BENCH PRESS` が折り返す (§6) ため、高さは上げずに 3 等分した横幅で当たり判定を確保する。

### Line Height

- `1.0` — hero numbers・large display digits
- `1.4` — body・labels・captions (デフォルト)
- `1.5` — Settings の説明テキストのみ (例外。トークン化せず inline)

---

## Screens

画面サイズは 390 × 800 を想定 (iOS Safari / iPhone 13–15 mini-equivalent)。ステータスバー高 44 px、ホームインジケータ高 34 px は OS ネイティブに任せる (実装は safe-area に委ねる)。

以下は各画面の構造のサマリ。見出しの `M_*` は画面の識別子 (`M_Home` = Home 画面)。ここに書かれていない詳細値 (個別画面の余白・幅など) は実装 (`src/pages/**/index.vue` と使用コンポーネント) が正本で、値の理由はソースコメントに残す。

AppBar は Home 以外の全画面で共通: 左に戻る (`IconButton` + Chevron left 24)、その右にタイトル (mono title bold, uppercase) を左寄せ。右端に画面ごとの補助操作 (Result のゴミ箱など) を置く。例外は Result で、セッション経由なら戻る・補助操作とも置かない (§5)。

### 1. Home (`M_Home`)

- ブランド行: 左に `PeakRM` (sans title bold) + タグライン "Train the plan. Track your peak." (caption fg3)、右端に Settings (Gear) の IconButton
- 3 つの種目カード (Bench Press / Squat / Deadlift) を縦に配置。各カード:
  - 種目名 (sans title semibold, uppercase)
  - 左: `EST. 1RM` Label + 推定1RM 数値 (mono stat bold, アクセント色 + glow) + `KG` unit。未記録時は `—` (fg3)
  - 右: `LAST` Label + 重量 (mono body bold, `KG`) + reps (mono caption regular, `/` 連結の `8/8/7` 形式 + `REPS`)
  - 未記録時は `NO LOG` (fg3)
- 下部: History 行 (アイコン + ラベル + 右シェブロン) を 1 行
- カードタップでメニュー設定画面へ

### 2. Menu (`M_Menu`)

- AppBar: "BENCH PRESS"
- WEIGHT セクション: `WEIGHT` Label + カード内に Stepper (large) + `STEP · 0.25 KG` Label
  - 直下に LP (Linear Progression) 行 (直前セッションが完遂のときだけ): Trend アイコン + `LINEAR PROGRESSION` Label + `LAST SESSION COMPLETED!` (mono caption regular, fg) + `147.75 → 150.25 KG` (前回重量 → 今回重量、今回重量だけ accent + bold)
- PLAN セクション: `PLAN` Label + カード 3 枚 (Reps / Sets / Interval)
  - 各行: ラベル (sans body regular, uppercase) + Stepper (左 [−], 中央 値, 右 [+])
- Stepper 値は mono bold。Weight だけ `stat` (32) で立て、Reps / Sets / Interval は `title` (20)。値の右に unit (`KG` / `REPS` / `SETS` / `SEC`)
- Stepper button は 44 × 44 px, radius 4, border `line` 色
- Primary CTA: 画面下に `START SESSION` (caps mono bold, fill accent)

### 3. Training (`M_TrainingSet`)

- AppBar: "BENCH PRESS"
- Set position row: `SET` Label + `2/4` (final 時は `FINAL SET` ＋ accent + glow)
- ヒーロー数値: `82.5` (mono display bold, accent, glow) + `KG` unit
- 副情報: `× 8` (mono title semibold) + `REPS` unit
- 中央ラベル: `REPS DONE` (sans body regular)
- Stepper (large): 実績回数を 0〜99 で調整可能（上限は安全弁、`spec.md` §3）
- Primary CTA: `COMPLETE SET` (caps mono bold, fill accent)。最終セットでは `FINISH SESSION`

**注意:** この画面に中断ボタンは無い (`spec.md` §3)。中断はインターバル画面から。

### 4. Interval (`M_Interval`)

- AppBar: "BENCH PRESS"
- 上部サマリ: `82.5 KG · 8 REPS · 4 SETS` (mono body bold + Unit regular)
- ヘッダー行: 左に `INTERVAL` Label、右に `TARGET 1:30` Label (space-between)
- Timer ヒーロー: `0:47` (mono hero bold, accent + glow) + `.32` ms 部 (mono body bold, fg3)
- Progress bar (高さ 4 px, radius 4。track `line`, fill accent)
- `SETS` Label + セット履歴タイムライン。各行の先頭にセット番号を置き、状態で右側が変わる: 完了セット (実績 reps + `REPS`、実績 0 回は代わりに `SKIPPED` (caption fg3) + Edit (✎) 12 + メモ)、現セット (`NEXT` Label + 目標 reps + `REPS`), pending (面 `surfaceDim` / 枠線 `lineDim`, fg3)
- 各完了セットの行: タップでセット編集モーダル (重量 read-only + 実績ステッパー + メモ)
- 下部: `NEXT SET` (primary, fill accent) と `END SESSION` (secondary, 通常色 = `line` border / `fg2` text。中断/終了の動線。danger 配色は使わない)

### 5. Result (`M_Result`)

- AppBar: 種目名タイトル。履歴経由なら左 ← と右にゴミ箱 (削除)、それ以外はどちらも無し
- 日付 (履歴経由のみ。mono body bold, `2025/05/12` 形式)
- Prescription summary: `82.5 KG · 8 REPS · 3 SETS`
- Status marker (3 状態・履歴経由でも表示): `SESSION ABORTED` / `SESSION EXECUTED` (完走・目標未達。fg2, no glow) / `SESSION COMPLETE` (完遂。check + accent + glow)
- ヒーロー: `EST. 1RM` Label + `99.0` (mono hero bold, accent + glow) + `KG` unit。全セットスキップで算出できない場合は数値の代わりに `—` を fg3 で出す (glow なし。Home / History と共通の規則)
- Delta badge (前回の完遂 (`SESSION COMPLETE`) セッションとの差): 上下矢印 + `+1.5 KG` (mono body bold, pill 999)
- Next weight preview (LP triggered・セッション経由のみ): `LINEAR PROGRESSION` 行で `82.5 → 85.0 KG` を提示
- `SETS` Label + セットタイムライン: カード全体のタップで編集モーダル (右端の ✎ は目印。履歴詳細でも表示され、実績 read-only でもメモは編集可)。`ADD NOTE` プロンプトはインターバル中のみで、この画面では未入力メモの行を出さない
- 下部:
  - セッション経由 (完了・中断直後) なら `FINISH` (primary)
  - 履歴経由なら下部ボタン無し

### 6. History (`M_History`)

- AppBar: "HISTORY"
- 種目タブ (3 つ): Bench / Squat / Deadlift。active は fill fg, text bg, bold; inactive は transparent, text fg3, regular。padding は 8px (12px では最長ラベル `BENCH PRESS` が 3 分割幅で折り返す)
- Est. 1RM カード (surface, `lineSoft` 枠, radius 4, padding 16)
  - ヘッダー左: `EST. 1RM` Label + `99.0` (mono stat bold, accent + glow) + `KG` unit
  - ヘッダー右: `LAST 8 SESSIONS` Label (fg3) + 上下矢印 12 px + `+9.0` (mono body bold) + `KG` unit。**Result の Delta badge と違い pill 枠は無く**、数値も accent にせず fg のまま (カード内で立てるのはヘッドラインの `99.0` だけ)
  - 折れ線グラフ (高さ 118): `line` の baseline 1 本のみで grid・目盛は出さない。両端に破線の縦ヘルパー (`lineSoft`, dash `2 3`)。ヘッダー・グラフ・日付軸の間に余白は取らず、グラフ内部の padding が間隔を作る
  - パスは accent 2 px (round join / cap)。dot は中間が r2.5 (bg 塗り + fg 枠 1.5 px)、両端が r3.5 (accent 塗り + bg 枠)
  - 両端の点の**上に値テキスト** (mono 14 bold, accent。始点は左寄せ、終点は右寄せ)
  - 日付軸はグラフ下に**両端 2 つだけ** (mono caption fg3, `MM/DD`)
- セッション行リスト: 日付 (mono body, fg2) + 推定 1RM (mono title bold + `KG` unit。全セットスキップで算出できない場合は数値の代わりに `—` を fg3 で出す) + 詳細 (右寄せ 3 段。重量 + `KG` unit → 実績回数 `8/8/7` + `REPS` unit (mono caption fg3) → ステータスバッジ)
  - **行の日付・重量は regular**（トークンの「bold = すべての数字」の例外。行内で立てるのは推定 1RM だけ）。Home の LAST 列が重量を bold にするのは、カード内に他の数値が無く単独で読ませるため
- ステータスバッジ (mono caption bold, uppercase。状態の区分は Result の Status marker と同じ 3 状態だが、階調は本画面独自 — Result は complete だけ accent で aborted / executed とも fg2): `COMPLETED` (accent) / `EXECUTED` (fg2) / `ABORTED` (fg3)。ステータスは実績から導出した結論なので、根拠 (実績回数) の直後に置く。完遂だけをアクセントで立て、他は本文より落とした階調にする
- 選択種目に記録が無いときは、セッション行の代わりに `NO SESSIONS` (mono caption fg3) を 1 行。`SESSIONS` の見出しは残す (Home が `LAST` ラベルを残して `NO LOG` を出すのと同じ扱い)
- 行タップで Result 画面 (履歴詳細モード)

### 7. Settings (`M_Settings`)

- AppBar: "SETTINGS"
- セクション: `DATA`
  - Export 行 ("Export" + 右端に `Download` アイコン fg2)
  - Import 行 ("Import" + 右端に `Upload` アイコン fg2)
- セクション: `ABOUT`
  - Version 行 (label + `1.0.0` mono body)
- 説明テキスト (sans caption fg3, 1.5 line-height)

### 8. Modal (`M_Modal` — セット編集)

- フルスクリーンオーバーレイ + 中央モーダル
- 背景は暗幕 (`backdrop`)。モーダル背後の画面は暗幕越しに見える
- **影は使わない**。背景からの分離は枠線 (`line`) と暗幕が担う (装飾的な影はトーンガイドに反する)
- モーダル内容:
  - Header: 種目名 (sans title semibold uppercase) + 重量 (mono stat bold) `KG` + `SET` unit + Set 番号 (mono stat bold)
  - 実績回数 Stepper (large)
  - メモテキストエリア (min-height 64 px, sans body regular, 未入力時は placeholder `ADD NOTE` fg2)
  - 下部: `SAVE` (primary, fill accent)
- 閉じるための × は無い (保存のみで閉じる)

---

## Interactions & Behavior

### グローバル

- すべての画面遷移は即時 (確認ダイアログなし)。例外: 破壊的操作には確認ダイアログを振る — インターバルの「中断」(`spec.md` §4)・履歴詳細のセッション削除 (§5)・Import の全置換 (§7)
- タップ feedback: button・stepper はアクティブ時に面・枠線・文字色のいずれかを一段変える (`transition` 300 ms)。どれを変えるかは要素ごとに違う (primary は面 + 文字色、secondary は枠線、stepper とカードは面)。`opacity` は使わない
- アニメーションは控えめ。コンセプト「祝祭演出禁止」を守る (`../spec.md`「トーンガイド」)

### Timer (`M_Interval`)

- セット完了で **自動開始**
- 0 秒到達時: **音のみで通知**。バイブ・画面遷移は禁止。**通知の手段としての**ハイライトも禁止（停止ボタンの活性表現は除く）
- 通知音は止めるまで鳴り続ける。**停止ボタン**（`VolumeX`）をタイマー数値の右横に常時置く。鳴っていない間は fg3 に落とし、鳴り始めたら通常色 (fg2) に戻す。数値は中央のまま動かさない
- 停止するのは音だけで、タイマーは止めない (`spec.md` §4)
- 残り時間は `0:47.32` のように分:秒 + センチ秒で表示 (センチ秒は超過中も含め常に併記)
- 超過時間を `+0:12` のように分:秒で表示 (上限 `+3:00` で頭打ち)
- 「次のセットへ」「中断」はタイマー中でも押下可能

### Stepper

- 左 [−] / 右 [+] ボタンタップで刻み分増減
- 中央値は表示のみ (タップで直接編集はしない)。`tabular-nums` で揃える
- `0.25 kg` / `1 rep` / `1 set` / `10 sec` の刻みは `spec.md` §2 参照

### Linear Progression アクセント (M_Menu)

- 直前セッションが完遂していれば `LAST SESSION COMPLETED!` バナー + 重量 diff 表示
- 増量幅: Bench `+2.5 kg` / Squat・Deadlift `+5 kg` (`spec.md` §2)

### Set Edit Modal (M_Modal)

- 完了セットカード全体のタップで開く（インターバル・結果確認・履歴詳細で共通。カード右端の ✎ は目印）
- SAVE で確定して閉じる。× ボタンなし
- 履歴詳細から開いた場合は実績回数は read-only (`spec.md` §3 「実績値の編集ポリシー」)

### Visual treatments

- アクセント色を使うすべての数字に neon glow (上記 CSS 参照)
- mono 数字には常に `font-variant-numeric: tabular-nums` を指定 (Stepper 内で数値の位置がブレないため)
- Unit ラベルは常に大文字表記 + mono regular (`text-transform` ではなく文字列そのものを大文字で書く。`../conventions.md`「スタイル（CSS）」)

---

## Assets

画面内では画像アセットを使用しない。操作アイコンは SVG inline (24 px stroke based, `currentColor`)。表示サイズは 3 値に絞る (12 = 行内の差分 chevron・インラインマーカー / 16 = 行アイコン (行頭・行末とも) / 24 = 大型コントロール = stepper 大・`IconButton`)。使用するアイコン:

- `Chevron` (right/left)
- `Plus` / `Minus` (Stepper)
- `Gear` (Settings)
- `History`
- `Edit` (✎)
- `Trend`
- `Arrow` (up/down)
- `Download` / `Upload`
- `Check`
- `Note`
- `Trash`
- `VolumeX` (通知音の停止)

stroke-width は 2。色は `currentColor` なので親要素の `color` プロパティで制御。

### PWA app icon

- モチーフは、正面から見たウェイトプレートの外周と、1RM の段階的な上昇からピークへ至る線を一続きにした単一の幾何学マークとする。ピークの先端には、線幅より一段大きい同色の塗り点を置く
- 背景は `bg`（`#0a0a0b`）、マークは `accent`（`#22e8ff`）の 2 色のみを使用する。グラデーション、光彩、影、質感、立体表現は使わない
- 元画像は `assets/icon-source.svg`。完全に不透明な正方形とし、画像自体に角丸や透過を付けない
- Android の円形・角丸・水滴型マスクで主要部分が欠けないよう、マーク全体を画像中央の直径 80% の円内に収める
