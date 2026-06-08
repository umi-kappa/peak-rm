// PeakRM Hi-Fi · design tokens (dark mode, 8px grid)
// Two directions share the base palette; accent differs.

const FONT_SANS = 'system-ui, -apple-system, sans-serif';
const FONT_MONO = 'ui-monospace, monospace';

// Base dark palette · monotone scale (dark → light)
const C = {
  bg:       '#0a0a0b',         // deepest · phone bg
  surface:  '#141416',         // card surface
  lineSoft: '#1f1f22',         // subtle divider
  line:     '#2a2a2e',         // visible border / pending / hover
  fg3:      '#6c6a64',         // tertiary text · captions, units
  fg2:      '#a8a59e',         // secondary text
  fg:       '#f4f1ea',         // primary text · warm off-white
};

// PhoneFrame — artboard only (no device chrome), iOS-like status bar
const PhoneFrame = ({ children, label, h = 800, w = 390, bg, style }) => (
  <div data-screen-label={label} style={{
    width: w, height: h, background: bg || C.bg, color: C.fg,
    fontFamily: FONT_SANS, lineHeight: 1.4, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    position: 'relative', ...style,
  }}>
    <StatusBar />
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
    <HomeIndicator />
  </div>
);

const StatusBar = () => (
  <div style={{
    height: 44, padding: '0px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  }}>
    <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.fg }}>9:41</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="18" height="11" viewBox="0 0 18 11"><path d="M1 4.5 a1 1 0 0 1 1-1 h1 v6 h-1 a1 1 0 0 1 -1 -1 z M5 3 h1 v7 h-1 z M9 1.5 h1 v8.5 h-1 z M13 0 h1 v10 h-1 z" fill={C.fg} /></svg>
      <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 2 q-3 0 -5.3 1.8 l1 1.2 q1.9 -1.5 4.3 -1.5 t4.3 1.5 l1 -1.2 q-2.3 -1.8 -5.3 -1.8 z M8 5 q-2 0 -3.4 1.2 l1 1.2 q1 -0.9 2.4 -0.9 t2.4 0.9 l1 -1.2 q-1.4 -1.2 -3.4 -1.2 z" fill={C.fg} /><circle cx="8" cy="9" r="1.2" fill={C.fg} /></svg>
      <svg width="26" height="11" viewBox="0 0 26 11">
        <rect x="0.5" y="0.5" width="22" height="10" rx="2.5" fill="none" stroke={C.fg} strokeOpacity="0.4" />
        <rect x="2" y="2" width="14" height="7" rx="1" fill={C.fg} />
        <rect x="23" y="3.5" width="2" height="4" rx="0.5" fill={C.fg} fillOpacity="0.4" />
      </svg>
    </div>
  </div>
);

const HomeIndicator = () => (
  <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <div style={{ width: 134, height: 5, borderRadius: 4, background: C.fg, opacity: 0.55 }} />
  </div>
);

// Utility: monospace number with tabular alignment
const NumStyle = { fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

// Type scale · 6 sizes only, all even, min 12px.
// Each step has a single role — use the role, not a raw px value.
const T = {
  display: 96,  // mono · training 重量ヒーロー (1画面1つだけ)
  hero:    64,  // mono · result 1RM ・ interval timer
  stat:    32,  // mono · home/chart 1RM ・ stepper(大) ・ modal 重量
  title:   20,  // sans · AppBar ・ card title ・ set reps 値
  body:    14,  // sans · 行ラベル ・ ボタン caps ・ サマリ数値
  caption: 12,  // mono · eyebrow ・ unit ・ badge ・ 補助テキスト
};

// Font weights · 3 levels only.
// Use the role, not a raw number.
const W = {
  regular:  500,  // body / list rows / memo / Label / Unit / 補助
  semibold: 600,  // card title / AppBar title / title-level numbers / summary 中数値
  bold:     700,  // display/hero/stat 大数値 / button caps / brand / badge / active state
};

// Caps mono label
const Label = ({ children, style, color }) => (
  <div style={{
    fontFamily: FONT_MONO, fontSize: T.caption,
    textTransform: 'uppercase', color: color || C.fg3,
    fontWeight: W.regular, ...style,
  }}>{children}</div>
);

// Format last-session reps for Home card / history list.
// Always returns full slash form — never lossy.
const formatLast = (weight, sets) => {
  const w = weight.toString();
  if (!sets || sets.length === 0) return { weight: `${w} kg`, reps: '' };
  return { weight: `${w} kg`, reps: `× ${sets.join('/')}` };
};

// expose globally so other babel files can use
Object.assign(window, {
  FONT_SANS, FONT_MONO, C, T, W, PhoneFrame, StatusBar, HomeIndicator, NumStyle, Label, formatLast,
});
