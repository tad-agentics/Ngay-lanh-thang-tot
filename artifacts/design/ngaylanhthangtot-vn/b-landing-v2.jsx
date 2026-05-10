/* Landing v2 — desktop + mobile. Globals: React, Logo, LogoMark, Kanji, Mono, Stamp, Ticket, useB
   Designed to match AI reading row polish. Mobile is a separate component (LandingV2Mobile) at 390w. */
/* global React, Logo, LogoMark, Kanji, Mono, Stamp, Ticket, useB */
const { useState: lvUseState } = React;

const TOK = {
  paper: '#f0ece2', paperWarm: '#ede7d3', ink: '#18150e', ink2: '#3a3220',
  forest: '#1d3129', forestDeep: '#0e1c14', cream: '#ede7d3',
  gold: '#c5a55a', goldDeep: '#7d6219', goldLight: '#c9a84c',
  border: 'rgba(125,98,25,0.26)', borderStrong: 'rgba(125,98,25,0.5)',
  muted: '#6a5f3f',
};

// ─── Section primitive — paper sheet with optional dark ───
function LSection({ dark, children, style, label, kicker, full = false }) {
  return (
    <section style={{
      background: dark ? TOK.forest : TOK.paper,
      color: dark ? TOK.cream : TOK.ink,
      padding: full ? '88px 64px' : '72px 64px',
      position: 'relative',
      borderTop: dark ? '1px solid rgba(197,165,90,0.15)' : `1px solid ${TOK.border}`,
      ...style,
    }}>
      {(kicker || label) && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 32 }}>
          <Mono style={{ color: dark ? TOK.gold : TOK.goldDeep, letterSpacing: '0.22em', fontSize: 11 }}>{label}</Mono>
          <span style={{ flex: 1, height: 1, background: dark ? 'rgba(197,165,90,0.25)' : TOK.border }} />
          {kicker && <Mono style={{ color: dark ? 'rgba(237,231,211,0.55)' : TOK.muted, fontSize: 10 }}>{kicker}</Mono>}
        </div>
      )}
      {children}
    </section>
  );
}

// ─── Top header ───
function LHeader() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(240,236,226,0.92)', backdropFilter: 'blur(16px) saturate(140%)',
      borderBottom: `1px solid ${TOK.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 64px',
    }}>
      <Logo size={42} />
      <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {['Vì sao', 'Cách dùng', 'Bảng giá', 'Hỏi đáp'].map(n => (
          <a key={n} style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 13, color: TOK.ink2, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}>{n}</a>
        ))}
        <a style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 13, color: TOK.goldDeep, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Đăng nhập</a>
        <button style={{ padding: '10px 18px', background: TOK.forest, color: TOK.cream, border: 'none', borderRadius: 999, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mở quẻ — 30 giây</button>
      </nav>
    </header>
  );
}

// ─── Hero — almanac centerfold ───
function LHero() {
  return (
    <section style={{ background: TOK.paper, padding: '64px 64px 96px', position: 'relative', overflow: 'hidden' }}>
      {/* Watermark hanzi */}
      <Kanji ch="吉" size={680} drift style={{ position: 'absolute', right: -120, top: -40, color: 'rgba(197,165,90,0.06)', WebkitTextStroke: '1px rgba(197,165,90,0.06)', pointerEvents: 'none' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center', position: 'relative' }}>
        {/* LEFT — Editorial copy */}
        <div>
          <Mono style={{ color: TOK.goldDeep, letterSpacing: '0.22em' }}>—— Niên giám điện tử · 2026 Bính Ngọ</Mono>
          <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 88, lineHeight: 0.92, letterSpacing: '-0.025em', textTransform: 'uppercase', color: TOK.ink, margin: '20px 0 12px' }}>
            Một ngày<br /><span style={{ color: TOK.goldDeep, fontStyle: 'italic', fontWeight: 700 }}>cho riêng</span><br />mệnh của bạn.
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.7, color: TOK.ink2, maxWidth: 520, margin: '22px 0 32px', fontFamily: 'var(--serif)' }}>
            Lịch in chung nói “ngày này lành” — lành cho ai? Ở đây mỗi gợi ý đứng trên ngày giờ sinh của bạn, kèm lý do gửi được cho cả nhà.
          </p>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            <button style={{ padding: '18px 30px', background: TOK.forest, color: TOK.cream, border: 'none', borderRadius: 8, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 12px 24px rgba(29,49,41,0.22)' }}>Mở quẻ — 30 giây →</button>
            <div>
              <Mono style={{ color: TOK.goldDeep, fontSize: 11 }}>★★★★★   1.842 hộ</Mono>
              <div style={{ fontSize: 12, color: TOK.muted, marginTop: 2 }}>Đã dựng lá số tứ trụ tuần qua</div>
            </div>
          </div>
        </div>
        {/* RIGHT — Phiếu artefact */}
        <LHeroPhieu />
      </div>
      {/* Trust band beneath */}
      <div style={{ marginTop: 64, paddingTop: 28, borderTop: `1px solid ${TOK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, position: 'relative' }}>
        <Mono style={{ color: TOK.muted, fontSize: 10 }}>Đối chiếu với</Mono>
        {['Hiệp Kỷ Biện Phương', 'Ngọc Hạp Thông Thư', 'Bộ Tứ Trụ Hồ Điểu', 'Lịch Vạn Niên 2026'].map((n, i) => (
          <span key={i} style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 14, color: TOK.ink2, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>{n}</span>
        ))}
      </div>
    </section>
  );
}

function LHeroPhieu() {
  return (
    <div style={{ position: 'relative', height: 540 }}>
      {/* Stack of phiếu — back layer */}
      <div style={{ position: 'absolute', top: 30, left: 30, width: 360, height: 480, background: '#e1d8b8', boxShadow: '0 18px 30px rgba(0,0,0,0.12)', transform: 'rotate(-3deg)', borderRadius: 2 }} />
      <div style={{ position: 'absolute', top: 14, left: 14, width: 360, height: 480, background: '#e8dec1', boxShadow: '0 14px 28px rgba(0,0,0,0.1)', transform: 'rotate(-1.5deg)', borderRadius: 2 }} />
      {/* Front phiếu */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 360, height: 480, background: TOK.paperWarm, boxShadow: '0 30px 50px rgba(0,0,0,0.18)', borderRadius: 2, overflow: 'hidden' }}>
        {/* Top perforation */}
        <div style={{ height: 12, background: 'repeating-linear-gradient(90deg, transparent 0 6px, rgba(122,112,80,0.08) 6px 10px)', borderBottom: '1px dashed rgba(122,112,80,0.45)' }} />
        <div style={{ position: 'absolute', top: 38, left: -7, width: 14, height: 14, borderRadius: '50%', background: TOK.paper }} />
        <div style={{ position: 'absolute', top: 38, right: -7, width: 14, height: 14, borderRadius: '50%', background: TOK.paper }} />
        {/* Header */}
        <div style={{ padding: '18px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Mono style={{ color: TOK.goldDeep }}>Phiếu chọn ngày · v.1</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 24, lineHeight: 1, marginTop: 6, textTransform: 'uppercase' }}>Khai trương</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: TOK.muted, marginTop: 4 }}>NGUYỄN MINH ANH · 1992</div>
          </div>
          <Stamp ch="吉日" style={{ fontSize: 18 }} />
        </div>
        {/* Big number */}
        <div style={{ padding: '0 24px', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 132, color: TOK.goldDeep, lineHeight: 0.85, letterSpacing: '-0.04em' }}>15</div>
          <div style={{ paddingBottom: 14 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 22, lineHeight: 1, textTransform: 'uppercase' }}>Tháng năm</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: TOK.muted, marginTop: 4 }}>2026 · Bính Ngọ</div>
            <div style={{ fontFamily: 'var(--hanzi)', fontWeight: 700, fontSize: 16, color: TOK.goldDeep, marginTop: 4 }}>三月二十八</div>
          </div>
        </div>
        {/* Reasoning */}
        <div style={{ padding: '14px 24px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontFamily: 'var(--mono)', fontSize: 10, color: TOK.muted }}>
            {[['Trực', 'Định'], ['Sao', 'Thiên Đức'], ['Giờ', '7–9h Thìn'], ['Điểm', '92/100']].map(([k, v]) => (
              <div key={k} style={{ borderTop: `1px solid ${TOK.border}`, paddingTop: 6 }}>
                <div style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: TOK.ink, marginTop: 2, letterSpacing: '0.02em' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom perforation + stub */}
        <div style={{ position: 'absolute', bottom: 56, left: 0, right: 0, height: 1, borderTop: '1px dashed rgba(122,112,80,0.45)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 24px', background: 'rgba(122,112,80,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Mono style={{ color: TOK.muted }}>Đối chiếu · NLTT-2026-0042</Mono>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: TOK.goldDeep, letterSpacing: '0.18em' }}>·11/05·</span>
        </div>
      </div>
      {/* Floating chip — score */}
      <div style={{ position: 'absolute', top: -16, right: -16, width: 86, height: 86, borderRadius: '50%', background: TOK.forest, color: TOK.gold, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(29,49,41,0.3)', border: `2px solid ${TOK.gold}` }}>
        <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 32, lineHeight: 1 }}>92</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.16em' }}>/100</span>
      </div>
    </div>
  );
}

// ─── 3-up: lịch in vs thầy bốc vs NLTT ───
function LCompare() {
  const cols = [
    {
      tag: 'Lịch in', title: 'Một câu trả lời cho 90 triệu người', body: 'Lịch in của các nhà xuất bản gộp chung mọi tuổi để vừa quyển sách — không sai, nhưng cũng không đủ.',
      con: ['“Ngày 17/06 hợp khai trương”', 'Không biết mệnh của bạn', 'Không có giờ đẹp riêng', 'Không lý giải được'],
    },
    {
      tag: 'Thầy bốc', title: 'Đắt, chậm, khó kiểm chứng', body: '500k–2tr một lần, đợi 2–7 ngày, ngồi nghe 2 tiếng. Một việc — một lần.',
      con: ['Khó hẹn lịch', 'Mỗi thầy một kiểu', 'Trả tiền theo việc', 'Không lưu lại được'],
    },
    {
      tag: 'Ngày Lành Tháng Tốt', title: 'Một câu trả lời cho riêng bạn', body: 'Lá số tứ trụ bám theo ngày giờ sinh — mọi gợi ý sau đều tự khớp với mệnh của bạn.',
      pro: ['92/100 với mệnh Quý Thủy', 'Lý do tiếng Việt rõ ràng', 'Giờ đẹp kèm phiếu', 'Lưu và gửi cho cả nhà'],
      featured: true,
    },
  ];
  return (
    <LSection label="Vì sao" kicker="Lịch chung nói “ngày này lành” — lành cho ai?">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {cols.map((c, i) => (
          <div key={i} style={{
            position: 'relative',
            background: c.featured ? TOK.forest : TOK.paperWarm,
            color: c.featured ? TOK.cream : TOK.ink,
            padding: '32px 28px',
            borderRadius: 4,
            border: c.featured ? `1px solid ${TOK.gold}` : `1px solid ${TOK.border}`,
            boxShadow: c.featured ? '0 24px 48px rgba(29,49,41,0.2)' : '0 4px 12px rgba(0,0,0,0.04)',
            transform: c.featured ? 'translateY(-12px)' : 'none',
            overflow: 'hidden',
          }}>
            {c.featured && <Kanji ch="新" size={220} style={{ position: 'absolute', right: -40, bottom: -60, color: 'rgba(197,165,90,0.08)', WebkitTextStroke: '1px rgba(197,165,90,0.08)' }} />}
            <Mono style={{ color: c.featured ? TOK.gold : TOK.goldDeep, fontSize: 10 }}>{c.tag}</Mono>
            <h3 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 24, lineHeight: 1.1, marginTop: 10, textTransform: 'uppercase', letterSpacing: '-0.005em', position: 'relative' }}>{c.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 12, color: c.featured ? 'rgba(237,231,211,0.78)' : TOK.ink2, position: 'relative' }}>{c.body}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', position: 'relative' }}>
              {(c.pro || c.con).map((x, j) => (
                <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', fontSize: 13, fontFamily: 'var(--mono)', color: c.featured ? 'rgba(237,231,211,0.85)' : TOK.ink2, borderBottom: j < (c.pro || c.con).length - 1 ? `1px dashed ${c.featured ? 'rgba(197,165,90,0.2)' : TOK.border}` : 'none' }}>
                  <span style={{ color: c.pro ? TOK.gold : '#b34a3a', flexShrink: 0 }}>{c.pro ? '✓' : '×'}</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </LSection>
  );
}

// ─── How it works — 3 steps with phiếu visual ───
function LHow() {
  const steps = [
    { n: '01', ch: '命', t: 'Dựng lá số', d: 'Ngày, tháng, năm, giờ sinh — chúng tôi tính tứ trụ và mệnh.' },
    { n: '02', ch: '事', t: 'Chọn việc', d: 'Khai trương, cưới hỏi, ký kết… 26 kiểu việc, mỗi kiểu có quy tắc riêng.' },
    { n: '03', ch: '吉', t: 'Nhận phiếu', d: 'Top 1 + lý do tiếng Việt + giờ đẹp. Lưu lịch hoặc gửi cả nhà.' },
  ];
  return (
    <LSection dark label="Cách dùng" kicker="30 giây đến phiếu đầu tiên">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
        {/* Connecting line */}
        <div style={{ position: 'absolute', top: 64, left: '14%', right: '14%', height: 1, background: 'rgba(197,165,90,0.3)', backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 4px, rgba(197,165,90,0.4) 4px 8px)' }} />
        {steps.map((s, i) => (
          <div key={i} style={{ position: 'relative', textAlign: 'center', padding: '0 12px' }}>
            <div style={{ width: 128, height: 128, borderRadius: '50%', background: TOK.forestDeep, border: `2px solid ${TOK.gold}`, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ fontFamily: 'var(--hanzi)', fontWeight: 700, fontSize: 60, color: TOK.gold, lineHeight: 1 }}>{s.ch}</span>
              <span style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', background: TOK.gold, color: TOK.forest, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', borderRadius: 999 }}>Bước {s.n}</span>
            </div>
            <h3 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 28, marginTop: 28, textTransform: 'uppercase', color: TOK.cream }}>{s.t}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10, color: 'rgba(237,231,211,0.7)' }}>{s.d}</p>
          </div>
        ))}
      </div>
    </LSection>
  );
}

// ─── Methodology — show our work ───
function LMethod() {
  return (
    <LSection label="Cách tính" kicker="Đối chiếu được — không phải hộp đen">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 56, lineHeight: 1.04, textTransform: 'uppercase', letterSpacing: '-0.015em' }}>
            Mỗi điểm số<br />đều <span style={{ color: TOK.goldDeep, fontStyle: 'italic', fontWeight: 700 }}>trỏ về</span> một câu trong sách cũ.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: TOK.ink2, marginTop: 18, maxWidth: 480 }}>
            Hệ chấm điểm theo 4 lớp: <strong>trực ngày</strong> (Hiệp Kỷ), <strong>nhị thập bát tú</strong>, <strong>can chi tương sinh tương khắc</strong> với tứ trụ của bạn, và <strong>thần sát</strong> (Thiên Đức, Nguyệt Đức, Tam Sát…).
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: TOK.muted, marginTop: 14, fontStyle: 'italic' }}>
            Mỗi lớp đều được trích nguồn — bạn có thể bấm vào để xem câu nguyên văn.
          </p>
        </div>
        <div style={{ background: TOK.paperWarm, border: `1px solid ${TOK.border}`, borderRadius: 4, padding: '32px 32px', position: 'relative' }}>
          <Mono style={{ color: TOK.goldDeep }}>Bóc tách điểm 92/100</Mono>
          <div style={{ marginTop: 18 }}>
            {[
              { label: 'Trực Định', src: 'Hiệp Kỷ Biện Phương · q.4', score: '+24' },
              { label: 'Sao Thiên Đức', src: 'Ngọc Hạp Thông Thư', score: '+20' },
              { label: 'Can chi tương sinh', src: 'Bính Tuất → Nhâm Thân', score: '+28' },
              { label: 'Giờ Thìn 7–9h', src: 'Tứ trụ chủ — Mộc vượng', score: '+20' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 3 ? `1px dashed ${TOK.border}` : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}>{r.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: TOK.muted, marginTop: 2 }}>{r.src}</div>
                </div>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: TOK.goldDeep, fontVariantNumeric: 'tabular-nums' }}>{r.score}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: '10px 0 2px', borderTop: `2px solid ${TOK.ink}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase' }}>Tổng</span>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 36, color: TOK.goldDeep }}>92<span style={{ fontSize: 14, color: TOK.muted }}>/100</span></span>
            </div>
          </div>
        </div>
      </div>
    </LSection>
  );
}

// ─── Pricing ───
function LPricing() {
  return (
    <LSection label="Bảng giá" kicker="Trả theo lượng · không gói nào ép buộc" style={{ background: TOK.paperWarm }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 56, alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 56, lineHeight: 1.04, textTransform: 'uppercase' }}>
            Trả theo<br />lượng —<br />không gói nào<br /><span style={{ color: TOK.goldDeep }}>ép buộc</span>.
          </h2>
          <p style={{ fontSize: 14, color: TOK.muted, marginTop: 18, lineHeight: 1.65 }}>
            VNĐ qua ZaloPay · MoMo · Thẻ. Hủy bất cứ lúc nào. Hoàn tiền trong 7 ngày.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'Lẻ — gói nhỏ', kicker: 'Dùng thử', l: 30, p: '49.000₫', per: 'một lần', items: ['30 lượng dùng dần', 'Đủ cho 6–8 việc', 'Không tự động nạp'], cta: 'Mua lượng', b: null },
            { name: 'Tháng An Cư', kicker: 'Phổ biến · 78%', l: 100, p: '89.000₫', per: '/ tháng', items: ['100 lượng / tháng', 'Lá số tứ trụ chi tiết', 'Cảnh báo Tam Tai · Tuế Phá', 'Nhắc trước 7 ngày'], cta: 'Đăng ký tháng', b: 'PHỔ BIẾN' },
            { name: 'Năm Phú Quý', kicker: 'Tiết kiệm 30%', l: 1500, p: '749.000₫', per: '/ năm', items: ['1.500 lượng / năm', 'Mọi tính năng An Cư', 'Hỗ trợ ưu tiên', 'Hóa đơn VAT'], cta: 'Đăng ký năm', b: null },
          ].map((p, i) => (
            <div key={i} style={{ position: 'relative', background: p.b ? TOK.forest : '#fff', color: p.b ? TOK.cream : TOK.ink, padding: '28px 22px', borderRadius: 4, border: p.b ? `1px solid ${TOK.gold}` : `1px solid ${TOK.border}` }}>
              {p.b && <span style={{ position: 'absolute', top: -10, left: 22, padding: '3px 10px', background: TOK.gold, color: TOK.forest, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 9, letterSpacing: '0.18em', borderRadius: 3 }}>{p.b}</span>}
              {!p.b && <Mono style={{ color: TOK.goldDeep }}>{p.kicker}</Mono>}
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, marginTop: p.b ? 14 : 8, textTransform: 'uppercase' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 44, lineHeight: 1, color: p.b ? TOK.gold : TOK.goldDeep }}>{p.p}</span>
                <Mono style={{ color: p.b ? 'rgba(197,165,90,0.7)' : TOK.muted }}>{p.per}</Mono>
              </div>
              <Mono style={{ color: p.b ? 'rgba(197,165,90,0.7)' : TOK.muted, fontSize: 11, marginTop: 4 }}>{p.l} lượng</Mono>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: p.b ? '1px solid rgba(197,165,90,0.2)' : `1px solid ${TOK.border}` }}>
                {p.items.map((it, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 13, fontFamily: 'var(--mono)', color: p.b ? 'rgba(237,231,211,0.85)' : TOK.ink2 }}>
                    <span style={{ color: p.b ? TOK.gold : TOK.goldDeep }}>✓</span>{it}
                  </div>
                ))}
              </div>
              <button style={{ marginTop: 20, width: '100%', padding: '12px', background: p.b ? TOK.gold : 'transparent', color: p.b ? TOK.forest : TOK.ink, border: p.b ? 'none' : `1px solid ${TOK.borderStrong}`, borderRadius: 4, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.cta} →</button>
            </div>
          ))}
        </div>
      </div>
    </LSection>
  );
}

// ─── Testimonials — single-column with phiếu treatment ───
function LTesti() {
  const items = [
    { name: 'Chị Hằng · Đà Nẵng', body: 'Tiệm tôi khai trương 17/06 đúng theo phiếu, ngày đó gấp đôi lượt khách so với hôm thử bán.', ev: 'Khai trương cửa hàng' },
    { name: 'Anh Tuấn · TP.HCM', body: 'Mẹ vợ là người tin tử vi nặng nề. Tôi gửi phiếu qua Zalo, bà cụ duyệt liền — đỡ phải đi xem thầy.', ev: 'Cưới hỏi' },
    { name: 'Chị Linh · Hà Nội', body: 'Lý do ghi tiếng Việt rõ — không phải đoán. Đặt cọc nhà 26/06 đúng giờ Mùi đã yên tâm.', ev: 'Mua nhà' },
  ];
  return (
    <LSection dark label="Khách nói gì" kicker="1.842 hộ đã dựng lá số · từ tháng 3 / 2025">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
        {items.map((t, i) => (
          <div key={i} style={{ background: TOK.forestDeep, border: `1px solid rgba(197,165,90,0.18)`, padding: '28px 26px', position: 'relative', borderRadius: 4 }}>
            <span style={{ position: 'absolute', top: 12, right: 14, fontFamily: 'var(--hanzi)', fontWeight: 700, fontSize: 56, color: 'rgba(197,165,90,0.1)', lineHeight: 1 }}>“</span>
            <Mono style={{ color: TOK.gold }}>{t.ev}</Mono>
            <p style={{ fontSize: 15, lineHeight: 1.65, marginTop: 14, color: 'rgba(237,231,211,0.88)', fontStyle: 'italic', position: 'relative', fontFamily: 'var(--serif)' }}>"{t.body}"</p>
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px dashed rgba(197,165,90,0.2)', fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(237,231,211,0.6)', letterSpacing: '0.06em' }}>{t.name}</div>
          </div>
        ))}
      </div>
    </LSection>
  );
}

// ─── FAQ — 4 questions with disclosure ───
function LFAQ() {
  const qs = [
    ['Có cần biết tử vi không?', 'Không. Bạn nhập ngày giờ sinh, app tự tính tứ trụ. Phần luận giải viết bằng tiếng Việt thường ngày — không có Hán Việt nặng nếu bạn không bật.'],
    ['Có chính xác không?', 'Hệ thống đối chiếu 4 nguồn: Hiệp Kỷ Biện Phương, Ngọc Hạp Thông Thư, Bộ Tứ Trụ Hồ Điểu, Lịch Vạn Niên 2026. Mỗi điểm số đều có thể bấm vào xem câu nguyên văn.'],
    ['Lượng có hết hạn không?', 'Không. Mua một lần, dùng dần. Không tự gia hạn — bạn không bị trừ tiền nếu không chủ động mua thêm.'],
    ['App có cài không?', 'Có. Cài 1 chạm trên iPhone/Android (PWA — không qua App Store). Hoặc dùng trên web. Lá số đồng bộ.'],
  ];
  const [open, setOpen] = lvUseState(0);
  return (
    <LSection label="Hỏi đáp" kicker="4 câu hay gặp nhất">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {qs.map(([q, a], i) => (
          <div key={i} onClick={() => setOpen(open === i ? -1 : i)} style={{ borderTop: `1px solid ${TOK.border}`, padding: '20px 0', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: TOK.muted, letterSpacing: '0.14em', minWidth: 32 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 20, textTransform: 'uppercase', color: TOK.ink, letterSpacing: '-0.005em' }}>{q}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: TOK.goldDeep, transform: open === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>+</span>
            </div>
            {open === i && <p style={{ fontSize: 15, lineHeight: 1.65, marginTop: 12, color: TOK.ink2, paddingLeft: 48 }}>{a}</p>}
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${TOK.border}`, paddingTop: 20 }} />
      </div>
    </LSection>
  );
}

// ─── Final CTA + Footer ───
function LCTA() {
  return (
    <section style={{ background: TOK.forest, color: TOK.cream, padding: '96px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <Kanji ch="日" size={520} drift style={{ position: 'absolute', left: -100, top: '50%', transform: 'translateY(-50%)', color: 'rgba(197,165,90,0.06)', WebkitTextStroke: '1px rgba(197,165,90,0.06)' }} />
      <Kanji ch="月" size={520} style={{ position: 'absolute', right: -100, top: '50%', transform: 'translateY(-50%)', color: 'rgba(197,165,90,0.06)', WebkitTextStroke: '1px rgba(197,165,90,0.06)' }} />
      <div style={{ position: 'relative' }}>
        <Mono style={{ color: TOK.gold }}>Bắt đầu</Mono>
        <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 88, lineHeight: 0.96, marginTop: 16, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Phiếu đầu tiên<br /><span style={{ color: TOK.gold }}>miễn phí — 30 giây.</span>
        </h2>
        <p style={{ fontSize: 18, color: 'rgba(237,231,211,0.72)', marginTop: 18 }}>20 lượng tặng · không cần thẻ</p>
        <button style={{ marginTop: 32, padding: '20px 36px', background: TOK.gold, color: TOK.forest, border: 'none', borderRadius: 8, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 16px 32px rgba(197,165,90,0.25)' }}>Mở quẻ ngay →</button>
      </div>
    </section>
  );
}

function LFooter() {
  return (
    <footer style={{ background: TOK.forestDeep, color: 'rgba(237,231,211,0.6)', padding: '48px 64px 32px', borderTop: '1px solid rgba(197,165,90,0.15)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 48 }}>
        <div>
          <Logo dark size={36} showUrl />
          <p style={{ marginTop: 18, fontSize: 13, lineHeight: 1.65, maxWidth: 320 }}>
            Niên giám điện tử cho người Việt — chọn ngày dựa trên lá số tứ trụ, không phải lịch chung.
          </p>
        </div>
        {[
          ['Sản phẩm', ['Mở quẻ hôm nay', 'Lá số tứ trụ', 'Bảng giá', 'PWA — cài lên điện thoại']],
          ['Công ty', ['Vì sao NLTT', 'Câu hỏi thường gặp', 'Liên hệ', 'Tuyển dụng']],
          ['Pháp lý', ['Điều khoản', 'Bảo mật dữ liệu', 'Chính sách hoàn tiền', 'GPKD 0317...']],
        ].map(([t, l]) => (
          <div key={t}>
            <Mono style={{ color: TOK.gold }}>{t}</Mono>
            <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
              {l.map(x => <li key={x} style={{ padding: '5px 0', fontSize: 13, fontFamily: 'var(--serif)' }}>{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(197,165,90,0.12)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(237,231,211,0.5)', letterSpacing: '0.08em' }}>
        <span>© 2026 Ngày Lành Tháng Tốt — ngaylanhthangtot.vn</span>
        <span>Made in Sài Gòn · với lá số của bạn</span>
      </div>
    </footer>
  );
}

function LandingV2() {
  return (
    <div style={{ background: TOK.paper, fontFamily: 'var(--serif)', color: TOK.ink }}>
      <LHeader />
      <LHero />
      <LCompare />
      <LHow />
      <LMethod />
      <LPricing />
      <LTesti />
      <LFAQ />
      <LCTA />
      <LFooter />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LandingV2Mobile — 390w. Sticky CTA bar, accordion sections, vertical phiếu hero
// ═══════════════════════════════════════════════════════════════════════════
function LandingV2Mobile() {
  const [tab, setTab] = lvUseState(2); // 3-up compare collapsed to tabs
  const [faq, setFaq] = lvUseState(0);
  return (
    <div style={{ background: TOK.paper, fontFamily: 'var(--serif)', color: TOK.ink, minHeight: '100%', position: 'relative' }}>
      {/* Mobile header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(240,236,226,0.94)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${TOK.border}`, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={28} />
        <button aria-label="menu" style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', gap: 4, padding: 6 }}>
          {[0,1,2].map(i => <span key={i} style={{ width: 18, height: 1.5, background: TOK.ink }} />)}
        </button>
      </header>

      {/* Hero — vertical, phiếu BELOW headline */}
      <section style={{ padding: '32px 22px 28px', position: 'relative', overflow: 'hidden' }}>
        <Kanji ch="吉" size={360} drift style={{ position: 'absolute', right: -80, top: 40, color: 'rgba(197,165,90,0.07)', WebkitTextStroke: '1px rgba(197,165,90,0.07)', pointerEvents: 'none' }} />
        <Mono style={{ color: TOK.goldDeep }}>Niên giám cá nhân</Mono>
        <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 42, lineHeight: 0.98, letterSpacing: '-0.015em', textTransform: 'uppercase', margin: '14px 0 12px', position: 'relative' }}>
          Mở quẻ<br /><span style={{ color: TOK.goldDeep, fontStyle: 'italic' }}>hôm nay</span>.<br />30 giây.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: TOK.ink2, position: 'relative' }}>
          Tứ trụ của bạn. 26 việc. Mỗi phiếu kèm điểm và lý do tiếng Việt.
        </p>
        {/* Phiếu — small, decorative */}
        <div style={{ marginTop: 24, position: 'relative', height: 280 }}>
          <div style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 264, background: '#e8dec1', boxShadow: '0 8px 16px rgba(0,0,0,0.08)', transform: 'rotate(-1.5deg)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 264, background: TOK.paperWarm, boxShadow: '0 18px 30px rgba(0,0,0,0.12)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: 10, background: 'repeating-linear-gradient(90deg, transparent 0 5px, rgba(122,112,80,0.08) 5px 9px)', borderBottom: '1px dashed rgba(122,112,80,0.45)' }} />
            <div style={{ position: 'absolute', top: 28, left: -6, width: 12, height: 12, borderRadius: '50%', background: TOK.paper }} />
            <div style={{ position: 'absolute', top: 28, right: -6, width: 12, height: 12, borderRadius: '50%', background: TOK.paper }} />
            <div style={{ padding: '14px 18px 8px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Mono style={{ color: TOK.goldDeep, fontSize: 9 }}>Phiếu chọn ngày</Mono>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, marginTop: 4, textTransform: 'uppercase' }}>Khai trương</div>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: TOK.forest, color: TOK.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', border: `1.5px solid ${TOK.gold}` }}>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 20, lineHeight: 1 }}>92</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 7 }}>/100</span>
              </div>
            </div>
            <div style={{ padding: '0 18px', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 92, lineHeight: 0.85, color: TOK.goldDeep, letterSpacing: '-0.04em' }}>15</span>
              <div style={{ paddingBottom: 8 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}>Tháng 5</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: TOK.muted }}>2026 · Bính Ngọ</div>
              </div>
            </div>
            <div style={{ padding: '14px 18px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'var(--mono)', fontSize: 9 }}>
              {[['Trực', 'Định'], ['Sao', 'Thiên Đức'], ['Giờ', '7–9h Thìn'], ['Ngày', 'Nhâm Thân']].map(([k, v]) => (
                <div key={k} style={{ borderTop: `1px solid ${TOK.border}`, paddingTop: 4 }}>
                  <div style={{ color: TOK.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, color: TOK.ink, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Inline CTAs */}
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button style={{ width: '100%', padding: '16px', background: TOK.forest, color: TOK.cream, border: 'none', borderRadius: 8, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 10px 20px rgba(29,49,41,0.2)' }}>Mở quẻ ngay →</button>
          <button style={{ width: '100%', padding: '14px', background: 'transparent', color: TOK.ink, border: `1px solid ${TOK.borderStrong}`, borderRadius: 8, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Xem ví dụ ▷</button>
        </div>
        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 14, fontFamily: 'var(--mono)', fontSize: 10, color: TOK.muted }}>
          <span>✓ Không cần thẻ</span><span>✓ 20 lượng tặng</span><span>✓ Cài 1 chạm</span>
        </div>
      </section>

      {/* Compare — segmented tabs (3-up collapsed) */}
      <section style={{ padding: '32px 22px', background: TOK.paperWarm, borderTop: `1px solid ${TOK.border}` }}>
        <Mono style={{ color: TOK.goldDeep }}>Vì sao app này tồn tại</Mono>
        <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 30, lineHeight: 1.05, marginTop: 8, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
          3 cách<br />bạn đang chọn ngày
        </h2>
        <div style={{ marginTop: 20, display: 'flex', gap: 4, padding: 4, background: 'rgba(154,124,34,0.08)', borderRadius: 999 }}>
          {['Lịch in', 'Thầy bốc', 'NLTT'].map((l, i) => (
            <button key={l} onClick={() => setTab(i)} style={{ flex: 1, padding: '10px 0', background: tab === i ? (i === 2 ? TOK.forest : '#fff') : 'transparent', color: tab === i ? (i === 2 ? TOK.cream : TOK.ink) : TOK.muted, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 999 }}>{l}</button>
          ))}
        </div>
        {/* Card */}
        {(() => {
          const data = [
            { tag: 'Lịch in 35.000₫', title: 'Một bản — cho cả 100 triệu người', body: 'Lịch không biết tứ trụ của bạn. Bạn đoán.', list: ['× Không cá nhân hóa', '× Phải tự đối chiếu', '× Sai do đọc nhầm trực'] },
            { tag: 'Thầy bốc 200–500k', title: 'Cá nhân — nhưng đắt và chậm', body: 'Đặt lịch, đợi 3 ngày, ngồi nghe 2 tiếng.', list: ['× Khó hẹn lịch', '× Mỗi thầy một kiểu', '× Trả tiền theo việc'] },
            { tag: 'Ngày Lành Tháng Tốt', title: 'Lá số bạn × 24h × mọi việc', body: '6 giây ra 5 ngày kèm điểm và lý do.', list: ['✓ Cá nhân theo tứ trụ', '✓ 6 giây / 1 việc', '✓ Lưu phiếu chia sẻ'], featured: true },
          ][tab];
          return (
            <div style={{ marginTop: 16, padding: '20px 18px', background: data.featured ? TOK.forest : '#fff', color: data.featured ? TOK.cream : TOK.ink, borderRadius: 6, border: data.featured ? `1px solid ${TOK.gold}` : `1px solid ${TOK.border}` }}>
              <Mono style={{ color: data.featured ? TOK.gold : TOK.goldDeep }}>{data.tag}</Mono>
              <h3 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, lineHeight: 1.15, marginTop: 8, textTransform: 'uppercase' }}>{data.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.55, marginTop: 8, color: data.featured ? 'rgba(237,231,211,0.78)' : TOK.ink2 }}>{data.body}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
                {data.list.map((x, i) => (
                  <li key={i} style={{ padding: '6px 0', fontSize: 12, fontFamily: 'var(--mono)', color: data.featured ? 'rgba(237,231,211,0.85)' : TOK.ink2, borderBottom: i < data.list.length - 1 ? `1px dashed ${data.featured ? 'rgba(197,165,90,0.2)' : TOK.border}` : 'none' }}>{x}</li>
                ))}
              </ul>
            </div>
          );
        })()}
      </section>

      {/* How it works — vertical 3 steps */}
      <section style={{ padding: '40px 22px', background: TOK.forest, color: TOK.cream }}>
        <Mono style={{ color: TOK.gold }}>Cách dùng · 30 giây</Mono>
        {[['命','Dựng lá số','Ngày, tháng, năm, giờ sinh.'],['事','Chọn việc','26 kiểu việc, mỗi kiểu quy tắc riêng.'],['吉','Nhận phiếu','Top 1 + lý do + giờ đẹp.']].map(([n, t, d], i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '20px 0', borderBottom: i < 2 ? '1px dashed rgba(197,165,90,0.2)' : 'none' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: TOK.forestDeep, border: `1.5px solid ${TOK.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--hanzi)', fontWeight: 700, fontSize: 30, color: TOK.gold }}>{n}</span>
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase' }}>{t}</h3>
              <p style={{ fontSize: 13, color: 'rgba(237,231,211,0.7)', marginTop: 4, lineHeight: 1.55 }}>{d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Method — collapsed breakdown */}
      <section style={{ padding: '32px 22px', background: TOK.paper }}>
        <Mono style={{ color: TOK.goldDeep }}>Cách tính · đối chiếu được</Mono>
        <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 28, lineHeight: 1.05, marginTop: 8, textTransform: 'uppercase' }}>
          Mỗi điểm số<br />trỏ về <span style={{ color: TOK.goldDeep, fontStyle: 'italic' }}>sách cũ</span>.
        </h2>
        <div style={{ marginTop: 18, padding: '18px 16px', background: TOK.paperWarm, borderRadius: 4, border: `1px solid ${TOK.border}` }}>
          <Mono style={{ color: TOK.goldDeep, fontSize: 10 }}>Bóc tách 92/100</Mono>
          {[['Trực Định', 'Hiệp Kỷ Biện Phương', '+24'],['Sao Thiên Đức', 'Ngọc Hạp Thông Thư', '+20'],['Can chi tương sinh', 'Bính Tuất → Nhâm Thân', '+28'],['Giờ Thìn 7–9h', 'Tứ trụ Mộc vượng', '+20']].map(([l, s, sc], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 3 ? `1px dashed ${TOK.border}` : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: TOK.muted, marginTop: 1 }}>{s}</div>
              </div>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, color: TOK.goldDeep }}>{sc}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `2px solid ${TOK.ink}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>Tổng</span>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 28, color: TOK.goldDeep }}>92<span style={{ fontSize: 11, color: TOK.muted }}>/100</span></span>
          </div>
        </div>
      </section>

      {/* Pricing — vertical stack */}
      <section style={{ padding: '32px 22px', background: TOK.paperWarm, borderTop: `1px solid ${TOK.border}` }}>
        <Mono style={{ color: TOK.goldDeep }}>Bảng giá</Mono>
        <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 28, lineHeight: 1.05, marginTop: 8, textTransform: 'uppercase' }}>
          Trả theo lượng —<br /><span style={{ color: TOK.goldDeep }}>không ép buộc</span>
        </h2>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[{n:'Lẻ',l:30,p:'49.000₫',s:'một lần',b:null},{n:'Tháng An Cư',l:100,p:'89.000₫',s:'/ tháng',b:'PHỔ BIẾN'},{n:'Năm Phú Quý',l:1500,p:'749.000₫',s:'/ năm',b:null}].map((p, i) => (
            <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: p.b ? TOK.forest : '#fff', color: p.b ? TOK.cream : TOK.ink, border: p.b ? `1px solid ${TOK.gold}` : `1px solid ${TOK.border}`, borderRadius: 6 }}>
              {p.b && <span style={{ position: 'absolute', top: -8, left: 14, padding: '2px 8px', background: TOK.gold, color: TOK.forest, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 8, letterSpacing: '0.18em', borderRadius: 3 }}>{p.b}</span>}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>{p.n}</div>
                <Mono style={{ color: p.b ? 'rgba(197,165,90,0.7)' : TOK.muted, fontSize: 9, marginTop: 2 }}>{p.l} lượng</Mono>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, lineHeight: 1, color: p.b ? TOK.gold : TOK.goldDeep }}>{p.p}</span>
                  <Mono style={{ color: p.b ? 'rgba(197,165,90,0.7)' : TOK.muted, fontSize: 9 }}>{p.s}</Mono>
                </div>
              </div>
              <span style={{ fontSize: 18, color: p.b ? TOK.gold : TOK.goldDeep }}>→</span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials — single carousel */}
      <section style={{ padding: '32px 22px', background: TOK.forest, color: TOK.cream }}>
        <Mono style={{ color: TOK.gold }}>Khách nói gì</Mono>
        <div style={{ marginTop: 16, padding: '20px 18px', background: TOK.forestDeep, borderRadius: 4, border: `1px solid rgba(197,165,90,0.18)`, position: 'relative' }}>
          <span style={{ position: 'absolute', top: 6, right: 12, fontFamily: 'var(--hanzi)', fontWeight: 700, fontSize: 44, color: 'rgba(197,165,90,0.1)' }}>“</span>
          <Mono style={{ color: TOK.gold }}>Khai trương cửa hàng</Mono>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10, color: 'rgba(237,231,211,0.88)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
            "Tiệm tôi khai trương 17/06 đúng theo phiếu, ngày đó gấp đôi lượt khách so với hôm thử bán."
          </p>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed rgba(197,165,90,0.2)', fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(237,231,211,0.6)' }}>Chị Hằng · Đà Nẵng</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {[0,1,2].map(i => <span key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 999, background: i === 0 ? TOK.gold : 'rgba(197,165,90,0.3)' }} />)}
        </div>
      </section>

      {/* FAQ — accordion */}
      <section style={{ padding: '32px 22px', background: TOK.paper }}>
        <Mono style={{ color: TOK.goldDeep }}>Hỏi đáp</Mono>
        <div style={{ marginTop: 16 }}>
          {[['Một lần mở quẻ mất bao lâu?', 'Khoảng 30 giây. Nhập ngày giờ sinh một lần duy nhất — các lần sau mở là ra phiếu.'],['App dựa trên nguồn nào?', 'Hiệp Kỷ Biện Phương, Ngọc Hạp Thông Thư, Tứ Trụ Vàng. Mỗi điểm số đều trích được nguồn.'],['Mua lượng hay đăng ký tháng?', 'Mua lượng cho 6–8 việc rời. Tháng An Cư cho người dùng hàng tuần — rẻ hơn 40%.'],['Cài lên điện thoại được không?', 'PWA — cài 1 chạm trên iPhone/Android. Chạy offline các phiếu đã tải.']].map(([q, a], i) => (
            <div key={i} onClick={() => setFaq(faq === i ? -1 : i)} style={{ borderTop: `1px solid ${TOK.border}`, padding: '14px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: TOK.muted, letterSpacing: '0.12em' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}>{q}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: TOK.goldDeep, transform: faq === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>+</span>
              </div>
              {faq === i && <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 8, color: TOK.ink2, paddingLeft: 26 }}>{a}</p>}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${TOK.border}` }} />
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '48px 22px', background: TOK.forest, color: TOK.cream, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Kanji ch="日" size={280} drift style={{ position: 'absolute', left: -60, top: '50%', transform: 'translateY(-50%)', color: 'rgba(197,165,90,0.06)', WebkitTextStroke: '1px rgba(197,165,90,0.06)' }} />
        <div style={{ position: 'relative' }}>
          <Mono style={{ color: TOK.gold }}>Bắt đầu</Mono>
          <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 38, lineHeight: 0.98, marginTop: 12, textTransform: 'uppercase' }}>
            Phiếu đầu<br /><span style={{ color: TOK.gold }}>miễn phí.</span>
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(237,231,211,0.72)', marginTop: 10 }}>20 lượng tặng · không cần thẻ</p>
          <button style={{ marginTop: 20, width: '100%', padding: '16px', background: TOK.gold, color: TOK.forest, border: 'none', borderRadius: 8, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mở quẻ ngay →</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: TOK.forestDeep, color: 'rgba(237,231,211,0.6)', padding: '32px 22px 100px' }}>
        <Logo dark size={28} showUrl />
        <p style={{ marginTop: 14, fontSize: 12, lineHeight: 1.6 }}>Lịch vạn niên cá nhân theo Bát Tự. Trả 1 lần, không tự gia hạn.</p>
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(197,165,90,0.12)', fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(237,231,211,0.5)', letterSpacing: '0.06em' }}>© 2026 NLTT · ngaylanhthangtot.vn</div>
      </footer>

      {/* Sticky CTA bar — bottom */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(240,236,226,0.96)', backdropFilter: 'blur(16px)', borderTop: `1px solid ${TOK.borderStrong}`, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: TOK.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>20 lượng tặng</div>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>Mở quẻ miễn phí</div>
        </div>
        <button style={{ padding: '12px 20px', background: TOK.forest, color: TOK.cream, border: 'none', borderRadius: 8, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bắt đầu →</button>
      </div>
    </div>
  );
}

Object.assign(window, { LandingV2, LandingV2Mobile });
