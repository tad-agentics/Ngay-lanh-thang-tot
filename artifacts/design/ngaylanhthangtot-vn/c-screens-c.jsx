/* Direction C — screens part C. Auth, First-run, Deep, Commerce, Share, Empty.
   Depends on c-screens-a.jsx globals. */
/* global React, useB, Logo, LogoMark, Mono, StatusBar, HomeIndicator,
   CT, PROFILE, CTopStrip, CSegmented, CBottomNav, IconSearch */
const { useState: c3UseState } = React;

// Small helper — back chevron header
function CBackBar({ title, dark = false, right }) {
  const fg = dark ? CT.cream : CT.ink;
  const muteFg = dark ? 'rgba(200,188,152,0.6)' : CT.muted;
  const accent = dark ? CT.gold : CT.goldDeep;
  return (
    <div style={{ padding: '8px 22px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ color: accent, fontFamily: 'var(--serif)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>‹</span>
      <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 13, color: title ? fg : muteFg }}>{title}</div>
      {right}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUTH · 01 · Login / Signup chooser
// ═══════════════════════════════════════════════════════════════════
function CAuthChooser() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar dark />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, background: 'radial-gradient(ellipse at 50% 0%, rgba(197,165,90,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ flex: 1, padding: '60px 28px 28px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Logo dark size={36} />

        <div style={{ marginTop: 56 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 44, color: CT.cream, lineHeight: 0.96, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
            Lập lịch riêng<br /><span style={{ color: CT.gold, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>cho mệnh của bạn.</span>
          </h1>
          <p style={{ marginTop: 16, fontFamily: 'var(--serif)', fontSize: 14, color: 'rgba(237,231,211,0.7)', lineHeight: 1.55, maxWidth: 280 }}>
            Mỗi ngày một trang — chấm điểm theo lá số tứ trụ riêng. Dùng được trên mọi thiết bị.
          </p>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button style={{ width: '100%', padding: 14, background: CT.gold, color: CT.forest, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Lập lịch — 30 giây
          </button>
          <button style={{ width: '100%', padding: 13, background: 'transparent', color: CT.cream, border: '1px solid rgba(237,231,211,0.25)', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Tiếp tục với Google
          </button>
          <div style={{ marginTop: 14, padding: '12px 0', borderTop: '1px solid rgba(237,231,211,0.15)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'rgba(237,231,211,0.7)' }}>Đã có lịch?</span>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: CT.gold, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}>Mở lịch →</span>
          </div>
        </div>

        <div style={{ marginTop: 18, fontFamily: 'var(--serif)', fontSize: 11, color: 'rgba(237,231,211,0.4)', textAlign: 'center', lineHeight: 1.5 }}>
          Tiếp tục đồng nghĩa với việc bạn chấp nhận<br /><span style={{ color: 'rgba(237,231,211,0.6)', cursor: 'pointer' }}>Điều khoản</span> &nbsp;·&nbsp; <span style={{ color: 'rgba(237,231,211,0.6)', cursor: 'pointer' }}>Bảo mật</span>
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUTH · 02 · Signup — name + email + birth (one flow)
// ═══════════════════════════════════════════════════════════════════
function CSignup() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar dark />
      <CBackBar dark right={<Mono style={{ color: 'rgba(200,188,152,0.5)', fontSize: 9 }}>1 / 2</Mono>} />

      <div style={{ flex: 1, padding: '12px 28px 24px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Mono style={{ color: CT.gold, fontSize: 10, letterSpacing: '0.22em' }}>Lập lịch · bước 1</Mono>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: CT.cream, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.015em', margin: '12px 0 6px' }}>
          Bạn là ai?
        </h1>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 13.5, color: 'rgba(237,231,211,0.65)', lineHeight: 1.55, maxWidth: 280 }}>
          Lá số tứ trụ cần đúng ngày, tháng, năm và giờ sinh. Sai một giờ — sai cả luận đoán.
        </p>

        {/* Inputs — underline style for cleaner forest layout */}
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Name */}
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: 'rgba(237,231,211,0.55)' }}>Họ và tên</div>
            <input type="text" defaultValue="Nguyễn Thị Minh" style={{ width: '100%', marginTop: 4, padding: '6px 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${CT.gold}`, outline: 'none', color: CT.cream, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em' }} />
          </div>
          {/* Email */}
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: 'rgba(237,231,211,0.55)' }}>Email</div>
            <input type="text" defaultValue="minh.nguyen@gmail.com" style={{ width: '100%', marginTop: 4, padding: '6px 0', background: 'transparent', border: 'none', borderBottom: `1px solid rgba(237,231,211,0.3)`, outline: 'none', color: CT.cream, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em' }} />
          </div>
          {/* Birth date */}
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: 'rgba(237,231,211,0.55)' }}>Ngày sinh dương lịch</div>
            <div style={{ marginTop: 4, padding: '6px 0', borderBottom: `1px solid rgba(237,231,211,0.3)`, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: CT.cream, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em' }}>20 · 05 · 1990</span>
              <span style={{ marginLeft: 'auto', color: 'rgba(237,231,211,0.5)', fontFamily: 'var(--serif)', fontSize: 12 }}>hoặc <span style={{ color: CT.gold, cursor: 'pointer' }}>chọn âm lịch</span></span>
            </div>
          </div>
          {/* Password */}
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: 'rgba(237,231,211,0.55)' }}>Mật khẩu</div>
            <input type="password" defaultValue="••••••••••" style={{ width: '100%', marginTop: 4, padding: '6px 0', background: 'transparent', border: 'none', borderBottom: `1px solid rgba(237,231,211,0.3)`, outline: 'none', color: CT.cream, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em' }} />
            <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 11, color: 'rgba(237,231,211,0.45)' }}>Tối thiểu 8 ký tự · hoặc dùng Google ở màn trước</div>
          </div>
        </div>

        <button style={{ marginTop: 'auto', width: '100%', padding: 15, background: CT.gold, color: CT.forest, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Tiếp — chọn giờ sinh
        </button>
        <div style={{ marginTop: 12, textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 11, color: 'rgba(237,231,211,0.45)' }}>
          Mã hoá AES-256 · không bán dữ liệu
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FIRST RUN · 01 · Birth-time picker (12 canh giờ)
// ═══════════════════════════════════════════════════════════════════
function CBirthTime() {
  const hours = [
    ['Tý', '23–1h'], ['Sửu', '1–3h'], ['Dần', '3–5h'], ['Mão', '5–7h'],
    ['Thìn', '7–9h'], ['Tỵ', '9–11h'], ['Ngọ', '11–13h'], ['Mùi', '13–15h'],
    ['Thân', '15–17h'], ['Dậu', '17–19h'], ['Tuất', '19–21h'], ['Hợi', '21–23h'],
  ];
  const sel = 3; // Mão
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar dark />
      <CBackBar dark right={<Mono style={{ color: 'rgba(200,188,152,0.5)', fontSize: 9 }}>2 / 2</Mono>} />

      <div style={{ flex: 1, padding: '12px 28px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Mono style={{ color: CT.gold, fontSize: 10, letterSpacing: '0.22em' }}>Lập lịch · bước 2</Mono>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: CT.cream, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.015em', margin: '12px 0 6px' }}>
          Sinh canh nào?
        </h1>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 13.5, color: 'rgba(237,231,211,0.65)', lineHeight: 1.55, maxWidth: 280 }}>
          12 canh giờ — không nhớ chính xác cũng được, chọn khoảng rồi tinh chỉnh sau.
        </p>

        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {hours.map(([n, h], i) => {
            const isSel = i === sel;
            return (
              <div key={n} style={{ padding: '11px 4px', textAlign: 'center', background: isSel ? CT.gold : 'transparent', border: `1px solid ${isSel ? CT.gold : 'rgba(197,165,90,0.28)'}`, cursor: 'pointer' }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, color: isSel ? CT.forest : CT.cream, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{n}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 10, color: isSel ? CT.forest : 'rgba(237,231,211,0.55)', marginTop: 2 }}>{h}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, padding: '12px 14px', borderLeft: `2px solid ${CT.gold}`, background: 'rgba(197,165,90,0.06)' }}>
          <Mono style={{ color: CT.gold, fontSize: 9 }}>Đã chọn · Mão</Mono>
          <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 13, color: CT.cream, lineHeight: 1.5 }}>
            5–7h sáng · trụ giờ <strong style={{ color: CT.gold, fontWeight: 700 }}>Ất Mão</strong> · hành Mộc
          </div>
        </div>

        <button style={{ marginTop: 'auto', width: '100%', padding: 15, background: CT.gold, color: CT.forest, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Mở lịch của tôi →
        </button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FIRST RUN · 02 · Loading / "Đang dựng lịch của bạn"
// ═══════════════════════════════════════════════════════════════════
function CBuildingCalendar() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <StatusBar dark />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, background: 'radial-gradient(ellipse at 50% 0%, rgba(197,165,90,0.16) 0%, transparent 70%)' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, position: 'relative', padding: '0 28px', textAlign: 'center' }}>
        <Mono style={{ color: CT.gold, fontSize: 10, letterSpacing: '0.24em' }}>Đang dựng lịch của bạn</Mono>

        {/* 4 pillars being filled */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['Niên', 'Nguyệt', 'Nhật', 'Thời'].map((p, i) => {
            const done = i < 3;
            return (
              <div key={p} style={{ width: 56, padding: '12px 0', textAlign: 'center', background: done ? 'rgba(197,165,90,0.1)' : 'transparent', border: `1px solid ${done ? CT.gold : 'rgba(237,231,211,0.18)'}` }}>
                <Mono style={{ color: done ? CT.gold : 'rgba(237,231,211,0.4)', fontSize: 9 }}>{p}</Mono>
                <div style={{ marginTop: 6, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: done ? CT.cream : 'rgba(237,231,211,0.3)', textTransform: 'uppercase', letterSpacing: '-0.005em', lineHeight: 1 }}>
                  {done ? ['Canh Ngọ', 'Quý Mùi', 'Quý Tỵ'][i] : '···'}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ width: 200, height: 1.5, background: 'rgba(197,165,90,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '76%', background: CT.gold }} />
        </div>

        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'rgba(237,231,211,0.6)', lineHeight: 1.55, maxWidth: 280, margin: 0 }}>
          "Trường Lưu Thủy — nước sông dài, hợp người làm việc bền"
        </p>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FIRST RUN · 03 · Reveal — "Lịch của bạn đã mở"
// ═══════════════════════════════════════════════════════════════════
function CReveal() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar dark />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, background: 'radial-gradient(ellipse at 50% 0%, rgba(197,165,90,0.18) 0%, transparent 70%)' }} />

      <div style={{ flex: 1, padding: '32px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <Mono style={{ color: CT.gold, fontSize: 10, letterSpacing: '0.22em', alignSelf: 'flex-start' }}>Lịch đã mở</Mono>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 38, color: CT.cream, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '10px 0 4px', alignSelf: 'flex-start' }}>
          Đây là trang<br /><span style={{ color: CT.gold, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>đầu tiên của bạn.</span>
        </h1>

        {/* Mini lịch tờ */}
        <div style={{ marginTop: 28, width: 240, background: CT.paperWarm, color: CT.ink, transform: 'rotate(-2deg)', boxShadow: '0 18px 36px rgba(0,0,0,0.32)' }}>
          <div style={{ padding: '10px 16px 4px', fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted }}>Tháng 5 · 2026 · Bính Ngọ</div>
          <div style={{ padding: '4px 16px 10px', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 84, color: CT.red, lineHeight: 0.85, letterSpacing: '-0.045em' }}>26</div>
            <div style={{ paddingBottom: 8, fontFamily: 'var(--display)', fontWeight: 900, fontSize: 22, color: CT.red, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Thứ Ba</div>
          </div>
          <div style={{ padding: '0 16px 10px', fontFamily: 'var(--serif)', fontSize: 11, color: CT.ink2 }}>
            Mùng 10 tháng Tư · ngày <strong>Mậu Tuất</strong>
          </div>
          <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${CT.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <Mono style={{ color: CT.goldDeep, fontSize: 8 }}>Cho mệnh {PROFILE.menh}</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: CT.goldDeep, textTransform: 'uppercase' }}>Ngày khá</div>
            </div>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 26, color: CT.goldDeep, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em' }}>76</span>
          </div>
        </div>

        <p style={{ marginTop: 32, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'rgba(237,231,211,0.65)', lineHeight: 1.5, textAlign: 'center', maxWidth: 280 }}>
          Mỗi ngày một trang — đã chấm theo mệnh <strong style={{ color: CT.gold, fontWeight: 600 }}>Quý Thủy</strong> của bạn.
        </p>

        <button style={{ marginTop: 'auto', width: '100%', padding: 15, background: CT.gold, color: CT.forest, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Vào lịch hôm nay →
        </button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DEEP · Day detail (non-today) — same lịch tờ but with back chevron + paper bg
// ═══════════════════════════════════════════════════════════════════
function CDayDetail() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Lịch tháng 6" />

      <div style={{ flex: 1, padding: '4px 22px 24px', overflow: 'auto' }}>
        {/* Lịch tờ inset on paper */}
        <div style={{ background: '#fff', color: CT.ink, position: 'relative', boxShadow: '0 6px 16px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)', border: `1px solid ${CT.hairline2}` }}>
          <div style={{ padding: '12px 18px 6px' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>Tháng 6 · 2026 &nbsp;·&nbsp; Bính Ngọ</span>
          </div>
          <div style={{ padding: '4px 18px 12px', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 124, color: CT.red, lineHeight: 0.84, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums' }}>17</div>
            <div style={{ paddingBottom: 14 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30, color: CT.red, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 0.95 }}>Thứ Tư</div>
            </div>
          </div>
          <div style={{ padding: '0 18px 16px', fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink2, lineHeight: 1.55 }}>
            Mùng 2 tháng Năm &nbsp;·&nbsp; ngày <strong style={{ color: CT.ink, fontWeight: 600 }}>Canh Thìn</strong> &nbsp;·&nbsp; tiết Mang Chủng
          </div>

          <div style={{ padding: '14px 18px 4px', borderTop: `1px solid ${CT.hairline}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 17, color: CT.goldDeep, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Ngày tốt</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted, marginTop: 2 }}>cho mệnh {PROFILE.menh}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 38, color: CT.goldDeep, lineHeight: 1, letterSpacing: '-0.015em' }}>85</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>/100</span>
            </div>
          </div>

          <div style={{ padding: '10px 18px 14px' }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.55, color: CT.ink2, margin: 0 }}>
              "Kim sinh Thủy — Canh Thìn hợp với Quý Thủy của bạn. Đặc biệt thuận cho ký kết, khai trương, mở việc lớn."
            </p>
          </div>

          <div style={{ padding: '12px 18px 14px', borderTop: `1px solid ${CT.hairline}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Nên', 'Khai trương, ký hợp đồng, xuất hành xa, an táng', CT.forest],
              ['Tránh', 'Cưới hỏi, động thổ', CT.red],
              ['Giờ tốt', 'Tỵ 9–11h, Thân 15–17h', CT.goldDeep],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <Mono style={{ color: c, fontSize: 9, width: 48, letterSpacing: '0.14em' }}>{k}</Mono>
                <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink, lineHeight: 1.45 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 18px', borderTop: `1px solid ${CT.hairline}`, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, cursor: 'pointer' }}>‹ 16.06 hôm trước</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, cursor: 'pointer' }}>18.06 hôm sau ›</span>
          </div>
        </div>

        {/* Action — đặt nhắc */}
        <div style={{ marginTop: 16 }}>
          <button style={{ width: '100%', padding: '12px', background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CT.gold} strokeWidth="1.6"><path d="M22 36 V28 C22 22, 26 18, 32 18 C38 18, 42 22, 42 28 V36 L44 40 H20 Z M28 42 C28 44, 30 46, 32 46 C34 46, 36 44, 36 42" transform="translate(-20 -16) scale(0.7)" /></svg>
            Đánh dấu để nhắc trước 1 ngày
          </button>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DEEP · Sổ trống — empty state of Sổ ngày đã chọn
// ═══════════════════════════════════════════════════════════════════
function CEmptySo() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Sổ ngày đã chọn" />

      <div style={{ flex: 1, padding: '32px 32px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {/* Quiet symbolic mark — paper page with corner fold */}
        <svg width="68" height="84" viewBox="0 0 68 84" fill="none">
          <path d="M2 2 H50 L66 18 V82 H2 Z" stroke={CT.goldDeep} strokeWidth="1.4" fill="rgba(154,124,34,0.04)" />
          <path d="M50 2 V18 H66" stroke={CT.goldDeep} strokeWidth="1.4" fill="none" />
          <line x1="12" y1="34" x2="56" y2="34" stroke={CT.hairline} strokeWidth="1" />
          <line x1="12" y1="44" x2="56" y2="44" stroke={CT.hairline} strokeWidth="1" />
          <line x1="12" y1="54" x2="42" y2="54" stroke={CT.hairline} strokeWidth="1" />
        </svg>

        <h2 style={{ marginTop: 24, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
          Sổ còn trống
        </h2>
        <p style={{ marginTop: 10, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: CT.muted, lineHeight: 1.55, maxWidth: 260 }}>
          Khi bạn tra cứu được ngày tốt và lưu lại — ngày đó sẽ xuất hiện ở đây để theo dõi.
        </p>

        <button style={{ marginTop: 28, padding: '12px 22px', background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Tra cứu ngày tốt →
        </button>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMMERCE · Pay confirm (bottom sheet style, but full-screen for canvas)
// ═══════════════════════════════════════════════════════════════════
function CPayConfirm() {
  return (
    <div style={{ width: 390, height: 800, background: 'rgba(24,21,14,0.45)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <StatusBar />
      {/* the sheet */}
      <div style={{ background: CT.paper, padding: '14px 24px 32px', borderTopLeftRadius: 16, borderTopRightRadius: 16, position: 'relative' }}>
        {/* handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 36, height: 4, background: 'rgba(24,21,14,0.18)', borderRadius: 2 }} />
        </div>

        <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>Đặt lịch</div>
        <h2 style={{ marginTop: 4, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.015em' }}>Lịch Đinh Mùi 2027</h2>
        <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>1 năm trọn · tiết kiệm 25%</div>

        {/* Summary row */}
        <div style={{ marginTop: 20, padding: '14px 0', borderTop: `1px solid ${CT.hairline}`, borderBottom: `1px solid ${CT.hairline}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink }}>1 năm trọn</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginTop: 3 }}>Dùng đến 27.05.2027</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, textDecoration: 'line-through', textDecorationThickness: 1 }}>588.000đ</div>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: CT.goldDeep, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em' }}>449.000đ</div>
          </div>
        </div>

        {/* Payment methods */}
        <div style={{ marginTop: 18, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted }}>Thanh toán qua</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          {[
            { name: 'ZaloPay', sel: true },
            { name: 'MoMo', sel: false },
            { name: 'Thẻ', sel: false },
          ].map(p => (
            <div key={p.name} style={{ flex: 1, padding: '12px 4px', textAlign: 'center', background: p.sel ? '#fff' : 'transparent', border: `1px solid ${p.sel ? CT.goldDeep : CT.hairline}`, cursor: 'pointer' }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: p.sel ? CT.ink : CT.muted, letterSpacing: '-0.005em' }}>{p.name}</div>
            </div>
          ))}
        </div>

        <button style={{ marginTop: 24, width: '100%', padding: 15, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Thanh toán 449.000đ
        </button>
        <div style={{ marginTop: 10, textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted, lineHeight: 1.6 }}>
          Hoàn tiền 7 ngày · không tự gia hạn
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMMERCE · Pay success
// ═══════════════════════════════════════════════════════════════════
function CPaySuccess() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ flex: 1, padding: '40px 32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {/* Stamp-like checkmark — circle with check */}
        <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
          <circle cx="44" cy="44" r="42" stroke={CT.goldDeep} strokeWidth="1.5" fill="rgba(154,124,34,0.06)" />
          <circle cx="44" cy="44" r="36" stroke={CT.goldDeep} strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M28 46 L40 58 L60 32" stroke={CT.goldDeep} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: '0.22em', marginTop: 26 }}>Lịch đã mở</Mono>
        <h2 style={{ marginTop: 10, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.015em', maxWidth: 300 }}>
          Lịch của bạn<br /><span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>đến 27.05.2027</span>
        </h2>
        <p style={{ marginTop: 14, fontFamily: 'var(--serif)', fontSize: 14, color: CT.ink2, lineHeight: 1.55, maxWidth: 280 }}>
          Hoá đơn đã gửi vào <strong style={{ color: CT.ink }}>minh.nguyen@gmail.com</strong>. Cảm ơn bạn — chúc một năm an lành.
        </p>

        <div style={{ marginTop: 28, padding: '14px 18px', background: '#fff', border: `1px solid ${CT.hairline}`, width: '100%', maxWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2 }}>
            <span>Lịch Đinh Mùi 2027</span><span>1 năm</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2, marginTop: 6 }}>
            <span>Mã giao dịch</span><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.muted, letterSpacing: '0.04em' }}>NLTT-2026-0817-2A</span>
          </div>
        </div>

        {/* Gift / unlock callout — Bazi reading entry */}
        <div style={{ marginTop: 14, padding: '14px 16px', background: 'rgba(154,124,34,0.08)', borderLeft: `3px solid ${CT.goldDeep}`, width: '100%', maxWidth: 320, textAlign: 'left' }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>★ Tặng kèm · gói năm</Mono>
          <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 15, color: CT.ink, letterSpacing: '-0.005em', textTransform: 'uppercase' }}>
            Luận giải Bát tự năm
          </div>
          <p style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 12, color: CT.ink2, lineHeight: 1.5 }}>
            Tính cách, vận năm Bính Ngọ, phong thuỷ, quý nhân — đã mở cho bạn.
          </p>
          <button style={{ marginTop: 10, padding: '8px 14px', background: CT.goldDeep, color: CT.paper, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Đọc ngay →
          </button>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, width: '100%', maxWidth: 320 }}>
          <button style={{ flex: 1, padding: 11, background: 'transparent', color: CT.ink, border: `1px solid ${CT.goldDeep}`, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Xem hoá đơn</button>
          <button style={{ flex: 1, padding: 11, background: 'transparent', color: CT.ink, border: `1px solid ${CT.goldDeep}`, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Hoá đơn VAT</button>
        </div>

        <button style={{ marginTop: 16, width: '100%', maxWidth: 320, padding: 14, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Vào lịch hôm nay →
        </button>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHARE · Public phiếu landing — recipient view (no auth)
// ═══════════════════════════════════════════════════════════════════
function CSharePublic() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      {/* public header — no nav */}
      <div style={{ padding: '14px 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${CT.hairline2}` }}>
        <Logo size={26} />
        <span style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>Phiếu gửi từ <strong style={{ color: CT.ink, fontWeight: 600 }}>Minh</strong></span>
      </div>

      <div style={{ flex: 1, padding: '22px 22px 24px', overflow: 'auto' }}>
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: CT.ink2, lineHeight: 1.55, margin: 0 }}>
          "Em gửi anh chị xem ngày khai trương — chị Hằng chọn ngày 06.06 tốt nhất."
        </p>

        {/* The phiếu */}
        <div style={{ marginTop: 18, background: '#fff', border: `1px solid ${CT.hairline}`, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '12px 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Phiếu chọn ngày</Mono>
            <Mono style={{ color: CT.muted, fontSize: 9 }}>NLTT · 2026 · 0042</Mono>
          </div>
          <div style={{ padding: '4px 18px 6px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 17, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
            Khai trương cửa hàng
          </div>
          <div style={{ padding: '0 18px 8px', fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>
            Cho mệnh Quý Thủy · Nguyễn Thị Minh
          </div>

          <div style={{ padding: '8px 18px 12px', display: 'flex', alignItems: 'flex-end', gap: 14, borderTop: `1px solid ${CT.hairline2}` }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 100, color: CT.red, lineHeight: 0.85, letterSpacing: '-0.045em' }}>06</div>
            <div style={{ paddingBottom: 12 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 22, color: CT.red, textTransform: 'uppercase', lineHeight: 1 }}>Thứ Bảy</div>
              <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>Tháng 6 · 2026</div>
            </div>
          </div>
          <div style={{ padding: '0 18px 12px', fontFamily: 'var(--serif)', fontSize: 12, color: CT.ink2 }}>
            Mùng 21 tháng Tư &nbsp;·&nbsp; ngày <strong style={{ color: CT.ink, fontWeight: 600 }}>Kỷ Tỵ</strong> &nbsp;·&nbsp; tiết Tiểu Mãn
          </div>

          <div style={{ padding: '12px 18px', borderTop: `1px solid ${CT.hairline}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 15, color: CT.goldDeep, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Ngày tốt</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginTop: 2 }}>theo lá số của Minh</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 34, color: CT.goldDeep, lineHeight: 1, letterSpacing: '-0.015em' }}>92</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted }}>/100</span>
            </div>
          </div>

          <div style={{ padding: '10px 18px 14px' }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, lineHeight: 1.5, color: CT.ink2, margin: 0 }}>
              "Hỏa khí thịnh, hợp khai trương thương hiệu mới. Giờ tốt: Tỵ 9–11h."
            </p>
          </div>
        </div>

        {/* Recipient CTA */}
        <div style={{ marginTop: 22, padding: '16px 18px', background: 'rgba(154,124,34,0.06)', borderLeft: `2px solid ${CT.goldDeep}` }}>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Lịch riêng cho bạn?</div>
          <p style={{ marginTop: 6, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2, lineHeight: 1.5 }}>
            Phiếu này được chấm theo lá số của Minh. Lập lịch riêng để xem ngày tốt cho mệnh của <strong style={{ color: CT.ink }}>bạn</strong>.
          </p>
          <button style={{ marginTop: 12, width: '100%', padding: 12, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Lập lịch của tôi →
          </button>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { CBackBar, CAuthChooser, CSignup, CBirthTime, CBuildingCalendar, CReveal, CDayDetail, CEmptySo, CPayConfirm, CPaySuccess, CSharePublic });
