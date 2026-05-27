/* Direction C — Landing page · pivot-first rewrite.
   Hero leads with "cuốn lịch của bạn cả năm" — ownership, not demo.
   Daily ritual viz · same-day-different-mệnh proof · 12-month spread · pricing hero year.
   Mobile: hamburger menu · sticky bottom CTA · responsive collapse. */
/* global React, ReactDOM */
const { useState } = React;

const T = {
  paper: '#f0ece2', paperWarm: '#ede7d3', ink: '#18150e', ink2: '#3a3220',
  forest: '#1d3129', forestDeep: '#0e1c14', cream: '#ede7d3',
  gold: '#c5a55a', goldLight: '#c9a84c', goldDeep: '#9a7c22',
  muted: '#7a7050', greenMute: '#7a9a80', green: '#5e7d5e', red: '#a3201f',
  hairline: 'rgba(154,124,34,0.18)', hairline2: 'rgba(154,124,34,0.10)',
};

function scoreColor(s) {
  if (s >= 85) return T.greenMute;
  if (s >= 70) return T.goldDeep;
  if (s >= 55) return '#bfae7a';
  if (s >= 40) return T.muted;
  return T.red;
}

// ═══════════════════════════════════════════════════════════════════
// Header · with mobile hamburger
// ═══════════════════════════════════════════════════════════════════
function LHeader({ onMenuClick }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(240,236,226,0.94)', backdropFilter: 'blur(16px) saturate(140%)',
      borderBottom: `1px solid ${T.hairline}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 6vw',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="assets/logo-mark.svg" width="36" height="36" alt="" />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: T.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Ngày Lành</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 9, letterSpacing: '0.32em', color: T.goldDeep, textTransform: 'uppercase' }}>Tháng Tốt</div>
        </div>
      </div>
      <nav className="l-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {[['Lịch', '#lịch'], ['Cá nhân hoá', '#cá-nhân-hoá'], ['Bảng giá', '#bảng-giá'], ['Hỏi đáp', '#hỏi-đáp']].map(([t, h]) => (
          <a key={t} href={h} style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: T.ink2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t}</a>
        ))}
        <a style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: T.goldDeep, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}>Mở lịch</a>
        <button style={{ padding: '10px 20px', background: T.forest, color: T.cream, border: 'none', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Lập lịch — 30 giây</button>
      </nav>
      <button className="l-nav-mobile" onClick={onMenuClick} style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: 8 }} aria-label="Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18 M3 12h18 M3 18h18" /></svg>
      </button>
    </header>
  );
}

// Mobile drawer
function LMobileDrawer({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,21,14,0.65)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '78%', maxWidth: 320, height: '100%', background: T.paper, padding: '24px 24px 32px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink, fontSize: 22, padding: 4 }} aria-label="Close">×</button>
        </div>
        <nav style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[['Lịch', '#lịch'], ['Cá nhân hoá', '#cá-nhân-hoá'], ['Bảng giá', '#bảng-giá'], ['Hỏi đáp', '#hỏi-đáp']].map(([t, h]) => (
            <a key={t} href={h} onClick={onClose} style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: T.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>{t}</a>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: T.goldDeep, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', padding: 12 }}>Mở lịch của tôi</a>
          <button style={{ padding: 14, background: T.forest, color: T.cream, border: 'none', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Lập lịch — 30 giây</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HERO · "Đây là cuốn lịch của bạn" — year ownership
// ═══════════════════════════════════════════════════════════════════
function LHero() {
  return (
    <section style={{ background: T.paper, padding: '64px 6vw 80px', position: 'relative', overflow: 'hidden' }}>
      <div className="hero-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 56, alignItems: 'center' }}>
        {/* LEFT — copy */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: T.goldDeep, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Lịch điện tử cá nhân · 2026</div>
          <h1 className="hero-h1" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 96, lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase', color: T.ink, margin: '20px 0 18px' }}>
            Đây là<br />lịch<br /><span style={{ color: T.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>của bạn</span>.
          </h1>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.6, color: T.ink2, maxWidth: 460, margin: 0 }}>
            Không để dùng khi cần mới tra. Không phải công cụ.<br />
            <strong style={{ color: T.ink, fontWeight: 600 }}>365 trang lịch tờ điện tử</strong> — mỗi trang chấm sẵn theo lá số tứ trụ của bạn.
          </p>

          <div style={{ marginTop: 28, padding: '16px 18px', background: 'rgba(154,124,34,0.06)', borderLeft: `3px solid ${T.goldDeep}` }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: T.goldDeep, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Mỗi sáng</div>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: T.ink, margin: '4px 0 0', lineHeight: 1.55 }}>
              "Lật trang hôm nay. Xem hôm nay mệnh mình thế nào."
            </p>
          </div>

          <div style={{ marginTop: 28, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{ padding: '18px 32px', background: T.forest, color: T.cream, border: 'none', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 12px 24px rgba(29,49,41,0.18)' }}>Lập lịch của tôi</button>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: T.muted, lineHeight: 1.5 }}>30 giây · không cần thẻ<br />20 lượng tặng để thử trước</div>
          </div>
        </div>

        {/* RIGHT — Year stack of lịch tờ pages */}
        <LHeroStack />
      </div>
    </section>
  );
}

// Stack of lịch tờ pages — 6 layered, peek out at angles
function LHeroStack() {
  const pages = [
    { d: 28, m: 6, wd: 'CN', chi: 'Quý Mão', score: 84, rot: 8, off: [120, 80] },
    { d: 17, m: 6, wd: 'T4', chi: 'Canh Thìn', score: 85, rot: 5, off: [80, 40] },
    { d: 14, m: 6, wd: 'CN', chi: 'Đinh Sửu', score: 88, rot: -3, off: [40, 20] },
    { d: 23, m: 6, wd: 'T3', chi: 'Bính Tuất', score: 78, rot: -6, off: [-20, 60] },
    { d: 25, m: 6, wd: 'T5', chi: 'Mậu Tý', score: 73, rot: 10, off: [-50, 110] },
  ];
  return (
    <div className="hero-stack" style={{ position: 'relative', height: 540 }}>
      {/* Back layers — small lịch tờ peek out */}
      {pages.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: 100 + p.off[1],
          left: 60 + p.off[0],
          width: 180, height: 220,
          background: '#fff',
          border: `1px solid ${T.hairline2}`,
          boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
          transform: `rotate(${p.rot}deg)`,
          padding: '8px 12px',
          zIndex: 1,
          overflow: 'hidden',
        }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 10, color: T.muted }}>Tháng {p.m} · 2026</div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 76, color: T.red, lineHeight: 0.85, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums' }}>{p.d}</div>
            <div style={{ paddingBottom: 8, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: T.red, textTransform: 'uppercase', lineHeight: 1 }}>{p.wd}</div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${T.hairline2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: T.muted, letterSpacing: '0.06em' }}>{p.chi}</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: scoreColor(p.score), lineHeight: 1, letterSpacing: '-0.015em' }}>{p.score}</div>
          </div>
        </div>
      ))}

      {/* Front page — full lịch tờ for today */}
      <div className="hero-front" style={{
        position: 'absolute',
        top: 30, left: '20%',
        width: 280, height: 380,
        background: '#fff',
        border: `1px solid ${T.hairline}`,
        boxShadow: '0 36px 60px rgba(0,0,0,0.2), 0 6px 12px rgba(0,0,0,0.08)',
        zIndex: 10,
        transform: 'rotate(-2deg)',
      }}>
        <div style={{ padding: '14px 22px 6px', borderBottom: `1px solid ${T.hairline2}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: T.muted }}>Tháng 5 · 2026 · Bính Ngọ</span>
          </div>
        </div>
        <div style={{ padding: '12px 22px 16px', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 130, color: T.red, lineHeight: 0.84, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums' }}>26</div>
          <div style={{ paddingBottom: 16 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 28, color: T.red, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 0.95 }}>Thứ Ba</div>
          </div>
        </div>
        <div style={{ padding: '0 22px 14px', fontFamily: 'var(--serif)', fontSize: 12.5, color: T.ink2, lineHeight: 1.55 }}>
          Mùng 10 tháng Tư · ngày <strong style={{ color: T.ink, fontWeight: 600 }}>Mậu Tuất</strong> · tiết Tiểu Mãn
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.hairline}`, background: 'rgba(154,124,34,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: T.goldDeep, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Ngày khá</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: T.muted, marginTop: 3 }}>cho mệnh Quý Thủy</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 40, color: T.goldDeep, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>76</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: T.muted }}>/100</span>
          </div>
        </div>
        <div style={{ padding: '12px 22px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12.5, color: T.ink2, lineHeight: 1.55 }}>
          "Mộc khí vượng đến trưa, hợp ký kết và mở việc."
        </div>
      </div>

      {/* Tag overlay */}
      <div style={{ position: 'absolute', top: 10, right: 10, padding: '6px 12px', background: T.ink, color: T.gold, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 800, zIndex: 11 }}>
        365 trang · cả năm
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MỖI SÁNG MỘT TRANG · daily ritual
// ═══════════════════════════════════════════════════════════════════
function LRitual() {
  const pages = [
    { d: 25, wd: 'Thứ Hai', verdict: 'Bình thường', score: 62, current: false },
    { d: 26, wd: 'Thứ Ba',  verdict: 'Ngày khá',     score: 76, current: true  },
    { d: 27, wd: 'Thứ Tư',  verdict: 'Ngày tốt',     score: 82, current: false },
  ];
  return (
    <section id="lịch" style={{ background: T.forest, color: T.cream, padding: '88px 6vw', borderTop: '1px solid rgba(197,165,90,0.15)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 32 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: T.gold, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Mỗi sáng một trang</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(197,165,90,0.25)' }} />
        </div>

        <h2 className="ritual-h2" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 64, lineHeight: 1, letterSpacing: '-0.02em', textTransform: 'uppercase', color: T.cream, maxWidth: 800 }}>
          Như lật <span style={{ color: T.gold, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>trang lịch tờ</span><br />trên tường — nhưng <em style={{ color: T.gold, fontFamily: 'var(--serif)', fontWeight: 700 }}>của riêng bạn</em>.
        </h2>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.65, color: 'rgba(237,231,211,0.72)', marginTop: 22, maxWidth: 640 }}>
          Sáng mở ra thấy trang hôm nay đã chấm sẵn theo mệnh bạn. Tối đóng lại biết ngày mai nên hoặc không nên làm gì. <strong style={{ color: T.cream, fontWeight: 600 }}>Không phải tra cứu — là thói quen hằng ngày</strong>.
        </p>

        {/* 3 pages timeline */}
        <div className="ritual-pages" style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {pages.map((p, i) => (
            <div key={i} style={{ position: 'relative', background: '#fff', color: T.ink, padding: 0, border: p.current ? `1.5px solid ${T.gold}` : `1px solid ${T.hairline2}`, transform: p.current ? 'scale(1.03)' : 'none', boxShadow: p.current ? '0 24px 48px rgba(0,0,0,0.3)' : '0 8px 18px rgba(0,0,0,0.1)' }}>
              {p.current && <div style={{ position: 'absolute', top: -10, left: 14, padding: '3px 10px', background: T.gold, color: T.forest, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 800, letterSpacing: '0.18em' }}>HÔM NAY</div>}
              <div style={{ padding: '14px 18px 6px', borderBottom: `1px solid ${T.hairline2}` }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 11, color: T.muted }}>Tháng 5 · 2026</span>
              </div>
              <div style={{ padding: '14px 18px 18px', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 96, color: p.current ? T.red : 'rgba(163,32,31,0.45)', lineHeight: 0.85, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums' }}>{p.d}</div>
                <div style={{ paddingBottom: 12, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: p.current ? T.red : 'rgba(163,32,31,0.5)', textTransform: 'uppercase', lineHeight: 0.95 }}>{p.wd.replace('Thứ ', 'T').replace('Chủ Nhật', 'CN')}</div>
              </div>
              <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.hairline2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: p.current ? 'rgba(154,124,34,0.05)' : 'transparent' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: p.current ? T.goldDeep : T.muted, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>{p.verdict}</div>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: scoreColor(p.score), lineHeight: 1, letterSpacing: '-0.015em' }}>{p.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CÁ NHÂN HOÁ · Same day, different mệnh, different verdict
// ═══════════════════════════════════════════════════════════════════
function LPersonal() {
  const pairs = [
    { mệnh: 'Quý Thủy', kind: 'Bạn', verdict: 'Ngày khá', score: 76, why: 'Mộc khí vượng đến trưa — hợp ký kết, mở việc.', accent: T.goldDeep },
    { mệnh: 'Bính Hỏa', kind: 'Người khác', verdict: 'Không thuận', score: 38, why: 'Mậu Tuất khắc Hỏa — tránh giao dịch lớn.', accent: T.red },
  ];
  return (
    <section id="cá-nhân-hoá" style={{ background: T.paper, padding: '88px 6vw', borderTop: `1px solid ${T.hairline}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 32 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: T.goldDeep, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Cá nhân hoá</span>
          <span style={{ flex: 1, height: 1, background: T.hairline }} />
        </div>

        <h2 className="personal-h2" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 64, lineHeight: 1, letterSpacing: '-0.02em', textTransform: 'uppercase', color: T.ink, maxWidth: 920 }}>
          Cùng <span style={{ color: T.red }}>ngày 26.05</span> —<br />khác mệnh, <em style={{ color: T.goldDeep, fontFamily: 'var(--serif)', fontWeight: 700 }}>khác lành dữ</em>.
        </h2>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.65, color: T.ink2, marginTop: 22, maxWidth: 680 }}>
          Lịch in nói cùng một điều cho 100 triệu người. <strong style={{ color: T.ink, fontWeight: 600 }}>Lịch của bạn nói riêng cho bạn</strong>. Đây là ngày Mậu Tuất hành Thổ — cùng một ngày, mỗi mệnh đón nhận một khác.
        </p>

        <div className="personal-grid" style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {pairs.map((p, i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${T.hairline}`, padding: 0, position: 'relative' }}>
              <div style={{ padding: '14px 22px', background: i === 0 ? 'rgba(154,124,34,0.06)' : 'rgba(163,32,31,0.04)', borderBottom: `1px solid ${T.hairline2}` }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: T.muted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{p.kind}</div>
                <div style={{ marginTop: 4, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: T.ink, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Mệnh {p.mệnh}</div>
              </div>
              <div style={{ padding: '24px 22px 8px', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 112, color: T.red, lineHeight: 0.84, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums' }}>26</div>
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 26, color: T.red, textTransform: 'uppercase', lineHeight: 0.95 }}>Thứ Ba</div>
                </div>
              </div>
              <div style={{ padding: '0 22px 16px', fontFamily: 'var(--serif)', fontSize: 12.5, color: T.muted }}>
                Mùng 10 tháng Tư · ngày Mậu Tuất
              </div>
              <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: p.accent, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>{p.verdict}</div>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 40, color: p.accent, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{p.score}</span>
              </div>
              <div style={{ padding: '12px 22px 16px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: T.ink2, lineHeight: 1.55 }}>
                "{p.why}"
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 36, padding: '18px 22px', background: 'rgba(154,124,34,0.06)', borderLeft: `3px solid ${T.goldDeep}`, maxWidth: 760 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: T.goldDeep, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Kết luận</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 15, color: T.ink, lineHeight: 1.65, margin: '6px 0 0' }}>
            Khoảng cách <strong style={{ fontWeight: 600 }}>38 điểm</strong> này là lý do lịch chung không hợp riêng ai — và lý do bạn cần lịch riêng.
          </p>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CẢ NĂM TRONG TAY · 12 monthly spreads visualisation
// ═══════════════════════════════════════════════════════════════════
function LYearSpread() {
  const months = [
    { m: 1, name: 'Giêng' }, { m: 2, name: 'Hai' }, { m: 3, name: 'Ba' },
    { m: 4, name: 'Tư' }, { m: 5, name: 'Năm', current: true }, { m: 6, name: 'Sáu' },
    { m: 7, name: 'Bảy' }, { m: 8, name: 'Tám' }, { m: 9, name: 'Chín' },
    { m: 10, name: 'Mười' }, { m: 11, name: 'M.Một' }, { m: 12, name: 'Chạp' },
  ];
  // Seeded score-color grid per month
  function monthDots(seed) {
    const dots = [];
    for (let i = 0; i < 28; i++) {
      const s = Math.sin(seed * 13.37 + i * 7.7) * 10000;
      const score = 35 + Math.floor((s - Math.floor(s)) * 60);
      dots.push(scoreColor(score));
    }
    return dots;
  }
  return (
    <section style={{ background: T.paper, padding: '88px 6vw', borderTop: `1px solid ${T.hairline}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 32 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: T.goldDeep, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Cả năm trong tay</span>
          <span style={{ flex: 1, height: 1, background: T.hairline }} />
        </div>

        <h2 className="year-h2" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 56, lineHeight: 1.02, letterSpacing: '-0.02em', textTransform: 'uppercase', color: T.ink, maxWidth: 880 }}>
          365 ngày · <span style={{ color: T.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700 }}>đã chấm sẵn</span> cho riêng bạn.
        </h2>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.65, color: T.ink2, marginTop: 18, maxWidth: 680 }}>
          Mở lịch tháng — thấy ngay tháng nào có nhiều ngày hợp với bạn. Mỗi chấm là một ngày, mỗi màu là một mức điểm.
        </p>

        {/* 12 monthly mini-spreads */}
        <div className="year-grid" style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
          {months.map((mo, i) => {
            const dots = monthDots(mo.m);
            return (
              <div key={mo.m} style={{ padding: '12px 12px', background: mo.current ? '#fff' : T.paperWarm, border: mo.current ? `1.5px solid ${T.goldDeep}` : `1px solid ${T.hairline2}` }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: mo.current ? T.goldDeep : T.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Tháng {mo.m}</div>
                <div style={{ marginTop: 4, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: mo.current ? T.ink : T.ink2, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>{mo.name}</div>
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                  {dots.map((c, j) => (
                    <span key={j} style={{ aspectRatio: '1', background: c, opacity: mo.current ? 1 : 0.55, borderRadius: 1 }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: 22, display: 'flex', gap: 22, fontFamily: 'var(--serif)', fontSize: 12, color: T.muted }}>
          {[['Tốt', T.greenMute], ['Khá', T.goldDeep], ['Bình', T.muted], ['Tránh', T.red]].map(([l, c]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: c }} />{l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRICING · year-first hero
// ═══════════════════════════════════════════════════════════════════
function LPricing() {
  return (
    <section id="bảng-giá" style={{ background: T.paper, padding: '88px 6vw', borderTop: `1px solid ${T.hairline}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 32 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: T.goldDeep, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Bảng giá</span>
          <span style={{ flex: 1, height: 1, background: T.hairline }} />
        </div>

        {/* Year hero — big banner */}
        <div className="pricing-hero" style={{ position: 'relative', background: T.forest, color: T.cream, padding: '48px 56px', border: `1.5px solid ${T.gold}`, boxShadow: '0 24px 48px rgba(29,49,41,0.25)' }}>
          <div style={{ position: 'absolute', top: -12, left: 32, padding: '5px 14px', background: T.gold, color: T.forest, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 800, letterSpacing: '0.22em' }}>★ KHUYẾN NGHỊ</div>

          <div className="hero-tier-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: T.gold, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Lịch Đinh Mùi 2027 · 1 năm</div>
              <h3 className="pricing-h3" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 56, lineHeight: 0.96, textTransform: 'uppercase', letterSpacing: '-0.02em', marginTop: 10 }}>
                Lịch của bạn<br /><span style={{ color: T.gold, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>cho cả năm</span>
              </h3>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, color: 'rgba(237,231,211,0.75)', marginTop: 16, lineHeight: 1.7, maxWidth: 460 }}>
                365 trang lịch tờ cá nhân + Luận giải Bát tự + Luận giải Tiểu Vận 2026 + Tra cứu không giới hạn + Hợp tuổi + Chuyển lịch.
              </p>
              <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  ['Lịch cá nhân cả năm', '449.000đ'],
                  ['Luận giải Bát tự', '299.000đ'],
                  ['Luận giải Tiểu Vận 2026', '199.000đ'],
                ].map(([t, p], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontFamily: 'var(--serif)', fontSize: 13.5, color: 'rgba(237,231,211,0.65)' }}>
                    <span>+ {t}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{p}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontFamily: 'var(--serif)', fontSize: 14, color: T.cream, borderTop: '1px solid rgba(197,165,90,0.25)', marginTop: 6 }}>
                  <span>= Mua riêng tổng cộng</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, textDecoration: 'line-through', color: 'rgba(237,231,211,0.55)' }}>947.000đ</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: T.gold, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Bạn trả</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                <span className="hero-price" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 104, color: T.gold, lineHeight: 0.9, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>449</span>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 32, color: T.gold, letterSpacing: '-0.01em' }}>k</span>
              </div>
              <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 10, color: T.gold, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Tiết kiệm 498.000đ · ≈ 53% rẻ hơn</div>
              <button style={{ marginTop: 28, width: '100%', padding: '18px', background: T.gold, color: T.forest, border: 'none', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Đặt lịch năm</button>
              <div style={{ marginTop: 12, fontFamily: 'var(--serif)', fontSize: 12, color: 'rgba(237,231,211,0.6)', textAlign: 'center', lineHeight: 1.5 }}>
                Hoàn tiền 7 ngày · không tự gia hạn
              </div>
            </div>
          </div>
        </div>

        {/* Other tiers — collapsed, low visual weight */}
        <div style={{ marginTop: 36 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: T.muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Các gói khác</div>
          <div className="other-tiers" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {[
              { name: '1 tháng', sub: 'Chỉ lịch · dùng thử', price: '49.000', per: '/ tháng' },
              { name: '6 tháng', sub: 'Chỉ lịch', price: '249.000', per: '6 tháng', save: 'tiết kiệm 15%' },
            ].map(t => (
              <div key={t.name} style={{ padding: '20px 24px', background: '#fff', border: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: T.ink, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{t.name}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: T.muted, marginTop: 4 }}>{t.sub}{t.save ? ` · ${t.save}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26, color: T.goldDeep, lineHeight: 1, letterSpacing: '-0.015em', fontVariantNumeric: 'tabular-nums' }}>{t.price}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: T.muted, marginTop: 3 }}>đ · {t.per}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontFamily: 'var(--serif)', fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>
            Gói 1 tháng và 6 tháng <strong style={{ color: T.ink, fontWeight: 600 }}>chỉ có lịch hằng ngày</strong> — chưa gồm luận giải Bát tự / Tiểu Vận. Muốn mua riêng: Bát tự 299k · Tiểu Vận 199k.
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════
function LFAQ() {
  const qs = [
    ['Lịch dùng thế nào?', 'Sau 30 giây nhập ngày giờ sinh, lá số tứ trụ của bạn được lập. Mỗi sáng mở app, trang hôm nay đã chấm điểm theo mệnh bạn. Mục Lịch tháng cho cả tháng. Mục Tra cứu khi cần ngày tốt cho một việc cụ thể.'],
    ['Có chính xác không?', 'Hệ thống đối chiếu 4 nguồn cổ: Hiệp Kỷ Biện Phương, Ngọc Hạp Thông Thư, Tử Bình Chân Thuyên, Tam Mệnh Thông Hội. Mỗi điểm số đều có thể bấm xem câu nguyên văn trích từ sách nào.'],
    ['Mua gói nào hợp lý nhất?', 'Gói năm 449k — bao gồm Lịch cả năm + Luận giải Bát tự + Luận giải Tiểu Vận năm. Tổng giá trị 947k. Mua từng phần riêng tốn nhiều hơn và không có lịch hằng ngày.'],
    ['Có cần biết tử vi không?', 'Không. Bạn chỉ nhập ngày giờ sinh, app tự tính. Luận giải viết tiếng Việt thường ngày — không Hán Việt nặng.'],
    ['Cài app thế nào?', 'Cài 1 chạm trên iPhone và Android — không qua App Store. Đây là PWA (web app cài được như app thật). Lịch đồng bộ với tài khoản web. Trang đã tải vẫn xem được khi mất mạng.'],
    ['App tự gia hạn không?', 'Không bao giờ. Hết hạn thì bạn chủ động gia hạn — không tự trừ tiền thẻ. Hoàn tiền trong 7 ngày nếu không hài lòng.'],
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id="hỏi-đáp" style={{ background: T.paper, padding: '88px 6vw', borderTop: `1px solid ${T.hairline}` }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 32 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: T.goldDeep, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Hỏi đáp</span>
          <span style={{ flex: 1, height: 1, background: T.hairline }} />
        </div>
        <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 48, lineHeight: 1.02, letterSpacing: '-0.015em', textTransform: 'uppercase', color: T.ink, marginBottom: 32 }}>
          6 câu <span style={{ color: T.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700 }}>hay gặp nhất</span>
        </h2>
        {qs.map(([q, a], i) => (
          <div key={i} onClick={() => setOpen(open === i ? -1 : i)} style={{ borderTop: `1px solid ${T.hairline}`, padding: '22px 0', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: T.muted, letterSpacing: '0.16em', minWidth: 32 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, textTransform: 'uppercase', color: T.ink, letterSpacing: '-0.005em' }}>{q}</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 18, color: T.goldDeep, transform: open === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>+</span>
            </div>
            {open === i && <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.7, marginTop: 14, color: T.ink2, paddingLeft: 48 }}>{a}</p>}
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${T.hairline}` }} />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FINAL CTA
// ═══════════════════════════════════════════════════════════════════
function LCTA() {
  return (
    <section style={{ background: T.forest, color: T.cream, padding: '96px 6vw', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(197,165,90,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: T.gold, letterSpacing: '0.24em', textTransform: 'uppercase' }}>Bắt đầu</div>
        <h2 className="cta-h2" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 88, lineHeight: 0.94, marginTop: 18, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Trang đầu tiên<br /><span style={{ color: T.gold, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>miễn phí — 30 giây</span>.
        </h2>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'rgba(237,231,211,0.72)', marginTop: 18 }}>Lập lá số · mở trang hôm nay ngay · không cần thẻ</p>
        <button style={{ marginTop: 32, padding: '22px 40px', background: T.gold, color: T.forest, border: 'none', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 16px 32px rgba(197,165,90,0.25)' }}>Lập lịch của tôi →</button>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════
function LFooter() {
  return (
    <footer style={{ background: T.forestDeep, color: 'rgba(237,231,211,0.6)', padding: '56px 6vw 88px', borderTop: '1px solid rgba(197,165,90,0.15)' }}>
      <div className="footer-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="assets/logo-mark-reversed.svg" width="36" height="36" alt="" />
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: T.cream, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Ngày Lành</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 9, letterSpacing: '0.32em', color: T.gold, textTransform: 'uppercase' }}>Tháng Tốt</div>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--serif)', marginTop: 20, fontSize: 13.5, lineHeight: 1.7, maxWidth: 320, color: 'rgba(237,231,211,0.55)' }}>
            Lịch tờ điện tử cá nhân — chấm điểm theo lá số tứ trụ riêng của bạn. Mỗi sáng một trang.
          </p>
        </div>
        {[
          ['Sản phẩm', ['Lập lịch của tôi', 'Lá số tứ trụ', 'Bảng giá', 'PWA — cài lên điện thoại']],
          ['Công ty', ['Câu hỏi thường gặp', 'Liên hệ', 'Tuyển dụng']],
          ['Pháp lý', ['Điều khoản', 'Bảo mật dữ liệu', 'Chính sách hoàn tiền']],
        ].map(([t, l]) => (
          <div key={t}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: T.gold, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{t}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
              {l.map(x => <li key={x} style={{ padding: '6px 0', fontFamily: 'var(--serif)', fontSize: 13.5 }}>{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: '48px auto 0', paddingTop: 28, borderTop: '1px solid rgba(197,165,90,0.12)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'rgba(237,231,211,0.5)', letterSpacing: '0.08em' }}>
        <span>© 2026 Ngày Lành Tháng Tốt · ngaylanhthangtot.vn</span>
        <span>Made in Sài Gòn · với lá số của bạn</span>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STICKY MOBILE CTA BAR
// ═══════════════════════════════════════════════════════════════════
function LStickyMobileCTA() {
  return (
    <div className="sticky-mobile-cta" style={{ display: 'none', position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, background: 'rgba(240,236,226,0.96)', backdropFilter: 'blur(14px)', borderTop: `1px solid ${T.hairline}`, padding: '12px 18px', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>30 giây · không cần thẻ</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: T.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Lập lịch của tôi</div>
      </div>
      <button style={{ padding: '12px 18px', background: T.forest, color: T.cream, border: 'none', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Bắt đầu →</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════
function CLanding() {
  const [menu, setMenu] = useState(false);
  return (
    <div style={{ background: T.paper, fontFamily: 'var(--serif)', color: T.ink, paddingBottom: 0 }}>
      <LHeader onMenuClick={() => setMenu(true)} />
      <LMobileDrawer open={menu} onClose={() => setMenu(false)} />
      <LHero />
      <LRitual />
      <LPersonal />
      <LYearSpread />
      <LPricing />
      <LFAQ />
      <LCTA />
      <LFooter />
      <LStickyMobileCTA />

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 900px) {
          .l-nav-desktop { display: none !important; }
          .l-nav-mobile { display: block !important; }
          .hero-grid, .personal-grid, .hero-tier-grid, .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .ritual-pages, .other-tiers { grid-template-columns: 1fr !important; gap: 14px !important; }
          .year-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 12px !important; }
          .hero-h1 { font-size: 60px !important; }
          .ritual-h2, .personal-h2 { font-size: 38px !important; }
          .year-h2, .pricing-h3, .cta-h2 { font-size: 40px !important; }
          .hero-stack { height: 380px !important; }
          .hero-front { width: 220px !important; height: 300px !important; left: 10% !important; }
          .hero-price { font-size: 80px !important; }
          .sticky-mobile-cta { display: flex !important; }
          body { padding-bottom: 76px !important; }
        }
        @media (max-width: 560px) {
          .year-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hero-h1 { font-size: 48px !important; }
          .hero-front { width: 200px !important; left: 5% !important; }
        }
      `}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CLanding />);
