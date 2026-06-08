# Design

PeakRM のビジュアルデザイン成果物。機能仕様は `../spec.md` を、プロダクトコンセプトの実装指針は `../../CLAUDE.md` を参照。

## ファイル構成

| パス | 役割 |
| --- | --- |
| `README.md` (このファイル) | デザイントークン仕様 / 画面リスト / 実装ガイド |
| `preview.html` | キャンバス上に全画面を並べた閲覧用 HTML プロトタイプ |
| `source/` | プロトタイプの React/JSX ソース (実装時は Vue に翻訳) |

ブラウザで `preview.html` を開けば、すべての画面を 1 枚のキャンバスで横並びに閲覧できる。pan/zoom で詳細確認、各画面ヘッダの "Focus" ボタンでフルスクリーン拡大が可能。

## このデザインについて

このフォルダ配下の HTML / JSX は **デザインリファレンス** で、HTML プロトタイプとして「見た目と振る舞いの意図」を示すもの。**プロダクションコードとして直接コピーしない。**

実装タスクは、これらのデザインを `CLAUDE.md` 指定の技術スタック (Vue 3 + Vite + TypeScript, scoped CSS) で再実装すること。Tailwind は使わない。

JSX 側は React で書かれているが、これは見た目の意図を示すための実装媒体。Vue へ翻訳する際は、コンポーネント境界よりも **トークン / スタイル / レイアウト値** を写し取ることを優先する。

## Fidelity

**High-fidelity**: 色・タイポグラフィ・スペーシング・インタラクションすべて確定済み。実装時はピクセル単位で再現すること。デザイントークン (色・フォントサイズ・ウエイト・スペース) は厳密に従う。

---

## Design Tokens

すべてのトークンは `source/tokens.jsx` 内に React 実装として定義済み。実装時は CSS カスタムプロパティ or TS 定数として落とし込む。

### Color (Dark mode・モノトーン + シアンアクセント)

| Token | Hex | 用途 |
| --- | --- | --- |
| `bg` | `#0a0a0b` | 画面背景 (最暗) |
| `surface` | `#141416` | カード面 |
| `lineSoft` | `#1f1f22` | 弱い区切り線 |
| `line` | `#2a2a2e` | 通常の境界線 / pending / hover |
| `fg3` | `#6c6a64` | 3次テキスト (キャプション・単位) |
| `fg2` | `#a8a59e` | 2次テキスト |
| `fg` | `#f4f1ea` | 主要テキスト (warm off-white) |
| `accent` | `#22e8ff` | シアン: 1RM・現在重量・active timer・primary CTA・glow |

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
| `caption` | 12 | mono | regular / bold (active) | eyebrow・unit・日付軸・badge |

**ルール:**

- すべて偶数のみ。**10 / 11 / 13 px などは禁止**
- 半端なサイズ (16 / 24 / 28 等) は作らない
- 1 画面に `display` は最大 1 つだけ
- 行内補助単位 (kg, reps) は常に `caption`

### Font Family

```css
--font-sans: system-ui, -apple-system, sans-serif;
--font-mono: ui-monospace, monospace;
```

- **Sans**: 本文・タイトル・ヘッドライン
- **Mono**: すべての数字・大文字ラベル (タブラー数字必須: `font-variant-numeric: tabular-nums`)
- **web font は読み込まない**: スタックは `system-ui` 始まりで、iOS=SF / macOS=SF / Windows=Segoe UI / Android=Roboto の各システムフォントを使う。日本語は OS のグリフ補完 (Hiragino / Yu Gothic / Noto CJK) に任せる。PWA の軽量・オフライン性を優先し `@font-face` / Google Fonts は使わない

### Font Weight (3段階)

| Role | Weight | 用途 |
| --- | --- | --- |
| `regular` | 500 | body・行ラベル・メモ・Label・Unit・日付軸・pending |
| `semibold` | 600 | sans タイトル (card / AppBar / modal)・× 8 reps・ghost button caps |
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
| 16 | card padding y・section gap |
| 20 | card padding x・ScreenBody gap |
| 24 | screen pad (画面外周)・stage gap |
| 28 | result hero padding y top |
| (32) | design tokens card outer pad（design-doc 専用・product では未使用のためトークン化しない） |

### Radius

| px | 用途 |
| --- | --- |
| 4 | カード・ボタン・stepper・modal |
| 999 | status pill・delta badge |

### Tap Target

最小 **44 px** (iOS HIG)。全ボタン・stepper・タブで遵守。

### Line Height

- `1.0` — hero numbers・large display digits
- `1.4` — body・labels・captions (デフォルト)
- `1.5` — Settings の説明テキストのみ (例外。トークン化せず inline)

---

## Screens

PhoneFrame は 390 × 800 を想定 (iOS Safari / iPhone 13–15 mini-equivalent)。ステータスバー高 44 px、ホームインジケータ高 34 px は OS ネイティブに任せる前提だがプロトタイプ上は描画。

各画面の詳細レイアウト・コピー・状態遷移は `source/screens-min.jsx` を参照。以下は構造のサマリ。

### 1. Home (`M_Home`)

- ブランド `PeakRM` (sans title bold) + タグライン "Train the plan. Track your peak." (caption fg3)
- 3 つの種目カード (Bench Press / Squat / Deadlift) を縦に配置。各カード:
  - 種目名 (sans title semibold, uppercase)
  - 左: `EST. 1RM` eyebrow + 推定1RM 数値 (mono stat bold, アクセント色 + glow)。未記録時は `—` (fg3)
  - 右: `LAST` eyebrow + 重量 (mono body bold) + reps (mono caption regular, `× 82.5/8/7` 形式)
  - 未記録時は eyebrow 行のみ ("No record yet")
- 下部: History 行 (アイコン + ラベル) と Settings 行を縦に並べる
- カードタップでメニュー設定画面へ

### 2. Menu (`M_Menu`)

- AppBar: 左 ← / 中央 "Bench Press"
- LP (Linear Progression) アクセント行: `Last session completed!` (mono caption regular, accent) + `147.75 → 150.25 kg` (前回重量 → 今回重量、選択値は accent + bold)
- 4 つの Stepper 行: Weight (kg) / Reps / Sets / Interval (sec)
  - 各行: ラベル (sans body regular, uppercase) + Stepper (左 [−], 中央 値, 右 [+])
  - Stepper 値は mono stat bold
  - Stepper button は 44 × 44 px, radius 4, border `line` 色
- Primary CTA: 画面下に `START SESSION` (caps mono bold, fill accent)

### 3. Training (`M_TrainingSet`)

- AppBar: 左 ← / 中央 "Bench Press"
- Set position row: `Set` eyebrow + `2/4` (final 時は `Final set` ＋ accent + glow)
- ヒーロー数値: `82.5` (mono display bold, accent, glow) + `kg` unit
- 副情報: `× 8` (mono title semibold) + `reps` unit
- 中央ラベル: `Reps done` (sans body regular)
- Stepper (lg): 実績回数を 0 以上で調整可能
- Primary CTA: `COMPLETE SET` (caps mono bold, fill accent)

**注意:** この画面に中断ボタンは無い (`spec.md` §3)。中断はインターバル画面から。

### 4. Interval (`M_Interval`)

- AppBar: 左 ← / 中央 "Bench Press"
- 上部サマリ: `82.5 kg · 8 reps · 4 sets` (mono body bold + Unit regular)
- Timer ヒーロー: `0:47` (mono hero bold, accent + glow) + `.32` ms 部 (mono body bold, fg3)
- Target 行: `Target 1:30` eyebrow
- Progress hairline (1 px line)
- セット履歴タイムライン: 完了セット (チェック + 重量 + reps + メモ)、現セット (next badge, ステッパー), pending (fg3, regular)
- 各完了セットの行: タップでセット編集モーダル (重量 read-only + 実績ステッパー + メモ)
- 下部: `Next set` (primary, fill accent) と `End session` (ghost, 通常色 = `line` border / `fg2` text。中断/終了の動線。danger 配色は使わない)

### 5. Result (`M_Result`)

- AppBar: 履歴経由なら左 ← 、それ以外は無し
- 日付 (mono body bold, `2025/05/12` 形式)
- 種目名 (sans title semibold)
- Prescription summary: `82.5 kg · 8 reps · 3 sets`
- Status marker: `EXECUTED` (accent + glow) または `ABORTED` (fg2, no glow)
- ヒーロー: `Est. 1RM` eyebrow + `99.0` (mono hero bold, accent + glow) + `kg` unit
- Delta badge (前回 executed セッションとの差): 上下矢印 + `+1.5 kg` (mono body bold, pill 999)
- Next session preview (LP triggered 時のみ): `Next session +2.5 kg` 形式の hint
- セットタイムライン (実績回数読み専用 / 履歴詳細時)
- 下部:
  - トレーニング終了経由なら `END SESSION` (primary)
  - 履歴経由なら下部ボタン無し

### 6. History (`M_History`)

- AppBar: 中央 "History"
- 種目タブ (3 つ): Bench / Squat / Deadlift。active は fill fg, text bg, bold; inactive は transparent, text fg3, regular
- Est. 1RM カード: 大きく `99.0` (mono stat bold + glow), Delta `+9.0 kg`, SVG 折れ線グラフ (アクセント色のパス + dot, X 軸日付)
- セッション行リスト: 日付 (mono body) + 推定 1RM (mono title bold) + 詳細 (重量 reps セット数 mono caption)
- `ABORTED` バッジ (mono caption bold)
- 行タップで Result 画面 (履歴詳細モード)

### 7. Settings (`M_Settings`)

- AppBar: 中央 "Settings"
- セクション: Data
  - Export 行 (アイコン + "Export" + chevron)
  - Import 行 (アイコン + "Import" + chevron)
- セクション: About
  - Version 行 (label + `1.0.0` mono body)
- 説明テキスト (sans caption fg3, 1.5 line-height)

### 8. Modal (`M_Modal` — セット編集)

- フルスクリーンオーバーレイ + 中央モーダル
- 背景は `M_Interval` の薄表示 (opacity 0.18)
- モーダル内容:
  - Header: 種目名 (sans title semibold uppercase) + 重量 (mono stat bold) `kg` + Set 番号 (mono stat bold)
  - 実績回数 Stepper (lg)
  - メモテキストエリア (min-height 64 px, sans body regular)
  - 下部: `SAVE` (primary, fill accent)
- 閉じるための × は無い (保存のみで閉じる)

---

## Interactions & Behavior

### グローバル

- すべての画面遷移は即時 (確認ダイアログなし)。例外: インターバル画面の「中断」のみ確認ダイアログを振る (`spec.md` §4)
- タップ feedback: button・stepper はアクティブ時に 50 ms 程度の `opacity: 0.7` フラッシュで十分
- アニメーションは控えめ。コンセプト「祝祭演出禁止」を守る (`CLAUDE.md`「トーンガイド」)

### Timer (`M_Interval`)

- セット完了で **自動開始**
- 0 秒到達時: **音のみで通知**。バイブ・画面遷移・ハイライト等は禁止
- 超過秒数を `+12` のように表示 (上限 `+180` で頭打ち)
- 「次のセットへ」「中断」はタイマー中でも押下可能

### Stepper

- 左 [−] / 右 [+] ボタンタップで刻み分増減
- 中央値は表示のみ (タップで直接編集はしない)。`tabular-nums` で揃える
- `0.25 kg` / `1 rep` / `1 set` / `10 sec` の刻みは `spec.md` §2 参照

### Linear Progression アクセント (M_Menu)

- 前回 executed セッションがあれば `Last session completed!` バナー + 重量 diff 表示
- 増量幅: Bench `+2.5 kg` / Squat・Deadlift `+5 kg` (`spec.md` §2)

### Set Edit Modal (M_Modal)

- インターバル画面の完了セットカード全体、または結果確認画面の ✎ アイコンから開く
- SAVE で確定して閉じる。× ボタンなし
- 履歴詳細から開いた場合は実績回数は read-only (`spec.md` §3 「実績値の編集ポリシー」)

### Visual treatments

- アクセント色を使うすべての数字に neon glow (上記 CSS 参照)
- mono 数字には常に `font-variant-numeric: tabular-nums` を指定 (Stepper 内で数値の位置がブレないため)
- Unit ラベルは常に `text-transform: uppercase` + mono regular

---

## Assets

このデザインでは画像アセットは使用しない。アイコンは SVG inline (24 px stroke based, `currentColor`)。`source/icons.jsx` にすべて含まれる:

- `Chevron` (right/left/up/down)
- `Plus` / `Minus` (Stepper)
- `Gear` (Settings)
- `History`
- `Edit` (✎)
- `Trend`
- `Arrow` (up/down/left/right)
- `Download` / `Upload`
- `Check`
- `Dot`
- `Note`
- `Pause`
- `Trash`

stroke-width はデフォルト 1.6〜2.0。色は `currentColor` なので親要素の `color` プロパティで制御。
