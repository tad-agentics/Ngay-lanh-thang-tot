/* Row 2d · Flow-complete pass — auth stack, onboarding gate, single-day, week list, month, payment success.
   Brings Direction B to parity with the existing route map. */
/* global React, Phone, Ticket, Kanji, Mono, Stamp, Logo, useB */

const { useState: useStateFC, useEffect: useEffectFC } = React;

const FC_FOREST = { background: 'radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)', minHeight: '100%', padding: '0 20px 32px', position: 'relative', overflow: 'hidden' };
const FC_PAPER = { background: '#ede7d3', minHeight: '100%', padding: '0 20px 32px', position: 'relative', overflow: 'hidden', color: '#18150e' };

/** Motion keyframes for flow-complete only — do not depend on `ARStyles` from b-ai-reading.jsx. Namespaced `fc-*` to avoid colliding with AI reading artboards. */
function FCFlowMotionStyles() {
  return (
    <style>{`
      @keyframes fc-pulse-dot { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.4); opacity: 1; } }
      @keyframes fc-glyph-fade { 0% { opacity: 0; transform: scale(0.8) translateY(8px); } 30%, 70% { opacity: 0.95; transform: scale(1) translateY(0); } 100% { opacity: 0; transform: scale(1.05) translateY(-6px); } }
    `}</style>
  );
}

// ─── Reusable bits ───
function FCTopBar({ kicker, title, sub, dark = true }) {
  const b = useB();
  const c = dark ? '#c8bc98' : '#3a3220';
  return (
    <div style={{ padding: '6px 4px 16px' }}>
      {kicker && <Mono style={{ color: b.accent }}>{kicker}</Mono>}
      {title && <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 24, color: c, marginTop: 4, letterSpacing: '-0.01em' }}>{title}</div>}
      {sub && <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: dark ? 'rgba(200,188,152,0.7)' : '#7a7050', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
function FCButton({ children, primary, dark, style, full = true, onClick }) {
  const b = useB();
  const bg = primary ? b.accent : dark ? 'transparent' : 'transparent';
  const fg = primary ? '#18150e' : dark ? '#ede7d3' : '#18150e';
  const border = primary ? 'none' : dark ? '1px solid rgba(200,188,152,0.4)' : '1px solid rgba(24,21,14,0.4)';
  return <button onClick={onClick} style={{ width: full ? '100%' : 'auto', background: bg, color: fg, border, padding: '14px 20px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', ...style }}>{children}</button>;
}
function FCFormRow({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <Mono style={{ color: 'rgba(200,188,152,0.7)' }}>{label}</Mono>
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  );
}
function FCInput({ value, placeholder, type = 'text' }) {
  return <input readOnly defaultValue={value} placeholder={placeholder} type={type} style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,188,152,0.25)', color: '#ede7d3', fontFamily: 'var(--serif)', fontSize: 15, outline: 'none' }} />;
}

// ─── 30 · Login chooser ───
function FCLoginChooser() {
  const b = useB();
  return (
    <div style={FC_FOREST}>
      <div style={{ paddingTop: 60 }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Logo dark size={42} />
      </div>
      <FCTopBar title="Đăng nhập" sub="Tiếp tục lá số đã lập, hoặc tạo tài khoản mới." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <button style={{ width: '100%', background: '#fff', color: '#18150e', border: 'none', padding: '14px 18px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'system-ui', fontWeight: 700, fontSize: 16 }}>G</span>
          Tiếp tục với Google
        </button>
        <FCButton dark>Đăng nhập bằng email</FCButton>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 0 14px' }}>
        <span style={{ flex: 1, height: 1, background: 'rgba(200,188,152,0.18)' }} />
        <Mono style={{ color: 'rgba(200,188,152,0.5)' }}>Chưa có tài khoản?</Mono>
        <span style={{ flex: 1, height: 1, background: 'rgba(200,188,152,0.18)' }} />
      </div>

      <div style={{ background: 'rgba(197,165,90,0.08)', border: `1px solid ${b.accent}`, padding: '16px 16px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--hanzi)', fontSize: 28, color: b.accent, fontWeight: 700 }}>命</span>
        <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: '#ede7d3', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Lập lá số đầu tiên
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'rgba(200,188,152,0.8)', marginTop: 2 }}>
          Miễn phí · 30 giây · không cần thẻ
        </div>
        <FCButton primary style={{ marginTop: 10 }}>Tạo tài khoản</FCButton>
      </div>

      <div style={{ marginTop: 28, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: 'rgba(200,188,152,0.5)', textAlign: 'center', lineHeight: 1.6 }}>
        Tiếp tục đồng nghĩa với việc bạn đồng ý<br />
        <span style={{ borderBottom: '1px solid rgba(200,188,152,0.4)' }}>Điều khoản</span> và <span style={{ borderBottom: '1px solid rgba(200,188,152,0.4)' }}>Chính sách bảo mật</span>.
      </div>
    </div>
  );
}

// ─── 31 · Login email ───
function FCLoginEmail() {
  const b = useB();
  return (
    <div style={FC_FOREST}>
      <div style={{ paddingTop: 60 }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Logo dark size={36} />
      </div>
      <FCTopBar kicker="Đăng nhập" title="Email & mật khẩu" sub="Đã có tài khoản? Tiếp tục lá số." />

      <div style={{ marginTop: 12 }}>
        <FCFormRow label="Email">
          <FCInput value="thanhha@example.com" />
        </FCFormRow>
        <FCFormRow label="Mật khẩu">
          <FCInput value="••••••••••" type="password" />
        </FCFormRow>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: b.accent, borderBottom: `1px solid ${b.accent}` }}>Quên mật khẩu?</span>
        </div>

        <FCButton primary>Đăng nhập</FCButton>
        <FCButton dark style={{ marginTop: 8 }}>Quay lại — đăng nhập Google</FCButton>
      </div>

      <div style={{ marginTop: 28, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,188,152,0.18)', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'rgba(200,188,152,0.8)' }}>Chưa có tài khoản? </span>
        <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: b.accent, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${b.accent}` }}>Tạo mới</span>
      </div>
    </div>
  );
}

// ─── 32 · Signup with prefill + referral banners ───
function FCSignup() {
  const b = useB();
  return (
    <div style={FC_FOREST}>
      <div style={{ paddingTop: 60 }} />
      <FCTopBar kicker="Đăng ký · 30 giây" title="Tạo tài khoản" sub="Lá số đầu tiên — miễn phí." />

      {/* Referral banner */}
      <div style={{ background: 'rgba(139,26,26,0.18)', border: '1px solid rgba(196,77,77,0.5)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--hanzi)', fontSize: 22, color: '#e58a5c', fontWeight: 700 }}>禮</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Mono style={{ color: '#e58a5c' }}>Mã giới thiệu · ANH-MINH-2026</Mono>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: '#ede7d3', marginTop: 1 }}>+10 lượng khi đăng ký xong</div>
        </div>
      </div>

      {/* Prefill banner */}
      <div style={{ background: 'rgba(197,165,90,0.1)', border: `1px solid ${b.accent}`, padding: '12px 14px', marginBottom: 16 }}>
        <Mono style={{ color: b.accent }}>Đã ghi nhận từ trang chủ</Mono>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6, fontFamily: 'var(--mono)', fontSize: 11, color: '#ede7d3' }}>
          <div>Tên · <strong>Hà Thanh</strong></div>
          <div>Sinh · <strong>15 / 03 / 1992</strong></div>
          <div>Giờ · <strong>Mão (5–7h)</strong></div>
          <div>Giới · <strong>Nữ</strong></div>
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: 'rgba(200,188,152,0.7)', marginTop: 8 }}>
          Sau khi đăng ký xong, lá số sẽ tự lập từ thông tin này — không cần điền lại.
        </div>
      </div>

      <FCFormRow label="Email">
        <FCInput value="thanhha@example.com" />
      </FCFormRow>
      <FCFormRow label="Mật khẩu (tối thiểu 8 ký tự)">
        <FCInput value="••••••••••" type="password" />
      </FCFormRow>

      <FCButton primary style={{ marginTop: 4 }}>Tạo tài khoản & lập lá số</FCButton>
      <FCButton dark style={{ marginTop: 8 }}>Đăng nhập với Google</FCButton>

      <div style={{ marginTop: 16, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: 'rgba(200,188,152,0.5)', textAlign: 'center', lineHeight: 1.6 }}>
        Sau khi tạo tài khoản, ngày sinh không thể thay đổi.<br />
        Nếu chưa chắc, hãy hủy và quay lại sau.
      </div>
    </div>
  );
}

// ─── 33 · Bat-dau (onboarding gate) ───
function FCBatDau() {
  const b = useB();
  return (
    <div style={FC_FOREST}>
      <div style={{ paddingTop: 50 }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, marginTop: 12 }}>
        <Logo dark size={44} />
      </div>

      <Ticket>
        <div style={{ padding: '26px 22px 24px', textAlign: 'center', position: 'relative' }}>
          <Stamp ch="開始" style={{ position: 'absolute', top: 14, right: 14, fontSize: 18 }} />

          <Mono style={{ color: '#7a7050' }}>Phiếu chào mừng · 23 / 10 · 2025</Mono>
          <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 32, lineHeight: 1.05, margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Tài khoản<br />đã sẵn sàng
          </h1>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: '#5a4f30', marginBottom: 16 }}>
            Hà Thanh · Tân Kim
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '14px 0', borderTop: '1px dashed rgba(122,112,80,0.4)', borderBottom: '1px dashed rgba(122,112,80,0.4)' }}>
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 26, color: b.accentDeep, lineHeight: 1 }}>20</div>
              <Mono style={{ color: '#7a7050' }}>Lượng tặng</Mono>
            </div>
            <div style={{ width: 1, background: 'rgba(122,112,80,0.3)' }} />
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 26, color: '#3d6b4a', lineHeight: 1 }}>1</div>
              <Mono style={{ color: '#7a7050' }}>Lá số miễn phí</Mono>
            </div>
          </div>

          <p style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.6, color: '#3a3220', margin: '14px 0 0' }}>
            Vào trang chủ để xem hôm nay, hoặc lập lá số ngay.
          </p>
        </div>
      </Ticket>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FCButton primary>Lập lá số ngay (miễn phí)</FCButton>
        <FCButton dark>Vào trang chủ</FCButton>
      </div>

      <div style={{ marginTop: 16, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: 'rgba(200,188,152,0.5)', textAlign: 'center' }}>
        Có thể mua thêm lượng bất cứ lúc nào trong Cài đặt.
      </div>
    </div>
  );
}

// ─── 34 · Day detail (/ngay/:ngay) ───
function FCDayDetail() {
  const b = useB();
  const intents = [
    { name: 'Khai trương', verdict: 'Nên', color: '#3d6b4a' },
    { name: 'Cưới hỏi', verdict: 'Nên', color: '#3d6b4a' },
    { name: 'Ký hợp đồng', verdict: 'Nên', color: '#3d6b4a' },
    { name: 'Nhập trạch', verdict: 'Cân nhắc', color: '#9a7c22' },
    { name: 'Khởi công', verdict: 'Cân nhắc', color: '#9a7c22' },
    { name: 'Vay mượn', verdict: 'Không nên', color: '#8b1a1a' },
    { name: 'An táng', verdict: 'Không nên', color: '#8b1a1a' },
  ];
  return (
    <div style={FC_FOREST}>
      <div style={{ paddingTop: 50 }} />
      <FCTopBar kicker="← Lịch tháng 10" title="Ngày 28 · 10 · 2025" sub="Mậu Tuất · Trực Định · Hoàng Đạo" />

      <Ticket>
        <div style={{ padding: '20px 22px 18px', textAlign: 'center', position: 'relative' }}>
          <Stamp ch="吉日" style={{ position: 'absolute', top: 12, right: 16 }} />
          <Mono style={{ color: '#7a7050' }}>23 / 10 · 28 / 10</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 64, lineHeight: 0.95, margin: '6px 0 2px', color: b.accentDeep, letterSpacing: '-0.03em' }}>28</div>
          <Mono style={{ color: '#5a4f30' }}>Mậu Tuất · Trực Định</Mono>

          {/* Status chip */}
          <div style={{ display: 'inline-block', marginTop: 10, padding: '4px 14px', background: '#3d6b4a', color: '#ede7d3', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Hoàng Đạo · ngày tốt
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed rgba(122,112,80,0.4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'left' }}>
            <div>
              <Mono style={{ color: '#7a7050' }}>Giờ tốt nhất</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, marginTop: 2 }}>Thìn · 7–9h</div>
            </div>
            <div>
              <Mono style={{ color: '#7a7050' }}>Trùng với</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, marginTop: 2 }}>Tị · 9–11h</div>
            </div>
          </div>
        </div>
      </Ticket>

      {/* AI reading mini */}
      <div style={{ marginTop: 12 }}>
        <Ticket>
          <div style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--hanzi)', fontSize: 20, color: b.accentDeep, fontWeight: 700 }}>論</span>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>Luận giải ngày này</span>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.6, color: '#18150e', margin: '6px 0 0' }}>
              Tài tinh hiển lộ — ngày hợp việc tiền bạc và đối tác. Trước trưa thuận lợi nhất.
            </p>
          </div>
        </Ticket>
      </div>

      {/* Intent verdicts */}
      <div style={{ marginTop: 14, background: '#ede7d3' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(122,112,80,0.2)' }}>
          <Mono style={{ color: '#7a7050' }}>Nên / Không nên · 26 việc</Mono>
        </div>
        {intents.map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < intents.length - 1 ? '1px dotted rgba(122,112,80,0.2)' : 'none' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 14, color: '#18150e' }}>{it.name}</span>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, color: it.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{it.verdict}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,188,152,0.14)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#c8bc98' }}>Mở khóa lý do từng việc</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: b.accent, letterSpacing: '0.18em', textTransform: 'uppercase' }}>4 lượng</span>
      </div>
    </div>
  );
}

// ─── 35 · Week list (/tuan-nay) ───
function FCWeekList() {
  const b = useB();
  const days = [
    { date: '23 · T5', solar: '23 / 10', lunar: 'Mậu Tuất', grade: 'A', score: 92, hour: 'Thìn · 7–9h', note: 'Tài tinh vượng — hợp ký kết & gặp đối tác.' },
    { date: '24 · T6', solar: '24 / 10', lunar: 'Kỷ Hợi', grade: 'B', score: 78, hour: 'Tị · 9–11h', note: 'Ngày bình thường — tiến hành việc đã lên kế hoạch.' },
    { date: '25 · T7', solar: '25 / 10', lunar: 'Canh Tý', grade: 'C', score: 64, hour: 'Ngọ · 11–13h', note: 'Nên giữ trung tính — tránh quyết định lớn.' },
    { date: '26 · CN', solar: '26 / 10', lunar: 'Tân Sửu', grade: 'B', score: 81, hour: 'Mùi · 13–15h', note: 'Việc gia đình thuận — ăn uống, sum họp.' },
    { date: '27 · T2', solar: '27 / 10', lunar: 'Nhâm Dần', grade: 'D', score: 41, hour: '—', note: 'Hắc Đạo — nên hoãn việc lớn.' },
    { date: '28 · T3', solar: '28 / 10', lunar: 'Quý Mão', grade: 'A', score: 89, hour: 'Thìn · 7–9h', note: 'Khởi sự, khai trương — ngày tốt nhất tuần.' },
    { date: '29 · T4', solar: '29 / 10', lunar: 'Giáp Thìn', grade: 'B', score: 75, hour: 'Tị · 9–11h', note: 'Học hành, ký giấy tờ thuận.' },
  ];
  const gColor = (g) => ({ A: '#3d6b4a', B: b.accentDeep, C: '#7a7050', D: '#8b1a1a' })[g];
  return (
    <div style={FC_FOREST}>
      <div style={{ paddingTop: 50 }} />
      <FCTopBar kicker="Tuần này · 23 → 29 · 10" title="3 ngày tốt" sub="Sắp xếp theo điểm số phù hợp với mệnh bạn." />

      {/* Week summary card */}
      <Ticket>
        <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Mono style={{ color: '#7a7050' }}>Tổng quan tuần</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, marginTop: 2 }}>
              <span style={{ color: '#3d6b4a' }}>3 A</span> · <span style={{ color: b.accentDeep }}>2 B</span> · <span style={{ color: '#7a7050' }}>1 C</span> · <span style={{ color: '#8b1a1a' }}>1 D</span>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--hanzi)', fontSize: 36, color: b.accentDeep, fontWeight: 700, lineHeight: 1 }}>週</div>
        </div>
      </Ticket>

      {/* Day rows */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {days.map((d, i) => (
          <div key={i} style={{ background: '#ede7d3', display: 'flex', alignItems: 'stretch', borderLeft: `4px solid ${gColor(d.grade)}` }}>
            {/* Grade column */}
            <div style={{ width: 56, background: gColor(d.grade), color: '#ede7d3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 6px' }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 28, lineHeight: 1 }}>{d.grade}</div>
              <Mono style={{ color: 'rgba(237,231,211,0.7)', fontSize: 9, letterSpacing: '0.12em' }}>{d.score}</Mono>
            </div>
            {/* Body */}
            <div style={{ flex: 1, padding: '10px 14px', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.date}</span>
                <Mono style={{ color: '#7a7050' }}>{d.lunar}</Mono>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#5a4f30', marginTop: 2 }}>{d.hour}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: '#3a3220', marginTop: 4, lineHeight: 1.4 }}>{d.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 36 · Month full (/lich-thang re-skin) ───
function FCMonthFull() {
  const b = useB();
  const days = [];
  for (let i = 1; i <= 31; i++) {
    let g = 'C';
    if ([7, 9, 14, 21, 23, 28, 30].includes(i)) g = 'A';
    else if ([3, 11, 17, 24, 26, 29].includes(i)) g = 'B';
    else if ([5, 12, 19, 27].includes(i)) g = 'D';
    days.push({ d: i, g });
  }
  const gColor = (g) => ({ A: '#3d6b4a', B: b.accentDeep, C: 'rgba(122,112,80,0.4)', D: '#8b1a1a' })[g];
  return (
    <div style={FC_FOREST}>
      <div style={{ paddingTop: 50 }} />
      <FCTopBar kicker="Lịch · 10 / 2025" title="Tháng Bính Tuất" sub="7 ngày A · 6 ngày B · 4 ngày D" />

      {/* Month picker strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(200,188,152,0.18)', marginBottom: 12 }}>
        <button style={{ background: 'none', border: 'none', color: b.accent, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>‹ 09 / 2025</button>
        <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, color: '#ede7d3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tháng 10 · 2025</span>
        <button style={{ background: 'none', border: 'none', color: b.accent, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>11 / 2025 ›</button>
      </div>

      <Ticket>
        <div style={{ padding: '14px 14px 16px' }}>
          {/* Day-of-week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 6 }}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
              <Mono key={d} style={{ color: '#7a7050' }}>{d}</Mono>
            ))}
          </div>
          {/* Calendar grid — assume month starts on Wed (col 3) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {[...Array(2)].map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(d => (
              <div key={d.d} style={{ aspectRatio: '1 / 1', background: d.d === 23 ? '#18150e' : 'rgba(255,255,255,0.04)', border: d.d === 23 ? `2px solid ${b.accent}` : '1px solid transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: d.d === 23 ? b.accent : '#18150e' }}>{d.d}</span>
                <span style={{ width: 18, height: 3, background: gColor(d.g), marginTop: 2 }} />
              </div>
            ))}
          </div>
        </div>
      </Ticket>

      {/* Legend */}
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,188,152,0.14)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {[['A', '#3d6b4a', 'Rất tốt'], ['B', b.accentDeep, 'Tốt'], ['C', 'rgba(200,188,152,0.5)', 'Bình'], ['D', '#8b1a1a', 'Kỵ']].map(([g, c, l]) => (
          <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 3, background: c }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#c8bc98', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{g} · {l}</span>
          </div>
        ))}
      </div>

      {/* Picker hint */}
      <div style={{ marginTop: 10, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'rgba(200,188,152,0.65)', textAlign: 'center' }}>
        Chạm vào một ngày để xem chi tiết và việc nên / không nên.
      </div>
    </div>
  );
}

// ─── 37 · Payment success ───
function FCPaymentSuccess({ state = 'paid' }) {
  const b = useB();
  return (
    <div style={FC_FOREST}>
      <FCFlowMotionStyles />
      <div style={{ paddingTop: 60 }} />
      <FCTopBar kicker="Cảm ơn bạn" title={state === 'pending' ? 'Đang chờ xác nhận' : 'Đã nhận thanh toán'} sub={state === 'pending' ? 'PayOS đang gửi xác nhận — thường < 30 giây.' : 'Lượng đã được cộng vào tài khoản.'} />

      <Ticket>
        <div style={{ padding: '20px 22px 18px', textAlign: 'center', position: 'relative' }}>
          {state === 'paid' && <Stamp ch="完成" style={{ position: 'absolute', top: 12, right: 16 }} />}

          <Mono style={{ color: '#7a7050' }}>Mã đơn · NLTT-A1B2C3</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, marginTop: 6, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
            Gói 6 tháng · 600 lượng
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#5a4f30', marginTop: 2 }}>
            299.000 ₫ · VietQR · 23 / 10 / 2025 14:32
          </div>

          {state === 'pending' ? (
            <div style={{ marginTop: 18, padding: '14px 0', borderTop: '1px dashed rgba(122,112,80,0.4)', borderBottom: '1px dashed rgba(122,112,80,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                {[0, 1, 2].map(k => <span key={k} style={{ width: 8, height: 8, borderRadius: '50%', background: b.accent, animation: `fc-pulse-dot 1.4s ease-in-out ${k * 0.2}s infinite` }} />)}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: '#3a3220' }}>Đang đợi xác nhận từ ngân hàng…</div>
            </div>
          ) : (
            <div style={{ marginTop: 18, padding: '14px 0', borderTop: '1px dashed rgba(122,112,80,0.4)', borderBottom: '1px dashed rgba(122,112,80,0.4)', display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <Mono style={{ color: '#7a7050' }}>Số dư trước</Mono>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: '#7a7050', lineHeight: 1, marginTop: 2 }}>15</div>
              </div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 24, color: b.accent, alignSelf: 'center' }}>→</div>
              <div>
                <Mono style={{ color: b.accentDeep }}>Số dư mới</Mono>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 32, color: b.accentDeep, lineHeight: 1, marginTop: 2 }}>615</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 14, fontFamily: 'var(--serif)', fontSize: 13, color: '#3a3220', lineHeight: 1.55 }}>
            Gói có hiệu lực đến <strong>23 / 04 / 2026</strong>.<br />
            Lượng không bao giờ hết hạn.
          </div>
        </div>
      </Ticket>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FCButton primary>Về trang chủ</FCButton>
        <FCButton dark>Lập lá số ngay</FCButton>
      </div>

      {state === 'pending' && (
        <div style={{ marginTop: 14, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: 'rgba(200,188,152,0.6)', textAlign: 'center', lineHeight: 1.6 }}>
          Nếu sau 5 phút chưa thấy cộng — vui lòng liên hệ qua email.<br />
          Lượng sẽ được hoàn nếu giao dịch không thành.
        </div>
      )}
    </div>
  );
}

// ─── 38 · Auth callback (loading) ───
function FCAuthCallback() {
  const b = useB();
  return (
    <div style={FC_FOREST}>
      <FCFlowMotionStyles />
      <div style={{ paddingTop: 60 }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <Logo dark size={36} />
      </div>

      <Ticket>
        <div style={{ padding: '40px 22px', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--hanzi)', fontSize: 80, color: b.accentDeep, fontWeight: 700, lineHeight: 1, animation: 'fc-glyph-fade 1.6s ease-in-out infinite' }}>門</span>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, marginTop: 16, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
            Đang mở cửa…
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: '#5a4f30', marginTop: 4 }}>
            Xác thực với Google
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            {[0, 1, 2].map(k => <span key={k} style={{ width: 6, height: 6, borderRadius: '50%', background: b.accent, animation: `fc-pulse-dot 1.4s ease-in-out ${k * 0.2}s infinite` }} />)}
          </div>
        </div>
      </Ticket>

      <div style={{ marginTop: 16, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'rgba(200,188,152,0.65)', textAlign: 'center' }}>
        Nếu sau 15 giây không vào được, hãy thử lại.
      </div>
    </div>
  );
}

// ─── Notes card ───
function FCNotes() {
  return (
    <div style={{ padding: '40px 56px', background: '#f1ece1', height: '100%', fontFamily: 'var(--serif)', color: '#18150e', overflow: 'auto', position: 'relative' }}>
      <div style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a7c22', borderBottom: '1px solid #c5a55a', paddingBottom: 4 }}>
        Section 2d · Flow-complete
      </div>
      <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 36, lineHeight: 1.05, margin: '14px 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
        The screens B was missing.
      </h1>
      <p style={{ fontSize: 15, color: '#3a3220', lineHeight: 1.65, maxWidth: 720 }}>
        Direction B started at the app shell — but the existing route map has 9 surfaces before that (auth + onboarding gate) and 4 deep-link destinations (single day, week, month, payment success) that B left blank. This row fills them, in the same phiếu language.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 28 }}>
        {[
          ['30 · Đăng nhập (chooser)', 'Google + email · plus a "Lập lá số đầu tiên · miễn phí" card pulling first-time users into signup.'],
          ['31 · Đăng nhập email', 'Email + password — backup for users without Google.'],
          ['32 · Đăng ký + banners', 'Referral banner (+10 lượng) and prefill banner (carries name/dob/gio/gender from landing CTAForm). Auto-laso after signup.'],
          ['33 · Bắt đầu (welcome gate)', 'Phiếu chào mừng with credit + free-laso badge. Replaces the current bare callout.'],
          ['34 · Chi tiết ngày', '/ngay/:ngay — date hero, Hoàng Đạo chip, AI mini, full intent verdict list (26 items)+ bulk unlock.'],
          ['35 · Tuần này', '/tuan-nay — week summary header, 7 day rows with grade column, score, best hour, one-line verdict.'],
          ['36 · Lịch tháng', '/lich-thang re-skin from debug to a real calendar — month picker, grade dots, legend, tap-day hint.'],
          ['37 · Thanh công', '/mua-luong/thanh-cong — order id, before→after balance card. Webhook leak + ops detail removed (see cleanup row).'],
          ['38 · Auth callback', 'Loading state during OAuth redirect — 門 chữ hán + dots. Replaces the spinner.'],
        ].map(([t, d]) => (
          <div key={t} style={{ borderTop: '2px solid #18150e', paddingTop: 12 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>{t}</div>
            <div style={{ fontSize: 13, color: '#3a3220', marginTop: 6, lineHeight: 1.55 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  FCLoginChooser, FCLoginEmail, FCSignup, FCBatDau, FCDayDetail, FCWeekList,
  FCMonthFull, FCPaymentSuccess, FCAuthCallback, FCNotes,
});
