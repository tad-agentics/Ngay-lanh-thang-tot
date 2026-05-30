/* Shared B-system primitives. Globals: B (tokens helpers), Ticket, Logo, Kanji, Mono, Phone, StatusBar, HomeIndicator, Stamp */
/* global React, IOSDevice */
const { useState, useEffect, useRef, createContext, useContext } = React;

// ─── Token context — drives Tweaks ───
const BCtx = createContext(null);
function BProvider({ value, children }) {
  // resolve accent → gold-deep automatically
  const accentDeep = value.accentDeep || value.accent;
  const v = { ...value, accentDeep };
  return <BCtx.Provider value={v}>{children}</BCtx.Provider>;
}
function useB() {
  return useContext(BCtx) || { perforation: 'classic', kanjiDensity: 0.12, accent: '#c5a55a', accentDeep: '#9a7c22', tone: 'classical', density: 'default' };
}

// ─── Status bar / home indicator ───
function StatusBar({ dark }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 22px 6px', fontSize: 14, fontWeight: 600, color: dark ? '#ede7d3' : '#18150e', fontFamily: 'system-ui' }}>
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>●●●●●</span>
        <span style={{ width: 22, height: 11, border: `1.2px solid ${dark ? '#c8bc98' : '#18150e'}`, borderRadius: 2, position: 'relative' }}>
          <span style={{ position: 'absolute', inset: 1, background: dark ? '#ede7d3' : '#18150e', width: '70%' }} />
        </span>
      </span>
    </div>
  );
}
function HomeIndicator({ dark }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 10px' }}>
      <div style={{ width: 134, height: 5, borderRadius: 999, background: dark ? 'rgba(237,231,211,0.7)' : 'rgba(24,21,14,0.8)' }} />
    </div>
  );
}

function Phone({ children, dark }) {
  return <IOSDevice width={390} height={800} dark={dark} chrome={false}>{children}</IOSDevice>;
}

// ─── Logo / Kanji / Mono ───
// Uses official Logo Kit v1.0 — circle mark with 吉, 8 diamond points, concentric rings.
function Logo({ dark, size = 36, showUrl = false }) {
  const goldLight = '#c9a84c';
  const src = dark ? 'assets/logo-mark-reversed.svg' : 'assets/logo-mark.svg';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <img src={src} width={size} height={size} alt="Ngày Lành Tháng Tốt" style={{ display: 'block' }} />
      <span style={{ width: 1, alignSelf: 'stretch', minHeight: size * 0.78, background: goldLight, margin: `${size * 0.05}px ${size * 0.32}px` }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: size * 0.56, color: dark ? '#ede7d3' : '#18150e', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Ngày Lành</span>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: size * 0.16, letterSpacing: '0.36em', color: goldLight, textTransform: 'uppercase', marginTop: size * 0.07, paddingLeft: 2 }}>Tháng Tốt</span>
        {showUrl && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: size * 0.1, letterSpacing: '0.1em', color: dark ? '#7a9a80' : '#7a7050', marginTop: size * 0.1, paddingLeft: 2 }}>ngaylanhthangtot.vn</span>
        )}
      </div>
    </div>
  );
}

// LogoMark — just the circle. For app chrome / nav / share watermarks.
function LogoMark({ dark, size = 28 }) {
  const src = dark ? 'assets/logo-mark-reversed.svg' : 'assets/logo-mark.svg';
  return <img src={src} width={size} height={size} alt="Ngày Lành Tháng Tốt" style={{ display: 'block' }} />;
}

function Kanji({ ch = '吉', size = 120, opacity = null, color, style, drift = false }) {
  const b = useB();
  const o = opacity != null ? opacity : b.kanjiDensity;
  const c = color || `rgba(197,165,90,${o})`;
  return (
    <span aria-hidden style={{ fontFamily: 'var(--hanzi)', fontWeight: 700, fontSize: size, lineHeight: 1, color: 'transparent', WebkitTextStroke: `1px ${c}`, userSelect: 'none', animation: drift ? 'b-drift 22s ease-in-out infinite' : 'none', ...style }}>{ch}</span>
  );
}

function Mono({ children, style }) {
  return <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', ...style }}>{children}</span>;
}

// ─── Stamp (vertical red kanji like a chop) ───
function Stamp({ ch = '吉日', style }) {
  return (
    <div aria-hidden style={{ fontFamily: 'var(--hanzi)', color: '#8b1a1a', fontSize: 22, fontWeight: 700, lineHeight: 1, writingMode: 'vertical-rl', letterSpacing: 4, ...style }}>{ch}</div>
  );
}

// ─── Ticket primitive — handles perforation styles ───
// children: ticket body
// edge prop: 'top' | 'bottom' | 'both' | 'none'
function PerfEdge({ side, style }) {
  const b = useB();
  const p = b.perforation;
  if (p === 'none') return null;
  const alpha = b.density === 'quiet' ? 0.22 : b.density === 'rich' ? 0.55 : 0.35;
  const dashed = side === 'top' ? { borderBottom: `1px dashed rgba(122,112,80,${alpha})` } : { borderTop: `1px dashed rgba(122,112,80,${alpha})` };
  if (p === 'wave') {
    return (
      <svg viewBox="0 0 400 12" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 12, ...style }}>
        <path d="M0,6 Q10,0 20,6 T40,6 T60,6 T80,6 T100,6 T120,6 T140,6 T160,6 T180,6 T200,6 T220,6 T240,6 T260,6 T280,6 T300,6 T320,6 T340,6 T360,6 T380,6 T400,6"
          stroke={`rgba(122,112,80,${alpha})`} strokeWidth="1" fill="none" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (p === 'sharp') {
    return (
      <svg viewBox="0 0 400 12" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 12, ...style }}>
        <path d="M0,12 L10,2 L20,12 L30,2 L40,12 L50,2 L60,12 L70,2 L80,12 L90,2 L100,12 L110,2 L120,12 L130,2 L140,12 L150,2 L160,12 L170,2 L180,12 L190,2 L200,12 L210,2 L220,12 L230,2 L240,12 L250,2 L260,12 L270,2 L280,12 L290,2 L300,12 L310,2 L320,12 L330,2 L340,12 L350,2 L360,12 L370,2 L380,12 L390,2 L400,12"
          stroke={`rgba(122,112,80,${alpha + 0.1})`} strokeWidth="0.8" fill="none" />
      </svg>
    );
  }
  // classic: dashed line + dotted holes
  return (
    <div style={{ height: 12, background: `repeating-linear-gradient(90deg, transparent 0 6px, rgba(122,112,80,${alpha * 0.18}) 6px 10px)`, ...dashed, ...style }} />
  );
}

function Ticket({ children, holes = true, transform, style, holeColor = '#1d3129', stub = false, stubLabel }) {
  const b = useB();
  const shadow = b.density === 'quiet'
    ? '0 6px 14px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12)'
    : b.density === 'rich'
      ? '0 18px 36px rgba(0,0,0,0.45), 0 4px 8px rgba(0,0,0,0.25)'
      : '0 10px 22px rgba(0,0,0,0.28), 0 2px 4px rgba(0,0,0,0.18)';
  return (
    <div style={{ background: '#ede7d3', position: 'relative', boxShadow: shadow, transform, ...style }}>
      <PerfEdge side="top" />
      {holes && <>
        <div style={{ position: 'absolute', top: 38, left: -7, width: 14, height: 14, borderRadius: '50%', background: holeColor }} />
        <div style={{ position: 'absolute', top: 38, right: -7, width: 14, height: 14, borderRadius: '50%', background: holeColor }} />
      </>}
      <div style={{ padding: 0 }}>{children}</div>
      {stub && <>
        <PerfEdge side="bottom" />
        <div style={{ padding: '10px 18px', background: 'rgba(122,112,80,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Mono style={{ color: '#7a7050' }}>{stubLabel || 'Phiếu lưu — đối chiếu'}</Mono>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 12, color: '#9a7c22', letterSpacing: '0.18em' }}>·NLTT·2026·</span>
        </div>
      </>}
      <PerfEdge side="bottom" />
    </div>
  );
}

// ─── Score circle (count-up) ───
function ScoreCounter({ to = 92, size = 96, label = '/100', motion = false }) {
  const b = useB();
  const [v, setV] = useState(motion ? 0 : to);
  useEffect(() => {
    if (!motion) return;
    let raf, start = null;
    const dur = 1200;
    const step = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(Math.round(eased * to));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, motion]);
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
      <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: size, color: b.accent, lineHeight: 0.9, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
      <Mono style={{ color: 'rgba(212,200,154,0.7)', marginTop: 4 }}>{label}</Mono>
    </div>
  );
}

// ─── Motion CSS once ───
function MotionStyles() {
  return (
    <style>{`
      @keyframes b-drift { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-14px, -8px); } }
      @keyframes b-tear { 0% { transform: translateY(0) rotate(0); opacity: 1; } 60% { transform: translateY(40px) rotate(-2deg); opacity: 1; } 100% { transform: translateY(420px) rotate(-4deg); opacity: 0; } }
      @keyframes b-stamp-in { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 60% { transform: scale(1.3) rotate(8deg); opacity: 0.9; } 100% { transform: scale(1) rotate(-8deg); opacity: 1; } }
      @keyframes b-flutter { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
    `}</style>
  );
}

// ─── BackBar — top-aligned chevron + title for detail screens ───
// Used wherever BottomNav is hidden (Mua lượng, AI reading, Day detail, Habit screens).
function BackBar({ title, subtitle, onBack, onClose, dark = false, accent }) {
  const b = useB();
  const fg = dark ? '#ede7d3' : '#18150e';
  const muteFg = dark ? 'rgba(200,188,152,0.65)' : '#7a7050';
  const ac = accent || (dark ? b.accent : b.accentDeep);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px 12px', position: 'relative', zIndex: 5 }}>
      <button onClick={onBack} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: dark ? 'rgba(237,231,211,0.06)' : 'rgba(24,21,14,0.04)', border: `1px solid ${dark ? 'rgba(197,165,90,0.25)' : 'rgba(154,124,34,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ac, cursor: 'pointer', flexShrink: 0, padding: 0 }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.1 }}>
        {subtitle && <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: muteFg, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{subtitle}</div>}
        {title && <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, color: fg, textTransform: 'uppercase', letterSpacing: '-0.005em', marginTop: subtitle ? 2 : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Đóng" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muteFg, cursor: 'pointer', flexShrink: 0, padding: 0 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

Object.assign(window, { BCtx, BProvider, useB, StatusBar, HomeIndicator, Phone, Logo, LogoMark, Kanji, Mono, Stamp, Ticket, PerfEdge, ScoreCounter, MotionStyles, BackBar });
