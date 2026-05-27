/* Direction C — Screens part A. Splash, Trang Hôm nay (lịch tờ inset), Lịch Tháng.
   Toned-down version: keep the lịch tờ centerfold + pill nav + identity strip,
   but reduce strata, lighten tints, drop redundant dividers. */
/* global React, useB, Logo, LogoMark, Mono, StatusBar, HomeIndicator */
const { useState: cUseState } = React;

// ─── Tokens (locked) ───
const CT = {
  paper: '#f0ece2', paperWarm: '#ede7d3', ink: '#18150e', ink2: '#3a3220',
  forest: '#1d3129', forestDeep: '#0e1c14', cream: '#ede7d3',
  gold: '#c5a55a', goldLight: '#c9a84c', goldDeep: '#9a7c22',
  muted: '#7a7050', greenMute: '#7a9a80',
  red: '#a3201f', hairline: 'rgba(154,124,34,0.18)', hairline2: 'rgba(154,124,34,0.1)',
};

const PROFILE = { name: 'Nguyễn Thị Minh', menh: 'Quý Thủy', tuoi: 'Canh Ngọ 1990' };

// ─── Identity strip — quieter than v1: smaller logo, single tight line ───
function CTopStrip({ dark = false, right }) {
  const fg = dark ? CT.cream : CT.ink;
  const muteFg = dark ? 'rgba(200,188,152,0.6)' : CT.muted;
  return (
    <div style={{ padding: '6px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LogoMark dark={dark} size={20} />
        <div style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: fg, lineHeight: 1.3 }}>
          Lịch của <strong style={{ fontWeight: 600 }}>{PROFILE.name}</strong>
          <span style={{ color: muteFg }}> · {PROFILE.menh}</span>
        </div>
      </div>
      {right}
    </div>
  );
}

// ─── Segmented control — pill style, gold active, nowrap ───
function CSegmented({ options, active, onChange, dark = false }) {
  const trackBg = dark ? 'rgba(237,231,211,0.06)' : 'rgba(154,124,34,0.07)';
  const activeBg = dark ? CT.gold : CT.forest;
  const activeFg = dark ? CT.forest : CT.cream;
  const inactiveFg = dark ? 'rgba(237,231,211,0.6)' : CT.muted;
  return (
    <div style={{ display: 'flex', gap: 2, padding: 3, background: trackBg, borderRadius: 999, margin: '0 22px' }}>
      {options.map((opt, i) => {
        const sel = i === active;
        return (
          <button key={opt} onClick={() => onChange && onChange(i)} style={{
            flex: 1, padding: '9px 0', background: sel ? activeBg : 'transparent',
            color: sel ? activeFg : inactiveFg, border: 'none',
            fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11.5,
            letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 999,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{opt}</button>
        );
      })}
    </div>
  );
}

// ─── 3-tab bottom nav — pill, icons + labels ───
function CBottomNav({ active = 0, dark = false }) {
  const tabs = [
    { id: 'lich', label: 'Lịch', icon: IconCalendar },
    { id: 'tra', label: 'Tra cứu', icon: IconSearch },
    { id: 'toi', label: 'Tôi', icon: IconUser },
  ];
  const bg = dark ? 'rgba(14,28,20,0.92)' : 'rgba(241,236,225,0.96)';
  const border = dark ? '1px solid rgba(197,165,90,0.18)' : '1px solid rgba(154,124,34,0.18)';
  return (
    <div style={{ position: 'absolute', bottom: 24, left: 22, right: 22, padding: '7px 5px', background: bg, backdropFilter: 'blur(14px)', border, borderRadius: 999, display: 'flex', gap: 4, boxShadow: dark ? '0 8px 20px rgba(0,0,0,0.35)' : '0 6px 16px rgba(0,0,0,0.08)' }}>
      {tabs.map((t, i) => {
        const sel = i === active;
        const Icon = t.icon;
        return (
          <div key={t.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 4px', borderRadius: 999, background: sel ? (dark ? 'rgba(197,165,90,0.15)' : 'rgba(29,49,41,0.07)') : 'transparent', cursor: 'pointer' }}>
            <Icon active={sel} dark={dark} />
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: sel ? 700 : 600, fontSize: 10, letterSpacing: '0.04em', color: sel ? (dark ? CT.gold : CT.forest) : (dark ? 'rgba(237,231,211,0.6)' : CT.muted), marginTop: 3, textTransform: 'uppercase' }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function IconCalendar({ active, dark }) {
  const c = active ? (dark ? CT.gold : CT.forest) : (dark ? 'rgba(237,231,211,0.6)' : CT.muted);
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round">
      <rect x="3.8" y="5" width="16.4" height="15" rx="1" />
      <path d="M3.8 9 H20.2 M8 3 V7 M16 3 V7" />
      {active && <circle cx="12" cy="14.5" r="1.6" fill={c} stroke="none" />}
    </svg>
  );
}
function IconSearch({ active, dark }) {
  const c = active ? (dark ? CT.gold : CT.forest) : (dark ? 'rgba(237,231,211,0.6)' : CT.muted);
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 L20 20" />
    </svg>
  );
}
function IconUser({ active, dark }) {
  const c = active ? (dark ? CT.gold : CT.forest) : (dark ? 'rgba(237,231,211,0.6)' : CT.muted);
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21 C4.5 16, 8 14, 12 14 C16 14, 19.5 16, 19.5 21" />
    </svg>
  );
}

function scoreDot(s) {
  if (s >= 85) return CT.greenMute;
  if (s >= 70) return CT.gold;
  if (s >= 55) return '#bfae7a';
  if (s >= 40) return CT.muted;
  return CT.red;
}

// ═══════════════════════════════════════════════════════════════════
// 01 · Splash
// ═══════════════════════════════════════════════════════════════════
function CSplash() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, background: 'radial-gradient(ellipse at 50% 0%, rgba(197,165,90,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, position: 'relative' }}>
        <Logo dark size={52} showUrl />
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <Mono style={{ color: CT.gold, fontSize: 10, letterSpacing: '0.22em' }}>Đang mở lịch của bạn</Mono>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'rgba(237,231,211,0.65)', lineHeight: 1.5, marginTop: 12 }}>
            "Mỗi ngày một trang — của riêng bạn."
          </div>
        </div>
        <div style={{ width: 72, height: 1.5, background: 'rgba(197,165,90,0.3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', background: CT.gold }} />
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 02 · Trang Hôm nay — Lịch [Hôm nay] · forest BG with lịch tờ inset
// ═══════════════════════════════════════════════════════════════════
function CHomePage() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CSegmented options={['Hôm nay', 'Tháng']} active={0} />

      <div style={{ flex: 1, padding: '18px 22px 100px', overflow: 'hidden' }}>
        {/* Trang lịch tờ — paper page on paper bg, white card with hairline border */}
        <div style={{ background: '#fff', color: CT.ink, position: 'relative', boxShadow: '0 6px 16px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)', border: `1px solid ${CT.hairline2}`, overflow: 'hidden' }}>
          {/* Date masthead — one line */}
          <div style={{ padding: '12px 18px 6px' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>Tháng 5 · 2026 &nbsp;·&nbsp; Bính Ngọ</span>
          </div>

          {/* Big day + weekday */}
          <div style={{ padding: '4px 18px 12px', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 124, color: CT.red, lineHeight: 0.84, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums' }}>26</div>
            <div style={{ paddingBottom: 14 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30, color: CT.red, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 0.95 }}>Thứ Ba</div>
            </div>
          </div>

          {/* Lunar / can-chi / tiết khí — one combined line, no dividers */}
          <div style={{ padding: '0 18px 16px', fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink2, lineHeight: 1.55 }}>
            Mùng 10 tháng Tư &nbsp;·&nbsp; ngày <strong style={{ color: CT.ink, fontWeight: 600 }}>Mậu Tuất</strong> &nbsp;·&nbsp; tiết Tiểu Mãn
          </div>

          {/* Verdict — tappable → AI luận giải */}
          <div style={{ padding: '14px 18px 4px', borderTop: `1px solid ${CT.hairline}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 17, color: CT.goldDeep, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Ngày khá</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted, marginTop: 2 }}>cho mệnh {PROFILE.menh} · <span style={{ color: CT.goldDeep }}>tại sao? ›</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 38, color: CT.goldDeep, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em' }}>76</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>/100</span>
            </div>
          </div>

          {/* Luận giải */}
          <div style={{ padding: '10px 18px 14px' }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.55, color: CT.ink2, margin: 0 }}>
              "Mộc khí vượng đến trưa, hợp ký kết và mở việc. Sang chiều Thổ vượng — nên tránh động thổ, đào móng."
            </p>
          </div>

          {/* Nên / tránh / giờ — labeled rows, no chips */}
          <div style={{ padding: '12px 18px 14px', borderTop: `1px solid ${CT.hairline}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Nên', 'Ký hợp đồng, khai trương, xuất hành', CT.forest],
              ['Tránh', 'Động thổ chiều', CT.red],
              ['Giờ tốt', 'Thìn 7–9h, Mùi 13–15h', CT.goldDeep],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <Mono style={{ color: c, fontSize: 9, width: 48, letterSpacing: '0.14em' }}>{k}</Mono>
                <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink, lineHeight: 1.45 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Prev / next */}
          <div style={{ padding: '10px 18px', borderTop: `1px solid ${CT.hairline}`, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>‹ 25.05 hôm qua</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>ngày mai 27.05 ›</span>
          </div>
        </div>

      </div>

      <CBottomNav active={0} />
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 03 · Lịch Tháng — Lịch [Tháng]
// ═══════════════════════════════════════════════════════════════════
function CMonthSpread() {
  const startDay = 4; // Mon=0..Sun=6 — May 1, 2026 is Friday → index 4
  const daysInMonth = 31;
  const prevMonth = 30;
  let cells = [];
  for (let i = prevMonth - startDay + 1; i <= prevMonth; i++) cells.push({ d: i, otherMonth: true });
  function seededScore(d) {
    const s = Math.sin(d * 13.37) * 10000;
    return 35 + Math.floor((s - Math.floor(s)) * 60);
  }
  for (let i = 1; i <= daysInMonth; i++) cells.push({ d: i, otherMonth: false, score: seededScore(i) });
  let j = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) { cells.push({ d: j++, otherMonth: true }); if (cells.length >= 42) break; }

  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CSegmented options={['Hôm nay', 'Tháng']} active={1} />

      <div style={{ flex: 1, padding: '20px 24px 100px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: CT.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Tháng 5 · 2026</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontSize: 20, cursor: 'pointer' }}>‹</span>
            <span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontSize: 20, cursor: 'pointer' }}>›</span>
          </div>
        </div>

          <div style={{ marginTop: 6, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted, lineHeight: 1.5 }}>
          Tháng Tư âm · chấm theo mệnh <strong style={{ color: CT.ink, fontWeight: 600 }}>Quý Thủy</strong> &nbsp;·&nbsp;
          <span style={{ color: CT.goldDeep, cursor: 'pointer' }}>đổi việc</span>
        </div>

        {/* Weekday header */}
        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: i === 6 ? CT.red : CT.muted, letterSpacing: '0.08em', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((c, i) => {
            const today = c.d === 26 && !c.otherMonth;
            const lunarDay = ((c.d + 14) % 30) + 1;
            return (
              <div key={i} style={{ aspectRatio: '1 / 1', padding: '5px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: c.otherMonth ? 'default' : 'pointer', position: 'relative' }}>
                {/* Number slot — same 26x26 footprint for all cells; today gets a forest circle */}
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: today ? CT.forest : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--display-2)', fontWeight: today ? 800 : 600, fontSize: 14, color: today ? CT.cream : (c.otherMonth ? 'rgba(154,124,34,0.3)' : CT.ink), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{c.d}</span>
                </div>
                {/* Lunar slot — reserved space always, transparent on other-month */}
                <div style={{ marginTop: 3, height: 11, lineHeight: 1, fontFamily: 'var(--serif)', fontSize: 9, color: c.otherMonth ? 'transparent' : 'rgba(24,21,14,0.42)' }}>{c.otherMonth ? '·' : lunarDay}</div>
                {/* Score dot — pinned bottom */}
                <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                  {!c.otherMonth && <span style={{ width: 4, height: 4, borderRadius: '50%', background: scoreDot(c.score) }} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend — single quiet line */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted }}>
          {[['Tốt', CT.greenMute], ['Khá', CT.gold], ['Bình', CT.muted], ['Tránh', CT.red]].map(([l, c]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />{l}
            </span>
          ))}
        </div>
      </div>

      <CBottomNav active={0} />
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { CT, PROFILE, CTopStrip, CSegmented, CBottomNav, IconCalendar, IconSearch, IconUser, scoreDot, CSplash, CHomePage, CMonthSpread });
