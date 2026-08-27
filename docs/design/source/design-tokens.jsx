// PeakRM Hi-Fi · design tokens card
// Renders Colors / Typography / Spacing tokens for review.

const Swatch = ({ name, value, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
    <div style={{
      width: 36, height: 36, borderRadius: 4,
      background: value, border: `1px solid ${C.line}`, flexShrink: 0,
    }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 12, color: C.fg3,
        textTransform: 'uppercase', fontWeight: 600,
      }}>{name}</span>
      <span style={{ ...NumStyle, fontSize: 14, color: C.fg }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: C.fg3 }}>{sub}</span>}
    </div>
  </div>
);

const ColorGroup = ({ title, items }) => (
  <div style={{ marginBottom: 16 }}>
    <Label style={{ marginBottom: 4 }}>{title}</Label>
    {items.map(([k, v, sub]) => <Swatch key={k} name={k} value={v} sub={sub} />)}
  </div>
);

const TypeRow = ({ size, role, weight = W.semibold, family = FONT_SANS, label, sample = 'Aa 82.5 kg' }) => {
  const wName = weight === W.bold ? 'bold' : weight === W.semibold ? 'semibold' : 'regular';
  return (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 24,
    padding: '14px 0', borderBottom: `1px solid ${C.lineSoft}`,
  }}>
    <div style={{ width: 96, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#22e8ff', textTransform: 'uppercase', fontWeight: W.bold, letterSpacing: 0.5 }}>{role}</span>
      <span style={{ ...NumStyle, fontSize: 14, color: C.fg, fontWeight: W.bold }}>{size}px</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.fg3, textTransform: 'uppercase', fontWeight: W.regular }}>
        {family === FONT_MONO ? 'mono' : 'sans'} · {wName} {weight}
      </span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: family, fontSize: size, fontWeight: weight, color: C.fg, lineHeight: 1 }}>
        {sample}
      </div>
      {label && <div style={{ fontSize: 12, color: C.fg3, marginTop: 6, lineHeight: 1.4 }}>{label}</div>}
    </div>
  </div>
  );
};

const WeightRow = ({ weight, name, use }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 16,
    padding: '12px 0', borderBottom: `1px solid ${C.lineSoft}`,
  }}>
    <span style={{ ...NumStyle, fontSize: 14, color: '#22e8ff', fontWeight: W.bold, width: 36, flexShrink: 0 }}>{weight}</span>
    <span style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: weight, color: C.fg, width: 110, flexShrink: 0 }}>{name}</span>
    <span style={{ fontSize: 12, color: C.fg3, lineHeight: 1.5, flex: 1 }}>{use}</span>
  </div>
);

const SpaceRow = ({ value, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0' }}>
    <span style={{ ...NumStyle, fontSize: 14, color: C.fg, fontWeight: 700, width: 36 }}>{value}</span>
    <div style={{ width: value, height: 12, background: C.fg, borderRadius: 4, flexShrink: 0 }} />
    <span style={{ fontSize: 12, color: C.fg3 }}>{label}</span>
  </div>
);

const DesignTokens = () => {
  const ACC = window.__currentMinAccent || '#22e8ff';
  return (
    <div style={{
      width: 1100, minHeight: 1340, padding: 32, background: C.bg, color: C.fg,
      fontFamily: FONT_SANS, fontWeight: W.regular,
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24,
    }}>
      {/* COLORS */}
      <div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 12, color: C.fg2,
          textTransform: 'uppercase', fontWeight: 700, marginBottom: 12,
        }}>Colors</div>

        <ColorGroup title="Monotone (dark → light)" items={[
          ['bg',       '#0a0a0b', 'deepest · phone bg'],
          ['surface',  '#141416', 'card surface'],
          ['lineSoft', '#1f1f22', 'subtle divider · card hover / press surface'],
          ['line',     '#2a2a2e', 'visible border · button / tab hover'],
          ['fg3',      '#807e78', 'tertiary text · captions, units'],
          ['fg2',      '#bab7b0', 'secondary text'],
          ['fg',       '#f4f1ea', 'primary text · warm off-white'],
        ]} />

        <div>
          <Label style={{ marginBottom: 4 }}>Accent</Label>
          <Swatch name="Cyan" value="#22e8ff" sub="hero 1RM・current weight・active timer・primary CTA・glow" />
        </div>
      </div>

      {/* TYPOGRAPHY */}
      <div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 12, color: C.fg2,
          textTransform: 'uppercase', fontWeight: 700, marginBottom: 12,
        }}>Typography</div>

        <div style={{
          fontSize: 12, color: C.fg3, lineHeight: 1.4, marginBottom: 16,
        }}>
          Two families: <strong style={{ color: C.fg2 }}>Sans</strong> for body, titles, and headlines.
          {' '}<strong style={{ color: C.fg2 }}>Mono</strong> for all numbers and uppercase labels.
        </div>

        {/* Font families */}
        <div style={{
          marginBottom: 20,
          background: C.surface, border: `1px solid ${C.lineSoft}`, borderRadius: 4,
          padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {[
            { name: 'Sans', family: FONT_SANS, sample: 'Aa · Bench Press · 中断' },
            { name: 'Mono', family: FONT_MONO, sample: 'Aa · 82.5 KG · 0:47' },
          ].map(({ name, family, sample }) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.fg3, textTransform: 'uppercase', fontWeight: 700, width: 56 }}>{name}</span>
                <span style={{ fontFamily: family, fontSize: 20, color: C.fg, fontWeight: 500 }}>{sample}</span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.fg3, paddingLeft: 64, lineHeight: 1.4, wordBreak: 'break-word' }}>
                {family}
              </div>
            </div>
          ))}
        </div>

        <TypeRow size={T.display} role="Display"  weight={W.bold}     family={FONT_MONO} sample="82.5" label="training 重量ヒーロー (1画面 1 つだけ)" />
        <TypeRow size={T.hero}    role="Hero"     weight={W.bold}     family={FONT_MONO} sample="99.0" label="result 1RM ・ interval timer" />
        <TypeRow size={T.stat}    role="Stat"     weight={W.bold}     family={FONT_MONO} sample="99.0" label="home/chart 1RM ・ stepper(大) ・ modal 重量" />
        <TypeRow size={T.title}   role="Title"    weight={W.semibold} family={FONT_SANS} sample="Bench Press" label="AppBar ・ card title ・ modal title ・ × 8 reps" />
        <TypeRow size={T.body}    role="Body"     weight={W.regular}  family={FONT_SANS} sample="Reps done" label="行ラベル ・ メモ ・ モーダルのノート" />
        <TypeRow size={T.caption} role="Caption"  weight={W.regular}  family={FONT_MONO} sample="EST. 1RM" label="Label ・ unit ・ 日付軸" />

        {/* WEIGHT scale */}
        <div style={{
          fontFamily: FONT_MONO, fontSize: 12, color: C.fg2,
          textTransform: 'uppercase', fontWeight: W.bold, marginTop: 24, marginBottom: 4,
        }}>Weight</div>
        <div style={{ fontSize: 12, color: C.fg3, lineHeight: 1.5, marginBottom: 8 }}>
          覚え方: <strong style={{ color: C.fg2 }}>数字は bold ・ sans タイトルは semibold ・ それ以外は regular</strong>
        </div>
        <WeightRow weight={W.regular}  name="regular"  use="body / 行ラベル / メモ / Label / Unit / 日付軸 / pending state" />
        <WeightRow weight={W.semibold} name="semibold" use="sans タイトル (card / AppBar / modal) ・ × 8 reps ・ secondary button caps" />
        <WeightRow weight={W.bold}     name="bold"     use="すべての数字 ・ brand ・ primary button caps ・ badge ・ active state" />
      </div>

      {/* SPACING */}
      <div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 12, color: C.fg2,
          textTransform: 'uppercase', fontWeight: 700, marginBottom: 12,
        }}>Spacing & Radius</div>

        <div style={{
          fontSize: 12, color: C.fg3, lineHeight: 1.4, marginBottom: 16,
        }}>
          8 px base grid. 2 px allowed for tight stacks; otherwise multiples of 4.
        </div>

        <Label style={{ marginBottom: 4 }}>Micro</Label>
        <SpaceRow value={2}  label="baseline tweaks · tight stack gap" />
        <SpaceRow value={4}  label="inline label/value gap" />
        <SpaceRow value={8}  label="default chip · sub-row gap" />

        <Label style={{ marginBottom: 4, marginTop: 16 }}>Card & Row</Label>
        <SpaceRow value={12} label="card row gap · grid gap" />
        <SpaceRow value={16} label="card padding · section gap" />
        <SpaceRow value={20} label="ScreenBody gap · 本文 padding-y" />
        <SpaceRow value={24} label="screen pad · stage gap" />

        <Label style={{ marginBottom: 4, marginTop: 16 }}>Large</Label>
        <SpaceRow value={32} label="design tokens card outer pad" />

        <Label style={{ marginBottom: 4, marginTop: 16 }}>Radius</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
          <div style={{ width: 44, height: 44, borderRadius: 4, background: C.surface, border: `1px solid ${C.line}` }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ ...NumStyle, fontSize: 14, color: C.fg, fontWeight: 700 }}>4 px</span>
            <span style={{ fontSize: 12, color: C.fg3 }}>cards, buttons, stepper buttons</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
          <div style={{ height: 28, padding: '0 12px', borderRadius: 999, background: C.surface, border: `1px solid ${C.line}`, display: 'inline-flex', alignItems: 'center', fontFamily: FONT_MONO, fontSize: 12, color: C.fg3, textTransform: 'uppercase', fontWeight: 700 }}>Pill</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ ...NumStyle, fontSize: 14, color: C.fg, fontWeight: 700 }}>999 px</span>
            <span style={{ fontSize: 12, color: C.fg3 }}>status pills · delta badge</span>
          </div>
        </div>

        <Label style={{ marginBottom: 4, marginTop: 16 }}>Tap target</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
          <div style={{ width: 44, height: 44, borderRadius: 4, background: C.surface, border: `1px solid ${C.line}` }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ ...NumStyle, fontSize: 14, color: C.fg, fontWeight: 700 }}>44 px</span>
            <span style={{ fontSize: 12, color: C.fg3 }}>iOS HIG minimum · all buttons, stepper</span>
          </div>
        </div>

        <Label style={{ marginBottom: 4, marginTop: 16 }}>Line height</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '10px 0' }}>
            <span style={{ ...NumStyle, fontSize: 14, color: C.fg, fontWeight: 700 }}>1.0</span>
            <span style={{ fontSize: 12, color: C.fg3, marginLeft: 12 }}>hero numbers · large display digits</span>
          </div>
          <div style={{ padding: '10px 0' }}>
            <span style={{ ...NumStyle, fontSize: 14, color: C.fg, fontWeight: 700 }}>1.4</span>
            <span style={{ fontSize: 12, color: C.fg3, marginLeft: 12 }}>body, labels, captions (default)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DesignTokens });
