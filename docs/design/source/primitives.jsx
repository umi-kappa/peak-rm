// PeakRM Hi-Fi · shared primitives
// Used by both Direction 1 (minimal) and Direction 2 (industrial).

// Primary CTA · pill button, 44pt tall (iOS HIG min tap target)
// caps: render label in mono uppercase (Direction 1's voice).
const PrimaryButton = ({ children, accent, dark, caps, style }) => (
  <div style={{
    height: 44, minHeight: 44, flexShrink: 0, borderRadius: 4,
    background: accent || C.fg,
    color: dark || '#0a0a0b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: caps ? FONT_MONO : FONT_SANS,
    fontSize: T.body, fontWeight: caps ? W.bold : W.semibold,
    textTransform: caps ? 'uppercase' : 'none',
    ...style,
  }}>{children}</div>
);

const GhostButton = ({ children, style, danger, caps }) => (
  <div style={{
    height: 44, minHeight: 44, flexShrink: 0, borderRadius: 4,
    border: `1px solid ${danger ? '#3a2622' : C.line}`,
    color: danger ? '#d05a4a' : C.fg2,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: caps ? FONT_MONO : FONT_SANS,
    fontSize: T.body, fontWeight: caps ? W.semibold : W.regular,
    textTransform: caps ? 'uppercase' : 'none',
    ...style,
  }}>{children}</div>
);

const IconButton = ({ children, size = 40, style }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 2,
    background: C.surface, color: C.fg2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, ...style,
  }}>{children}</div>
);

// Unit label — mono caps, used for kg/reps/sets etc.
// Renders content uppercase regardless of source string casing so callers don't
// have to remember whether to write 'kg' or 'KG'.
const Unit = ({ children, size = T.caption, color, style }) => (
  <span style={{
    fontFamily: FONT_MONO, fontSize: size,
    color: color || C.fg3, textTransform: 'uppercase', fontWeight: W.regular,
    ...style,
  }}>{children}</span>
);

// AppBar — back arrow + title
// caps: render title in mono uppercase (Direction 1's voice).
const AppBar = ({ title, action, back = true, caps }) => (
  <div style={{
    height: 48, padding: '0px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {back && (
        <div style={{ width: 32, height: 32, marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic.Chevron dir="left" size={22} color={C.fg} />
        </div>
      )}
      <div style={caps ? {
        fontFamily: FONT_MONO, fontSize: T.title, fontWeight: W.bold, color: C.fg, textTransform: 'uppercase',
      } : {
        fontFamily: FONT_SANS, fontSize: T.title, fontWeight: W.semibold, color: C.fg,
      }}>{title}</div>
    </div>
    {action}
  </div>
);

// Stepper — used in menu (small, in list rows) and in modal/training (large, hero).
// Both sizes use a 44pt tap target (iOS HIG minimum); lg keeps the larger value/icon scale.
// variant: 'sm' | 'lg'. 'compact' kept as alias for back-compat.
const Stepper = ({ value, unit, size = 'sm', accent, style }) => {
  const lg = size === 'lg';
  const btnSize = 44;
  const valSize = lg ? T.stat : T.title;
  const iconSize = lg ? 24 : 16;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: lg ? 16 : 12, ...style }}>
      <div style={{
        width: btnSize, height: btnSize, borderRadius: 4,
        border: `1px solid ${C.line}`, background: C.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.fg2, flexShrink: 0,
      }}>
        <Ic.Minus size={iconSize} color={C.fg} />
      </div>
      <div style={{
        ...NumStyle, fontSize: valSize, fontWeight: W.bold,
        color: accent || C.fg,
        minWidth: lg ? 72 : 56, textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}{unit && <span style={{ fontFamily: FONT_MONO, fontSize: T.caption, color: C.fg3, marginLeft: 8, fontWeight: W.regular, textTransform: 'uppercase' }}>{unit}</span>}
      </div>
      <div style={{
        width: btnSize, height: btnSize, borderRadius: 4,
        border: `1px solid ${C.line}`, background: C.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.fg2, flexShrink: 0,
      }}>
        <Ic.Plus size={iconSize} color={C.fg} />
      </div>
    </div>
  );
};

// Card surfaces
const Card = ({ children, raised, accent, style, onClickHint }) => (
  <div style={{
    background: raised ? C.surface : C.surface,
    border: `1px solid ${accent ? accent : C.lineSoft}`,
    borderRadius: 4, padding: 16,
    ...style,
  }}>{children}</div>
);

// Section label · caps mono
const SectionLabel = ({ children, right, style }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
    padding: '0px 4px', ...style,
  }}>
    <Eyebrow>{children}</Eyebrow>
    {right}
  </div>
);

// Big number display · used for hero weight, timer.
// `size` must be one of T.display / T.hero / T.stat; unit is always T.caption.
// `style` is applied ONLY to the number, so callers can pass neon glow / shadow
// without bleeding into the unit label.
const BigNumber = ({ value, unit, size = T.stat, color, style }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
      <span style={{
        ...NumStyle, fontSize: size, fontWeight: W.bold,
        color: color || C.fg, lineHeight: 1,
        ...style,
      }}>{value}</span>
      {unit && <span style={{ ...NumStyle, fontSize: T.caption, color: C.fg3, fontWeight: W.regular, textTransform: 'uppercase' }}>{unit}</span>}
    </div>
);

// Status pill · neutral chip
const Pill = ({ children, accent, style }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: FONT_MONO, fontSize: T.caption, textTransform: 'uppercase',
    color: accent || C.fg2,
    padding: '4px 12px', borderRadius: 999,
    border: `1px solid ${accent ? accent : C.line}`,
    fontWeight: W.semibold,
    ...style,
  }}>{children}</span>
);

// Set chip indicator (numbered circle)
const SetCircle = ({ n, state = 'done', color }) => {
  // states: done | current | pending
  const bg = state === 'done' ? C.fg : state === 'current' ? (color || C.fg) : 'transparent';
  const border = state === 'pending' ? `1.5px solid ${C.line}` : 'none';
  const txt = state === 'pending' ? C.fg3 : '#0a0a0b';
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 4,
      background: bg, border, color: txt,
      ...NumStyle, fontSize: T.caption, fontWeight: W.bold,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>{n}</div>
  );
};

// Pad / Screen body
const Pad = ({ children, p = 24, gap = 16, style }) => (
  <div style={{
    padding: `0 ${p}px`, flex: 1, minHeight: 0,
    display: 'flex', flexDirection: 'column', gap,
    overflow: 'hidden',
    ...style,
  }}>{children}</div>
);

Object.assign(window, {
  PrimaryButton, GhostButton, IconButton, AppBar, Stepper, Card,
  SectionLabel, BigNumber, Pill, SetCircle, Pad, Unit,
});
