// PeakRM Hi-Fi · Direction 1 · "Strict Minimal"
// Dark mode, typography-led, off-white as the only accent.
// Goal: feel quiet and powerful; let numbers do the talking.

// Accent · Direction 1 uses it sparingly on CTAs and key data points.
let MA = '#22e8ff';
let MA_GLOW = 'rgba(34,232,255,0.45)';
window.__updateMinAccent = (main, glow) => {MA = main;MA_GLOW = glow;};
const minGlow = (on = true) => on ? { textShadow: `0 0 4px ${MA_GLOW}, 0 0 12px ${MA_GLOW}` } : {};

// When true (default), the Direction 1 hero numbers/timer get neon glow.
// Wrap an Artboard with <MinGlowCtx.Provider value={false}> to render the flat variant.
const MinGlowCtx = React.createContext(true);
window.MinGlowCtx = MinGlowCtx;

const exercises = [
{ name: 'Bench Press', weight: 82.5, sets: [8, 8, 7], rm: 99.0, abbr: 'BP' },
{ name: 'Squat', weight: 100, sets: [8, 8, 8], rm: 124.0, abbr: 'SQ' },
{ name: 'Deadlift', weight: 120, sets: [5, 5, 5, 5, 5, 4], rm: 138.0, abbr: 'DL' }];


// ---------- 01 HOME ----------
const M_Home = ({ empty = false }) =>
<PhoneFrame label={empty ? '01 Home (記録なし)' : '01 Home'}>
    <ScreenBody p={24}>
      {/* brand row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: T.title, fontWeight: W.bold, color: C.fg }}>PeakRM</div>
          <span style={{ fontSize: T.caption, color: C.fg3 }}>Train the plan. Track your peak.</span>
        </div>
        <IconButton><Ic.Gear color={C.fg2} size={24} /></IconButton>
      </div>

      {/* exercise cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {exercises.map((e, i) =>
      <div key={e.name} style={{
        background: C.surface, border: `1px solid ${C.lineSoft}`,
        borderRadius: 4, padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
            {/* TITLE row */}
            <span style={{ fontFamily: FONT_SANS, fontSize: T.title, fontWeight: W.semibold, color: C.fg, textTransform: 'uppercase' }}>{e.name}</span>
            {/* DATA row · Est. 1RM (left) / Last (right) — Labels aligned */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <Label color={C.fg3}>Est. 1RM</Label>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  {empty ?
              <span style={{ ...NumStyle, fontSize: T.stat, fontWeight: W.bold, color: C.fg3, lineHeight: 1 }}>—</span> :

              <span style={{ ...NumStyle, fontSize: T.stat, fontWeight: W.bold, color: MA, lineHeight: 1, ...minGlow() }}>{e.rm.toFixed(1)}</span>
              }
                  <Unit size={12}>kg</Unit>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <Label color={C.fg3}>Last</Label>
                {empty ?
            <Unit size={12}>NO LOG</Unit> :
            (() => {
              const f = formatLast(e.weight, e.sets);
              return (
                <React.Fragment>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ ...NumStyle, fontSize: T.body, color: C.fg2, fontWeight: W.bold }}>{e.weight}</span>
                        <Unit size={12}>kg</Unit>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{
                      ...NumStyle, fontSize: T.caption, color: C.fg3,
                      textAlign: 'right', wordBreak: 'break-word'
                    }}>{f.reps}</span>
                        <Unit size={12}>reps</Unit>
                      </div>
                    </React.Fragment>);

            })()}
              </div>
            </div>
          </div>
      )}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 4px', borderTop: `1px solid ${C.lineSoft}`
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ic.History color={C.fg2} size={16} />
          <span style={{ fontSize: T.body, color: C.fg, fontWeight: W.regular, textTransform: 'uppercase' }}>History</span>
        </div>
        <Ic.Chevron dir="right" color={C.fg3} size={16} />
      </div>
    </ScreenBody>
  </PhoneFrame>;


// ---------- 02 MENU SETUP ----------
const M_Menu = () =>
<PhoneFrame label="02 Menu" h={840}>
    <AppBar caps title="Bench Press" />
    <ScreenBody p={24}>
      <div>
        <Label>Weight</Label>
        <div style={{
        marginTop: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '24px 16px', background: C.surface, borderRadius: 4,
        border: `1px solid ${C.lineSoft}`
      }}>
          <div style={{
          width: 44, height: 44, borderRadius: 4, border: `1px solid ${C.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
            <Ic.Minus size={24} color={C.fg} />
          </div>
          <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
            <BigNumber value="150.25" unit="kg" size={T.stat} color={MA} style={minGlow()} />
            <Label style={{ marginTop: 8 }}>Step · 0.25 kg</Label>
          </div>
          <div style={{
          width: 44, height: 44, borderRadius: 4, border: `1px solid ${C.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
            <Ic.Plus size={24} color={C.fg} />
          </div>
        </div>

        {/* LP indicator · attached to the Weight card above */}
        <div style={{
        marginTop: 12,
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 16px', borderRadius: 4,
        background: C.surface, border: `1px solid ${C.line}`
      }}>
          <Ic.Trend color={C.fg} size={16} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label color={C.fg2}>Linear Progression</Label>
            <div style={{
            fontFamily: FONT_MONO, fontSize: T.caption,
            textTransform: 'uppercase', color: C.fg, fontWeight: W.regular
          }}>
              Last session completed!
            </div>
          </div>
          <div style={{ ...NumStyle, display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: T.body, color: C.fg3 }}>147.75</span>
            <Ic.Chevron dir="right" size={12} color={C.fg3} style={{ alignSelf: 'center' }} />
            <span style={{ fontSize: T.body, color: MA, fontWeight: W.bold }}>150.25</span>
            <Unit size={12}>kg</Unit>
          </div>
        </div>
      </div>

      <div>
        <Label>Plan</Label>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
        ['Reps', '8', 'reps'],
        ['Sets', '3', 'sets'],
        ['Interval', '90', 'sec']].
        map(([k, v, u]) =>
        <div key={k} style={{
          background: C.surface, borderRadius: 4, border: `1px solid ${C.lineSoft}`,
          padding: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
              <span style={{ fontSize: T.body, color: C.fg, fontWeight: W.regular, textTransform: 'uppercase' }}>{k}</span>
              {/* 44px buttons ×2 + 12px gaps + 56px value column — keeps buttons pinned as digits change */}
              <Stepper value={v} unit={u} style={{ minWidth: 168, justifyContent: 'space-between' }} />
            </div>
        )}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PrimaryButton caps accent={MA} dark="#0a0a0b">Start</PrimaryButton>
    </ScreenBody>
  </PhoneFrame>;


// ---------- 03a TRAINING / IN-SET ----------
const M_TrainingSet = ({ final = false }) => {
  const g = minGlow(React.useContext(MinGlowCtx));
  const setN = final ? 3 : 2;
  const setTotal = 3;
  return (
    <PhoneFrame label="03a Training">
    <AppBar caps title="Bench Press" />
    <ScreenBody p={24}>
      {/* hero — prescription for this set */}
      <div style={{
          flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 24
        }}>
        {/* context: which set */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, height: 1, background: final ? MA : C.line }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: T.caption, color: final ? MA : C.fg3, textTransform: 'uppercase', fontWeight: W.bold }}>{final ? 'Final set' : 'Set'}</span>
            <span style={{ ...NumStyle, fontSize: T.body, color: final ? MA : C.fg, fontWeight: W.bold, ...(final ? g : {}) }}>{setN}/{setTotal}</span>
          </div>
          <div style={{ width: 24, height: 1, background: final ? MA : C.line }} />
        </div>

        {/* prescription: weight × target reps */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...NumStyle, fontSize: T.display, fontWeight: W.bold, color: MA, lineHeight: 0.9, ...g }}>82.5</span>
            <Unit size={14}>kg</Unit>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...NumStyle, fontSize: T.title, color: C.fg2, fontWeight: W.semibold }}>× 8</span>
            <Unit>reps</Unit>
          </div>
        </div>
      </div>

      {/* reps stepper */}
      <div style={{
          background: C.surface, border: `1px solid ${C.lineSoft}`, borderRadius: 4,
          padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
        <span style={{ fontSize: T.body, color: C.fg2, textTransform: 'uppercase' }}>Reps done</span>
        {/* 44px buttons ×2 + 16px gaps + 72px value column — keeps buttons pinned as digits change */}
        <Stepper value="8" unit="reps" size="lg" style={{ minWidth: 192, justifyContent: 'space-between' }} />
      </div>

      <PrimaryButton caps accent={MA} dark="#0a0a0b" style={{ marginTop: 16 }}>{final ? 'Finish session' : 'Complete set'}</PrimaryButton>
    </ScreenBody>
  </PhoneFrame>);

};

// ---------- 03b INTERVAL ----------
const M_Interval = () => {
  const g = minGlow(React.useContext(MinGlowCtx));
  return (
    <PhoneFrame label="03b Interval" h={920}>
    <AppBar caps title="Bench Press" />
    <ScreenBody p={24}>
      {/* prescription summary */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ ...NumStyle, fontSize: T.body, color: C.fg2, fontWeight: W.bold }}>82.5</span>
        <Unit>kg</Unit>
        <span style={{ color: C.fg3 }}>·</span>
        <span style={{ ...NumStyle, fontSize: T.body, color: C.fg2, fontWeight: W.bold }}>8</span>
        <Unit>reps</Unit>
        <span style={{ color: C.fg3 }}>·</span>
        <span style={{ ...NumStyle, fontSize: T.body, color: C.fg2, fontWeight: W.bold }}>4</span>
        <Unit>sets</Unit>
      </div>

      {/* Timer hero */}
      <div style={{
          marginTop: 4, padding: '28px 16px', borderRadius: 4,
          background: C.surface, border: `1px solid ${C.lineSoft}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', lineHeight: "1.4" }}>
          <Label>Interval</Label>
          <Label color={C.fg3}>Target 1:30</Label>
        </div>
        <div style={{ ...NumStyle, fontSize: T.hero, fontWeight: W.bold, lineHeight: 1, display: 'flex', alignItems: 'baseline' }}>
          <span style={{ color: MA, ...g }}>0:47</span>
          <span style={{ fontSize: T.body, color: C.fg3, fontWeight: W.bold }}>.32</span>
        </div>
        {/* progress hairline */}
        <div style={{ width: '100%', height: 4, borderRadius: 4, background: C.line, overflow: 'hidden' }}>
          <div style={{ width: '52%', height: '100%', background: MA }} />
        </div>
      </div>

      <Label>Sets</Label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* set 1 — done with memo */}
        <SetRow_M
            n={1} state="done" reps={8} target={8}
            memo="フォーム良し" />
          
        {/* set 2 — just done, memo prompt */}
        <SetRow_M
            n={2} state="done" reps={8} target={8} highlight
            memoPrompt />
          
        {/* set 3 — next */}
        <SetRow_M n={3} state="next" reps={null} target={8} />
        {/* set 4 — not yet performed */}
        <SetRow_M n={4} state="pending" reps={null} target={8} />
      </div>

      <div style={{ flex: 1 }} />
      <PrimaryButton caps accent={MA} dark="#0a0a0b">Next set</PrimaryButton>
      <SecondaryButton caps>End session</SecondaryButton>
    </ScreenBody>
  </PhoneFrame>);

};

const SetRow_M = ({ n, state, reps, target, memo, memoPrompt, highlight, readOnly = false }) =>
<div style={{
  background: state === 'next' ? C.surface : highlight ? C.surface : C.surface,
  border: `1px solid ${state === 'next' ? MA : highlight ? C.line : C.lineSoft}`,
  borderRadius: 4, padding: '12px 16px',
  opacity: state === 'pending' ? 0.55 : 1,
  position: 'relative'
}}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{
      ...NumStyle, fontSize: T.body, fontWeight: W.bold,
      color: state === 'next' ? MA : state === 'pending' ? C.fg3 : C.fg2,
      minWidth: 20, textAlign: 'center'
    }}>{n}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {state === 'pending' || state === 'next' ?
      <>
            {state === 'next' && <Label color={MA}>Next</Label>}
            <span style={{ ...NumStyle, fontSize: T.body, color: state === 'next' ? C.fg : C.fg3, marginLeft: 'auto', fontWeight: W.bold }}>{target}</span>
            <Unit size={12} color={state === 'next' ? C.fg2 : C.fg3}>reps</Unit>
          </> :

      <>
            <span style={{ ...NumStyle, fontSize: T.title, color: C.fg, fontWeight: W.bold }}>{reps}</span>
            <Unit size={12}>reps</Unit>
          </>
      }
      </div>
      {state !== 'pending' && state !== 'next' && !readOnly && <Ic.Edit color={C.fg3} size={12} />}
    </div>
    {memo &&
  <div style={{ marginTop: 8, paddingLeft: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ic.Note size={12} color={C.fg2} />
        <span style={{ fontSize: T.caption, color: C.fg, fontWeight: W.regular }}>{memo}</span>
      </div>
  }
    {memoPrompt &&
  <div style={{ marginTop: 8, paddingLeft: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ic.Note size={12} color={C.fg2} />
        <span style={{ fontSize: T.caption, color: C.fg2, borderBottom: `1px dashed ${C.fg3}`, textTransform: 'uppercase' }}>Add note</span>
      </div>
  }
  </div>;


// ---------- 04 RESULT ----------
const M_Result = ({ fromHistory = false, aborted = false, perfect = false }) => {
  const g = minGlow(React.useContext(MinGlowCtx));
  const live = !fromHistory; // editable / live session view
  return (
    <PhoneFrame label={fromHistory ? '05a History detail' : aborted ? '04 Result (中断)' : perfect ? '04 Result (完走)' : '04 Result'} h={860}>
    {fromHistory ?
      <AppBar caps title="Bench Press" action={<IconButton><Ic.Trash color={C.fg2} size={24} /></IconButton>} /> :
      <AppBar caps title="Bench Press" back={false} />}
    <ScreenBody p={24}>
      {/* date · history only */}
      {fromHistory &&
        <div style={{
          fontFamily: FONT_MONO, fontSize: T.body, fontWeight: W.bold,
          color: C.fg2
        }}>2025/05/12</div>
        }
      {/* prescription summary */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ ...NumStyle, fontSize: T.body, color: C.fg2, fontWeight: W.bold }}>82.5</span>
        <Unit>kg</Unit>
        <span style={{ color: C.fg3 }}>·</span>
        <span style={{ ...NumStyle, fontSize: T.body, color: C.fg2, fontWeight: W.bold }}>8</span>
        <Unit>reps</Unit>
        <span style={{ color: C.fg3 }}>·</span>
        <span style={{ ...NumStyle, fontSize: T.body, color: C.fg2, fontWeight: W.bold }}>3</span>
        <Unit>sets</Unit>
      </div>

      {/* Est 1RM hero — also the completion celebration moment */}
      <div style={{
          padding: '28px 16px 24px', borderRadius: 4,
          background: C.surface, border: `1px solid ${aborted ? C.line : C.lineSoft}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
        }}>
        {/* status marker */}
        {live && (() => {
            const celebratory = perfect;
            const markerColor = celebratory ? MA : C.fg2;
            const lineColor = celebratory ? MA : C.line;
            const label = aborted ? 'Session aborted' : perfect ? 'Session complete' : 'Session executed';
            const icon = perfect ? <Ic.Check size={12} color={MA} /> : null;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, height: 1, background: lineColor }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {icon}
                <span style={{
                    fontFamily: FONT_MONO, fontSize: T.caption,
                    textTransform: 'uppercase', color: markerColor, fontWeight: W.bold,
                    ...(celebratory ? g : {})
                  }}>{label}</span>
              </div>
              <div style={{ width: 24, height: 1, background: lineColor }} />
            </div>);

          })()}

        {/* Est. 1RM headline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Label color={C.fg3}>Est. 1RM</Label>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...NumStyle, fontSize: T.hero, fontWeight: W.bold, color: MA, lineHeight: 1, ...g }}>{aborted ? '98.4' : '99.0'}</span>
            <Unit>kg</Unit>
          </div>
        </div>

        {/* delta vs last */}
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 999,
            border: `1px solid ${C.line}`
          }}>
          <Ic.Arrow dir={aborted ? 'down' : 'up'} size={12} color={C.fg} />
          <span style={{ ...NumStyle, fontSize: T.body, color: C.fg, fontWeight: W.bold }}>{aborted ? '−0.6' : '+1.5'}</span>
          <Unit size={12}>kg</Unit>
        </div>
      </div>

      {/* next weight — only shown when all targets were hit */}
      {live && perfect &&
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 16px', borderRadius: 4,
          background: C.surface, border: `1px solid ${C.line}`
        }}>
          <Ic.Trend color={C.fg} size={16} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label color={C.fg2}>Linear Progression</Label>
            <div style={{
              fontFamily: FONT_MONO, fontSize: T.caption,
              textTransform: 'uppercase', color: C.fg, fontWeight: W.regular
            }}>
              Session completed!
            </div>
          </div>
          <div style={{ ...NumStyle, display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: T.body, color: C.fg3 }}>82.5</span>
            <Ic.Chevron dir="right" size={12} color={C.fg3} style={{ alignSelf: 'center' }} />
            <span style={{ fontSize: T.body, color: MA, fontWeight: W.bold }}>85.0</span>
            <Unit size={12}>kg</Unit>
          </div>
        </div>
        }

      {/* Set list */}
      <Label>Sets</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {aborted ?
          <>
            <SetRow_M n={1} state="done" reps={8} target={8} memo="フォーム良し" readOnly={fromHistory} />
            <SetRow_M n={2} state="pending" reps={null} target={8} />
            <SetRow_M n={3} state="pending" reps={null} target={8} />
          </> :
          perfect ?
          <>
            <SetRow_M n={1} state="done" reps={8} target={8} memo="好調" readOnly={fromHistory} />
            <SetRow_M n={2} state="done" reps={8} target={8} memoPrompt={!fromHistory} readOnly={fromHistory} />
            <SetRow_M n={3} state="done" reps={8} target={8} memo="フォーム維持" readOnly={fromHistory} />
          </> :

          <>
            <SetRow_M n={1} state="done" reps={8} target={8} memo="フォーム良し" readOnly={fromHistory} />
            <SetRow_M n={2} state="done" reps={8} target={8} memoPrompt={!fromHistory} readOnly={fromHistory} />
            <SetRow_M n={3} state="done" reps={7} target={8} memo="4回目から乱れた" readOnly={fromHistory} />
          </>
          }
      </div>

      <div style={{ flex: 1 }} />
      {live && <PrimaryButton caps accent={MA} dark="#0a0a0b">Finish</PrimaryButton>}
    </ScreenBody>
  </PhoneFrame>);

};

// ---------- 05 HISTORY ----------
const M_History = () => {
  const g = minGlow(React.useContext(MinGlowCtx));
  return (
    <PhoneFrame label="05 History" h={860}>
    <AppBar caps title="History" />
    <ScreenBody p={24}>
      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: C.surface, borderRadius: 4, border: `1px solid ${C.lineSoft}` }}>
        {['Bench Press', 'Squat', 'Deadlift'].map((t, i) =>
          <div key={t} style={{
            flex: 1, padding: '8px 12px', borderRadius: 4,
            background: i === 0 ? C.fg : 'transparent',
            color: i === 0 ? C.bg : C.fg3,
            fontFamily: FONT_MONO, fontSize: T.caption, fontWeight: i === 0 ? W.bold : W.regular,
            textAlign: 'center', textTransform: 'uppercase'
          }}>{t}</div>
          )}
      </div>

      {/* chart card */}
      <div style={{ background: C.surface, border: `1px solid ${C.lineSoft}`, borderRadius: 4, padding: 16 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <Label>Est. 1RM</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span style={{ ...NumStyle, fontSize: T.stat, fontWeight: W.bold, color: MA, ...g }}>99.0</span>
              <Unit size={12}>kg</Unit>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <Label color={C.fg3}>Last 8 sessions</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Ic.Arrow dir="up" size={12} color={C.fg} />
              <span style={{ ...NumStyle, fontSize: T.body, color: C.fg, fontWeight: W.bold }}>+9.0</span>
              <Unit size={12}>kg</Unit>
            </div>
          </div>
        </div>

        {/* chart */}
        <svg viewBox="0 0 320 140" style={{ width: '100%', height: 118, marginTop: 16 }}>
          {/* baseline */}
          <line x1="0" y1="120" x2="320" y2="120" stroke={C.line} strokeWidth="1" />
          {/* start/end vertical helpers */}
          <line x1="10" y1="28" x2="10" y2="120" stroke={C.lineSoft} strokeWidth="1" strokeDasharray="2 3" />
          <line x1="300" y1="28" x2="300" y2="120" stroke={C.lineSoft} strokeWidth="1" strokeDasharray="2 3" />
          {/* line */}
          <polyline fill="none" stroke={MA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
            points="10,100 50,96 90,90 130,88 170,72 210,64 250,52 300,38" />
          {/* dots */}
          {[10, 50, 90, 130, 170, 210, 250, 300].map((x, i) => {
              const y = [100, 96, 90, 88, 72, 64, 52, 38][i];
              const isEdge = i === 0 || i === 7;
              return <circle key={i} cx={x} cy={y} r={isEdge ? 3.5 : 2.5} fill={isEdge ? MA : C.bg} stroke={isEdge ? C.bg : C.fg} strokeWidth="1.5" />;
            })}
          {/* start value · above the start point */}
          <text x="10" y="90" fill={MA} fontFamily={FONT_MONO} fontSize="14" fontWeight={W.bold} textAnchor="start">90.0</text>
          {/* end value · above the end point */}
          <text x="300" y="28" fill={MA} fontFamily={FONT_MONO} fontSize="14" fontWeight={W.bold} textAnchor="end">99.0</text>
        </svg>

        {/* date axis */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: T.caption, color: C.fg3, fontWeight: W.regular }}>04/04</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: T.caption, color: C.fg3, fontWeight: W.regular }}>05/12</span>
        </div>
      </div>

      <Label>Sessions</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['05/12', '82.5', '8/8/7', '99.0', 'executed'],
          ['05/09', '80.0', '8/8/8', '96.0', 'completed'],
          ['05/06', '80.0', '8/8/5', '96.0', 'aborted'],
          ['05/03', '77.5', '8/8/8', '93.0', 'completed']].
          map(([d, weight, reps, rm, s]) => {
            const badge = {
              completed: { label: 'Completed', color: MA },
              executed: { label: 'Executed', color: C.fg },
              aborted: { label: 'Aborted', color: C.fg3 }
            }[s];
            return (
              <div key={d} style={{
                display: 'grid', gridTemplateColumns: '52px auto 1fr',
                gap: 12, alignItems: 'center',
                background: C.surface, border: `1px solid ${C.lineSoft}`, borderRadius: 4,
                padding: '12px 16px'
              }}>
            <span style={{ ...NumStyle, fontSize: T.body, color: C.fg2, textAlign: 'center' }}>{d}</span>
            <span style={{ ...NumStyle, fontSize: T.title, fontWeight: W.bold, color: C.fg, display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
              <span>{rm}</span>
              <Unit size={12}>kg</Unit>
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <span style={{ ...NumStyle, fontSize: T.body, color: C.fg2, display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <span>{weight}</span>
                <Unit size={12}>kg</Unit>
                <span style={{
                      fontFamily: FONT_MONO, fontSize: T.caption, fontWeight: W.bold,
                      color: badge.color, textTransform: 'uppercase', marginLeft: 4
                    }}>{badge.label}</span>
              </span>
              <span style={{ ...NumStyle, fontSize: T.caption, color: C.fg3, display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <span>{reps}</span>
                <Unit size={12}>reps</Unit>
              </span>
            </div>
          </div>);
          })}
      </div>
    </ScreenBody>
  </PhoneFrame>);

};

// ---------- 06 SETTINGS ----------
const M_Settings = () =>
<PhoneFrame label="06 Settings">
    <AppBar caps title="Settings" />
    <ScreenBody p={24}>
      <div>
        <Label>Data</Label>
        <div style={{
        padding: '6px 4px 0', fontSize: T.caption, color: C.fg3, lineHeight: 1.5
      }}>
          Back up all sessions and menu presets to a single file, or restore from one.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.lineSoft}`, borderRadius: 4 }}>
          <SettingRow title="Export" right={<Ic.Download color={C.fg2} />} />
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.lineSoft}`, borderRadius: 4 }}>
          <SettingRow title="Import" right={<Ic.Upload color={C.fg2} />} />
        </div>
      </div>

      <Label>About</Label>
      <div style={{ background: C.surface, border: `1px solid ${C.lineSoft}`, borderRadius: 4 }}>
        <SettingRow title="Version" right={<span style={{ ...NumStyle, fontSize: T.body, color: C.fg2 }}>1.0.0</span>} />
      </div>

      <div style={{ flex: 1 }} />
    </ScreenBody>
  </PhoneFrame>;


const SettingRow = ({ title, sub, right }) =>
<div style={{
  padding: '16px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
}}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: sub ? 4 : 0 }}>
      <span style={{ fontSize: T.body, color: C.fg, fontWeight: W.regular }}>{title}</span>
      {sub && <span style={{ ...NumStyle, fontSize: T.caption, color: C.fg3 }}>{sub}</span>}
    </div>
    {right}
  </div>;


// ---------- Set edit modal (over training/interval) ----------
const M_Modal = () =>
<PhoneFrame label="Set edit modal">
    {/* dimmed underlay sketch */}
    <div style={{
    position: 'absolute', inset: 0,
    background: `${C.bg}`
  }}>
      <div style={{ opacity: 0.18, padding: 24, paddingTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: T.title, fontWeight: W.semibold }}>Bench Press</div>
        <div style={{ height: 120, borderRadius: 4, border: `1px solid ${C.lineSoft}` }} />
        <div style={{ height: 60, borderRadius: 4, border: `1px solid ${C.lineSoft}` }} />
        <div style={{ height: 60, borderRadius: 4, border: `1px solid ${C.lineSoft}` }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
    </div>

    {/* modal sheet */}
    <div style={{
    position: 'absolute', left: 16, right: 16, top: '50%', transform: 'translateY(-50%)',
    background: C.surface, border: `1px solid ${C.line}`, borderRadius: 4,
    padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  }}>
      {/* HEADER · context */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontFamily: FONT_SANS, fontSize: T.title, fontWeight: W.semibold, color: C.fg, textTransform: 'uppercase' }}>Bench Press</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...NumStyle, fontSize: T.stat, color: C.fg, fontWeight: W.bold, lineHeight: 1 }}>82.5</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: T.caption, fontWeight: W.regular, color: C.fg3, textTransform: 'uppercase' }}>kg</span>
          </div>
          <span style={{ color: C.fg3 }}>·</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: T.caption, fontWeight: W.regular, color: C.fg3, textTransform: 'uppercase' }}>Set</span>
            <span style={{ ...NumStyle, fontSize: T.stat, fontWeight: W.bold, color: C.fg, lineHeight: 1 }}>2</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: C.lineSoft }} />

      {/* EDITABLE · reps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label color={C.fg2}>Reps done</Label>
        <div style={{
        background: C.surface, border: `1px solid ${C.lineSoft}`, borderRadius: 4,
        padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end'
      }}>
          <Stepper value="8" unit="reps" size="lg" style={{ width: '100%', justifyContent: 'space-between', gap: 0 }} />
        </div>
      </div>

      {/* EDITABLE · note */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label color={C.fg2}>Note</Label>
        <div style={{
        padding: '12px 14px', borderRadius: 4, background: C.surface, border: `1px solid ${C.lineSoft}`,
        minHeight: 64, fontSize: T.body, color: C.fg, fontWeight: W.regular
      }}>4回目からフォームが乱れた…</div>
      </div>

      <PrimaryButton caps accent={MA} dark="#0a0a0b" style={{ marginTop: 4 }}>Save</PrimaryButton>
    </div>
  </PhoneFrame>;


// ---------- Stepper variant (number input · A only, polished) ----------
const M_InputStepper = () =>
<div style={{
  width: 320, height: 320, padding: 24, background: C.bg, borderRadius: 4,
  color: C.fg, fontFamily: FONT_SANS,
  display: 'flex', flexDirection: 'column', gap: 16, border: `1px solid ${C.lineSoft}`
}}>
    <div>
      <Label>A · Stepper</Label>
      <div style={{ fontFamily: FONT_SANS, fontSize: T.title, fontWeight: W.semibold, marginTop: 4 }}>採用 · 0.25 kg 刻み</div>
    </div>
    <div style={{
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 16px', borderRadius: 4, background: C.surface, border: `1px solid ${C.lineSoft}`,
    position: 'relative'
  }}>
      <div style={{
      width: 44, height: 44, borderRadius: 4, border: `1px solid ${C.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
    }}>
        <Ic.Minus size={24} color={C.fg} />
        {/* long press ripple */}
        <div style={{
        position: 'absolute', inset: -8, borderRadius: 4,
        border: `1.5px dashed ${C.fg2}`, opacity: 0.5
      }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <BigNumber value="82.5" unit="kg" size={T.stat} />
      </div>
      <div style={{
      width: 44, height: 44, borderRadius: 4, border: `1px solid ${C.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
        <Ic.Plus size={24} color={C.fg} />
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Label color={C.fg3}>Hold 500ms · 加速連造</Label>
      <Label color={C.fg3}>Hit area 64×64</Label>
    </div>
  </div>;


Object.assign(window, {
  M_Home, M_Menu, M_TrainingSet, M_Interval, M_Result, M_History, M_Settings, M_Modal, M_InputStepper
});