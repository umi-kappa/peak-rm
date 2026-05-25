// PeakRM Hi-Fi · icons (24px stroke-based, currentColor)
const Ic = {
  Chevron: ({ size = 16, dir = 'right', color = 'currentColor', strokeWidth = 2 }) => {
    const r = { right: 0, left: 180, up: -90, down: 90 }[dir];
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${r}deg)` }}>
        <path d="M9 6 l6 6 l-6 6" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  },
  Plus: ({ size = 16, color = 'currentColor', strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 5 v14 M5 12 h14" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  ),
  Minus: ({ size = 16, color = 'currentColor', strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M5 12 h14" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  ),
  Gear: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.25.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  History: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4 v5 h5" />
      <path d="M12 7 v5 l3 2" />
    </svg>
  ),
  Edit: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5 a2.12 2.12 0 0 1 3 3 L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  Trend: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17 l6-6 l4 4 l8-8" />
      <path d="M14 7 h7 v7" />
    </svg>
  ),
  Arrow: ({ size = 14, dir = 'up', color = 'currentColor' }) => {
    const r = { up: 0, right: 90, down: 180, left: 270 }[dir];
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${r}deg)` }}>
        <path d="M12 19 V5 M5 12 l7 -7 l7 7" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  },
  Download: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* tray */}
      <path d="M4 14 v5 a1 1 0 0 0 1 1 h14 a1 1 0 0 0 1 -1 v-5" />
      {/* arrow into tray */}
      <path d="M12 3 v11" />
      <path d="M7 9 l5 5 l5 -5" />
    </svg>
  ),
  Upload: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* tray */}
      <path d="M4 14 v5 a1 1 0 0 0 1 1 h14 a1 1 0 0 0 1 -1 v-5" />
      {/* arrow out of tray */}
      <path d="M12 14 V3" />
      <path d="M7 8 l5 -5 l5 5" />
    </svg>
  ),
  Check: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12 l5 5 l11 -11" />
    </svg>
  ),
  Dot: ({ size = 6, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill={color} /></svg>
  ),
  Note: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3 H6 a2 2 0 0 0 -2 2 v14 a2 2 0 0 0 2 2 h12 a2 2 0 0 0 2 -2 V9 z" />
      <path d="M14 3 v6 h6" />
      <path d="M8 13 h8 M8 17 h5" />
    </svg>
  ),
  Pause: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 5 v14 M15 5 v14" />
    </svg>
  ),
  Trash: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7 h16" />
      <path d="M10 11 v6 M14 11 v6" />
      <path d="M6 7 l1 13 a2 2 0 0 0 2 2 h6 a2 2 0 0 0 2 -2 l1 -13" />
      <path d="M9 7 V5 a2 2 0 0 1 2 -2 h2 a2 2 0 0 1 2 2 v2" />
    </svg>
  ),
};

Object.assign(window, { Ic });
