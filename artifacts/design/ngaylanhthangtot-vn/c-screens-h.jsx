/* Direction C — screens part H. EDGE STATES + Settings.
   New: Settings, Notification permission, NO_DATES_FOUND, Payment failure,
        Subscription expired, Confirm dialog, Offline banner */
/* global React, useB, Logo, LogoMark, Mono, StatusBar, HomeIndicator,
   CT, PROFILE, CBackBar, CSegmented, CBottomNav */

// ═══════════════════════════════════════════════════════════════════
// EDGE · Settings — destination for "Cài đặt · đăng xuất" row on Tôi
// ═══════════════════════════════════════════════════════════════════
function CSettings() {
  const rows = [
    { sect: 'Tài khoản', items: [
      ['Email', 'minh.nguyen@gmail.com', 'khoá'],
      ['Đổi mật khẩu', null, '›'],
      ['Đăng nhập 2 lớp', 'tắt', '›'],
    ]},
    { sect: 'Lịch của tôi', items: [
      ['Gói hiện tại', '1 tháng · còn 339 ngày', '›'],
      ['Lịch sử thanh toán', null, '›'],
      ['Phương thức thanh toán', 'ZaloPay', '›'],
    ]},
    { sect: 'Thông báo', items: [
      ['Nhắc giờ vàng buổi sáng', 'bật', '›'],
      ['Nhắc trước ngày đã chọn', '1 ngày · 8h sáng', '›'],
      ['Email tóm tắt tuần', 'tắt', '›'],
    ]},
    { sect: 'Hiển thị', items: [
      ['Ngôn ngữ', 'Tiếng Việt', '›'],
      ['Hiện chữ Hán Việt nặng', 'tắt', '›'],
    ]},
    { sect: 'Hỗ trợ', items: [
      ['Câu hỏi thường gặp', null, '›'],
      ['Liên hệ', null, '›'],
      ['Điều khoản · Bảo mật', null, '›'],
    ]},
  ];
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Cài đặt" />

      <div style={{ flex: 1, padding: '4px 24px 100px', overflow: 'auto' }}>
        {rows.map((r, ri) => (
          <div key={r.sect} style={{ marginTop: ri === 0 ? 8 : 26 }}>
            <Mono style={{ color: CT.muted, fontSize: 9, display: 'block', marginBottom: 4 }}>{r.sect}</Mono>
            {r.items.map(([k, v, arrow], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < r.items.length - 1 ? `1px solid ${CT.hairline2}` : 'none', cursor: 'pointer' }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 14, color: CT.ink, letterSpacing: '-0.005em' }}>{k}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  {v && <span style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted }}>{v}</span>}
                  <span style={{ fontFamily: 'var(--serif)', color: CT.muted, fontSize: 14 }}>{arrow}</span>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Logout — red link */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${CT.hairline}` }}>
          <div style={{ padding: '12px 0', cursor: 'pointer', fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 14, color: CT.red, letterSpacing: '-0.005em' }}>
            Đăng xuất
          </div>
        </div>

        <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9.5, color: CT.muted, textAlign: 'center', letterSpacing: '0.06em' }}>
          v1.0.4 · ngaylanhthangtot.vn
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EDGE · Notification permission — pre-prompt before browser native
// ═══════════════════════════════════════════════════════════════════
function CNotifPerm() {
  return (
    <div style={{ width: 390, height: 800, background: 'rgba(24,21,14,0.5)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <StatusBar />
      <div style={{ background: CT.paper, padding: '14px 26px 28px', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <span style={{ width: 36, height: 4, background: 'rgba(24,21,14,0.18)', borderRadius: 2 }} />
        </div>

        {/* Icon — bell with gold accent */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke={CT.goldDeep} strokeWidth="1.4" fill="rgba(154,124,34,0.06)" />
            <path d="M22 36 V28 C22 22, 26 18, 32 18 C38 18, 42 22, 42 28 V36 L44 40 H20 Z" stroke={CT.goldDeep} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
            <path d="M28 42 C28 44, 30 46, 32 46 C34 46, 36 44, 36 42" stroke={CT.goldDeep} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        <h2 style={{ marginTop: 18, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: CT.ink, textAlign: 'center', lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.015em' }}>
          Nhắc giờ vàng<br /><span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>cho mỗi việc bạn lưu</span>
        </h2>
        <p style={{ marginTop: 12, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink2, lineHeight: 1.55, textAlign: 'center', maxWidth: 300, margin: '12px auto 0' }}>
          Khi bạn lưu một ngày vào sổ, chúng tôi sẽ nhắc <strong style={{ color: CT.ink, fontWeight: 600 }}>1 ngày trước</strong>, vào <strong style={{ color: CT.ink, fontWeight: 600 }}>8 giờ sáng</strong>. Không spam, có thể tắt bất cứ lúc nào.
        </p>

        <button style={{ marginTop: 26, width: '100%', padding: 14, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Bật thông báo
        </button>
        <div style={{ marginTop: 10, textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted, cursor: 'pointer' }}>
          Để sau · không cảm ơn
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EDGE · NO_DATES_FOUND — Tra cứu trả về 0 ngày tốt
// ═══════════════════════════════════════════════════════════════════
function CNoDatesFound() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CSegmented options={['Ngày lành', 'Hợp tuổi']} active={0} />

      <div style={{ flex: 1, padding: '20px 24px 100px', overflow: 'auto' }}>
        {/* Query recap */}
        <div style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted, lineHeight: 1.5 }}>
          Cho việc <strong style={{ color: CT.ink, fontWeight: 600 }}>cưới hỏi</strong> · từ 26.07 đến 26.08 · <span style={{ color: CT.goldDeep, cursor: 'pointer' }}>sửa</span>
        </div>

        {/* Empty state */}
        <div style={{ marginTop: 40, padding: '24px 16px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="6" y="12" width="52" height="44" rx="2" stroke={CT.muted} strokeWidth="1.4" fill="rgba(122,112,80,0.04)" />
            <path d="M6 22 H58 M16 6 V18 M48 6 V18" stroke={CT.muted} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M22 36 L42 50 M42 36 L22 50" stroke={CT.red} strokeWidth="1.8" strokeLinecap="round" />
          </svg>

          <h2 style={{ marginTop: 20, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
            Không có ngày tốt
          </h2>
          <p style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink2, lineHeight: 1.55, maxWidth: 300 }}>
            Trong 30 ngày tới, không ngày nào đạt trên 70 điểm cho việc cưới hỏi với mệnh <strong style={{ color: CT.ink, fontWeight: 600 }}>{PROFILE.menh}</strong>. Tháng 7 âm có nhiều ngày xung — đây là lý do dân gian gọi "tháng cô hồn".
          </p>
        </div>

        {/* Suggestions */}
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Mở rộng đến 3 tháng', 'tăng cơ hội tìm được ngày tốt'],
            ['Đổi sang việc khác', 'có thể "đính hôn" hợp hơn'],
            ['Bỏ qua tháng 7 âm', 'tìm trong tháng 6 và 8'],
          ].map(([t, sub], i) => (
            <div key={i} style={{ padding: '14px 16px', background: '#fff', border: `1px solid ${CT.hairline}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13.5, color: CT.ink, letterSpacing: '-0.005em' }}>{t}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted, marginTop: 3 }}>{sub}</div>
              </div>
              <span style={{ fontFamily: 'var(--serif)', color: CT.goldDeep, fontSize: 14 }}>›</span>
            </div>
          ))}
        </div>
      </div>

      <CBottomNav active={1} />
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EDGE · Payment failure
// ═══════════════════════════════════════════════════════════════════
function CPayFailure() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Thanh toán" />

      <div style={{ flex: 1, padding: '20px 32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {/* X mark in circle, red */}
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="38" stroke={CT.red} strokeWidth="1.5" fill="rgba(163,32,31,0.05)" />
          <circle cx="40" cy="40" r="32" stroke={CT.red} strokeWidth="0.7" fill="none" opacity="0.4" />
          <path d="M28 28 L52 52 M52 28 L28 52" stroke={CT.red} strokeWidth="2.4" strokeLinecap="round" />
        </svg>

        <Mono style={{ color: CT.red, fontSize: 10, letterSpacing: '0.22em', marginTop: 22 }}>Thanh toán không thành công</Mono>
        <h2 style={{ marginTop: 10, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.01em', maxWidth: 300 }}>
          MoMo từ chối<br /><span style={{ color: CT.red, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>giao dịch này</span>
        </h2>
        <p style={{ marginTop: 12, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink2, lineHeight: 1.55, maxWidth: 300 }}>
          Có thể số dư MoMo của bạn không đủ, hoặc giới hạn giao dịch ngày đã đạt. <strong style={{ color: CT.ink, fontWeight: 600 }}>Lịch của bạn chưa bị trừ tiền</strong>.
        </p>

        {/* Error detail card */}
        <div style={{ marginTop: 22, padding: '12px 16px', background: '#fff', border: `1px solid ${CT.hairline}`, width: '100%', maxWidth: 320, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>
            <span>Mã lỗi</span><span style={{ fontFamily: 'var(--mono)', color: CT.ink2 }}>MOMO_INSUFFICIENT_BALANCE</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted, marginTop: 6 }}>
            <span>Thời gian</span><span style={{ color: CT.ink2 }}>26.05.2026 · 14:32</span>
          </div>
        </div>

        <button style={{ marginTop: 28, width: '100%', maxWidth: 320, padding: 14, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Thử lại
        </button>
        <button style={{ marginTop: 10, width: '100%', maxWidth: 320, padding: 13, background: 'transparent', color: CT.ink, border: `1px solid ${CT.goldDeep}`, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Đổi cách thanh toán
        </button>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EDGE · Subscription expired — takeover when sub lapses
// ═══════════════════════════════════════════════════════════════════
function CSubExpired() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      <div style={{ flex: 1, padding: '32px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
        {/* Closed-book / faded calendar SVG */}
        <svg width="84" height="92" viewBox="0 0 84 92" fill="none">
          <rect x="6" y="14" width="72" height="68" rx="2" stroke={CT.muted} strokeWidth="1.4" fill="rgba(122,112,80,0.04)" />
          <path d="M6 28 H78 M22 6 V20 M62 6 V20" stroke={CT.muted} strokeWidth="1.4" strokeLinecap="round" />
          {/* faded grid */}
          {[0, 1, 2].map(i => [0, 1, 2, 3, 4, 5, 6].map(j => (
            <circle key={`${i}-${j}`} cx={14 + j * 10} cy={42 + i * 12} r="1.5" fill="rgba(122,112,80,0.25)" />
          )))}
          {/* lock badge */}
          <circle cx="62" cy="68" r="14" fill={CT.paper} />
          <path d="M58 68 V64 C58 62, 60 60, 62 60 C64 60, 66 62, 66 64 V68" stroke={CT.goldDeep} strokeWidth="1.4" fill="none" />
          <rect x="55" y="68" width="14" height="10" rx="1" fill={CT.goldDeep} />
        </svg>

        <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: '0.22em', marginTop: 22 }}>Lịch đã hết hạn</Mono>
        <h2 style={{ marginTop: 10, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.01em', maxWidth: 320 }}>
          Lịch của bạn<br /><span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>dừng từ 30.04.2026</span>
        </h2>
        <p style={{ marginTop: 14, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink2, lineHeight: 1.55, maxWidth: 320 }}>
          Gia hạn để tiếp tục xem trang hôm nay, tra cứu ngày tốt và đọc <strong style={{ color: CT.ink, fontWeight: 600 }}>luận giải Bát tự + Tiểu Vận 2026</strong>. Lá số tứ trụ của bạn vẫn được lưu — không cần lập lại.
        </p>

        {/* Quick year offer */}
        <div style={{ marginTop: 22, width: '100%', maxWidth: 320, padding: '14px 16px', background: CT.forest, color: CT.cream, position: 'relative' }}>
          <Mono style={{ color: CT.gold, fontSize: 9 }}>Khuyên dùng · tiết kiệm 25%</Mono>
          <div style={{ marginTop: 4, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Lịch Đinh Mùi 2027 · 1 năm</div>
          <div style={{ marginTop: 6, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: CT.gold, fontVariantNumeric: 'tabular-nums' }}>449.000đ <span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: 'rgba(237,231,211,0.6)', textDecoration: 'line-through', fontWeight: 400 }}>588.000đ</span></div>
          <button style={{ marginTop: 12, width: '100%', padding: 11, background: CT.gold, color: CT.forest, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Đặt lịch năm
          </button>
        </div>

        <div style={{ marginTop: 12, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted, cursor: 'pointer' }}>
          Xem các gói khác →
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EDGE · Confirm dialog (logout variant) — centered modal
// ═══════════════════════════════════════════════════════════════════
function CConfirmDialog() {
  return (
    <div style={{ width: 390, height: 800, background: 'rgba(24,21,14,0.55)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
        <div style={{ width: '100%', maxWidth: 320, background: CT.paper, padding: '24px 22px 20px', position: 'relative' }}>
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Xác nhận</Mono>
          <h3 style={{ marginTop: 6, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Đăng xuất khỏi<br />lịch của bạn?
          </h3>
          <p style={{ marginTop: 10, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink2, lineHeight: 1.55 }}>
            Lá số và sổ ngày của bạn vẫn được lưu trên cloud. Đăng nhập lại bất cứ lúc nào.
          </p>

          <div style={{ marginTop: 22, display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, padding: 12, background: 'transparent', color: CT.ink, border: `1px solid ${CT.hairline}`, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Huỷ</button>
            <button style={{ flex: 1, padding: 12, background: CT.ink, color: CT.paper, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Đăng xuất</button>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EDGE · Offline state — Home with banner overlay
// ═══════════════════════════════════════════════════════════════════
function COfflineHome() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar dark />

      {/* Offline banner — sits below status bar */}
      <div style={{ padding: '8px 22px', background: '#3a2a14', color: '#e8d9a3', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(197,165,90,0.2)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8d9a3" strokeWidth="1.6" strokeLinecap="round">
          <path d="M5 12 a7 7 0 0 1 14 0 M8.5 15 a3 3 0 0 1 7 0 M12 18.5 v.1" />
          <path d="M3 3 L21 21" />
        </svg>
        <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 11.5, color: '#e8d9a3', lineHeight: 1.3 }}>
          <strong style={{ fontWeight: 600 }}>Đang offline.</strong> Các trang lịch đã tải vẫn xem được.
        </div>
      </div>

      <CSegmented options={['Hôm nay', 'Tháng']} active={0} dark />

      <div style={{ flex: 1, padding: '18px 22px 100px', overflow: 'hidden' }}>
        <div style={{ background: CT.paperWarm, color: CT.ink, position: 'relative', boxShadow: '0 14px 30px rgba(0,0,0,0.32), 0 2px 4px rgba(0,0,0,0.18)' }}>
          <div style={{ padding: '12px 18px 6px' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>Tháng 5 · 2026 &nbsp;·&nbsp; Bính Ngọ</span>
          </div>
          <div style={{ padding: '4px 18px 12px', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 124, color: CT.red, lineHeight: 0.84, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums' }}>26</div>
            <div style={{ paddingBottom: 14 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30, color: CT.red, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 0.95 }}>Thứ Ba</div>
            </div>
          </div>
          <div style={{ padding: '0 18px 16px', fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink2, lineHeight: 1.55 }}>
            Mùng 10 tháng Tư &nbsp;·&nbsp; ngày <strong style={{ color: CT.ink, fontWeight: 600 }}>Mậu Tuất</strong> &nbsp;·&nbsp; tiết Tiểu Mãn
          </div>
          <div style={{ padding: '12px 18px 12px', borderTop: `1px solid ${CT.hairline}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: CT.goldDeep, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Ngày khá</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted, marginTop: 2 }}>luận giải đầy đủ cần kết nối lại</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 36, color: CT.goldDeep, lineHeight: 1, letterSpacing: '-0.015em' }}>76</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted }}>/100</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, fontFamily: 'var(--serif)', fontSize: 12, color: 'rgba(237,231,211,0.5)', textAlign: 'center', fontStyle: 'italic' }}>
          Tra cứu, hợp tuổi, luận giải AI cần online — sẽ trở lại khi có mạng.
        </div>
      </div>

      <CBottomNav active={0} dark />
      <HomeIndicator dark />
    </div>
  );
}

Object.assign(window, { CSettings, CNotifPerm, CNoDatesFound, CPayFailure, CSubExpired, CConfirmDialog, COfflineHome });
