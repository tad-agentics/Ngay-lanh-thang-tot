/* Direction C — screens part D. AUTH extras + Install banner.
   Install · Email login · Forgot pw req · Forgot pw sent · OAuth callback */
/* global React, useB, Logo, LogoMark, Mono, StatusBar, HomeIndicator,
   CT, PROFILE, CBackBar */

// ═══════════════════════════════════════════════════════════════════
// LAUNCH · Install banner (PWA add-to-home-screen prompt)
// ═══════════════════════════════════════════════════════════════════
function CInstallBanner() {
  return (
    <div style={{ width: 390, height: 800, background: 'rgba(24,21,14,0.5)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <StatusBar />
      <div style={{ background: CT.paper, padding: '14px 24px 28px', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        {/* handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <span style={{ width: 36, height: 4, background: 'rgba(24,21,14,0.18)', borderRadius: 2 }} />
        </div>

        {/* Logo + headline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <LogoMark size={48} />
          <div style={{ lineHeight: 1.25 }}>
            <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Cài lên màn hình</Mono>
            <div style={{ marginTop: 2, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Mở lịch nhanh hơn</div>
          </div>
        </div>

        <p style={{ marginTop: 18, fontFamily: 'var(--serif)', fontSize: 14, color: CT.ink2, lineHeight: 1.55 }}>
          Thêm Ngày Lành vào màn hình chính — mở 1 chạm, không cần qua App Store. Vẫn xem được lịch khi không có mạng.
        </p>

        {/* iOS instructions */}
        <div style={{ marginTop: 18, padding: '14px 16px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: CT.goldDeep, minWidth: 16 }}>1.</span>
            <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink, lineHeight: 1.5 }}>
              Bấm <span style={{ display: 'inline-flex', verticalAlign: 'middle', padding: '1px 4px', border: `1px solid ${CT.muted}`, borderRadius: 3, margin: '0 2px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={CT.ink} strokeWidth="1.6"><path d="M12 3v12 M8 7l4-4 4 4 M5 12v7h14v-7" /></svg>
              </span> Share ở thanh Safari
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: CT.goldDeep, minWidth: 16 }}>2.</span>
            <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink, lineHeight: 1.5 }}>
              Chọn <strong style={{ fontWeight: 600 }}>"Thêm vào màn hình chính"</strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: CT.goldDeep, minWidth: 16 }}>3.</span>
            <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink, lineHeight: 1.5 }}>
              Tên app là <strong style={{ fontWeight: 600 }}>Ngày Lành</strong>, giữ nguyên hoặc đổi
            </div>
          </div>
        </div>

        <button style={{ marginTop: 20, width: '100%', padding: 14, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Đã hiểu
        </button>
        <div style={{ marginTop: 10, textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted, cursor: 'pointer' }}>
          Nhắc tôi lần sau
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUTH · Email login (returning user, not signup)
// ═══════════════════════════════════════════════════════════════════
function CEmailLogin() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar dark />
      <CBackBar dark right={<span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.gold, cursor: 'pointer' }}>Lập lịch mới</span>} />

      <div style={{ flex: 1, padding: '12px 28px 24px', display: 'flex', flexDirection: 'column' }}>
        <Mono style={{ color: CT.gold, fontSize: 10, letterSpacing: '0.22em' }}>Mở lịch của bạn</Mono>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: CT.cream, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.015em', margin: '12px 0 6px' }}>
          Đăng nhập
        </h1>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 13.5, color: 'rgba(237,231,211,0.65)', lineHeight: 1.55 }}>
          Lịch của bạn được lưu trên cloud — đăng nhập là thấy ngay trang hôm nay.
        </p>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: 'rgba(237,231,211,0.55)' }}>Email</div>
            <input type="text" defaultValue="minh.nguyen@gmail.com" style={{ width: '100%', marginTop: 4, padding: '6px 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${CT.gold}`, outline: 'none', color: CT.cream, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em' }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: 'rgba(237,231,211,0.55)' }}>Mật khẩu</div>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.gold, cursor: 'pointer' }}>Quên?</span>
            </div>
            <input type="password" defaultValue="••••••••••" style={{ width: '100%', marginTop: 4, padding: '6px 0', background: 'transparent', border: 'none', borderBottom: `1px solid rgba(237,231,211,0.3)`, outline: 'none', color: CT.cream, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em' }} />
          </div>
        </div>

        <button style={{ marginTop: 32, width: '100%', padding: 15, background: CT.gold, color: CT.forest, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Mở lịch của tôi →
        </button>

        {/* Divider */}
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(237,231,211,0.15)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(237,231,211,0.4)', letterSpacing: '0.18em' }}>HOẶC</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(237,231,211,0.15)' }} />
        </div>

        <button style={{ marginTop: 22, width: '100%', padding: 13, background: 'transparent', color: CT.cream, border: '1px solid rgba(237,231,211,0.25)', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Tiếp tục với Google
        </button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUTH · Forgot password — request
// ═══════════════════════════════════════════════════════════════════
function CForgotPwReq() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar dark />
      <CBackBar dark />

      <div style={{ flex: 1, padding: '12px 28px 24px', display: 'flex', flexDirection: 'column' }}>
        <Mono style={{ color: CT.gold, fontSize: 10, letterSpacing: '0.22em' }}>Quên mật khẩu</Mono>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 32, color: CT.cream, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.015em', margin: '12px 0 6px' }}>
          Gửi link đặt lại<br />qua email
        </h1>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 13.5, color: 'rgba(237,231,211,0.65)', lineHeight: 1.55 }}>
          Lá số của bạn vẫn được lưu — chỉ cần đặt mật khẩu mới là vào lịch lại được.
        </p>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: 'rgba(237,231,211,0.55)' }}>Email đăng ký</div>
          <input type="text" defaultValue="minh.nguyen@gmail.com" style={{ width: '100%', marginTop: 4, padding: '6px 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${CT.gold}`, outline: 'none', color: CT.cream, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em' }} />
        </div>

        <button style={{ marginTop: 32, width: '100%', padding: 15, background: CT.gold, color: CT.forest, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Gửi link đặt lại
        </button>
        <div style={{ marginTop: 14, textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 12.5, color: 'rgba(237,231,211,0.55)' }}>
          Nhớ ra rồi? <span style={{ color: CT.gold, cursor: 'pointer' }}>Quay lại đăng nhập</span>
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUTH · Forgot password — sent confirmation
// ═══════════════════════════════════════════════════════════════════
function CForgotPwSent() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar dark />
      <CBackBar dark />

      <div style={{ flex: 1, padding: '12px 28px 24px', display: 'flex', flexDirection: 'column' }}>
        <Mono style={{ color: CT.gold, fontSize: 10, letterSpacing: '0.22em' }}>Đã gửi</Mono>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 32, color: CT.cream, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.015em', margin: '12px 0 6px' }}>
          Kiểm tra hộp thư<br />của bạn
        </h1>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 13.5, color: 'rgba(237,231,211,0.65)', lineHeight: 1.55 }}>
          Link đặt lại mật khẩu đã gửi đến<br /><strong style={{ color: CT.cream, fontWeight: 600 }}>minh.nguyen@gmail.com</strong>. Hộp thư có thể mất 1–2 phút.
        </p>

        {/* Quiet illustration — envelope outline */}
        <div style={{ marginTop: 40, alignSelf: 'center' }}>
          <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
            <rect x="2" y="6" width="76" height="48" stroke={CT.gold} strokeWidth="1.2" fill="rgba(197,165,90,0.04)" />
            <path d="M2 6 L40 36 L78 6" stroke={CT.gold} strokeWidth="1.2" fill="none" />
          </svg>
        </div>

        <div style={{ marginTop: 40, padding: '12px 14px', background: 'rgba(197,165,90,0.06)', borderLeft: `2px solid ${CT.gold}`, fontFamily: 'var(--serif)', fontSize: 12.5, color: 'rgba(237,231,211,0.75)', lineHeight: 1.55 }}>
          Không thấy email? Kiểm tra mục <strong style={{ color: CT.cream, fontWeight: 600 }}>spam</strong> hoặc <span style={{ color: CT.gold, cursor: 'pointer' }}>gửi lại sau 30 giây</span>.
        </div>

        <button style={{ marginTop: 'auto', width: '100%', padding: 14, background: 'transparent', color: CT.cream, border: '1px solid rgba(237,231,211,0.25)', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Quay lại đăng nhập
        </button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUTH · OAuth callback — Google return loading
// ═══════════════════════════════════════════════════════════════════
function COAuthCallback() {
  return (
    <div style={{ width: 390, height: 800, background: CT.forest, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar dark />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, background: 'radial-gradient(ellipse at 50% 0%, rgba(197,165,90,0.14) 0%, transparent 70%)' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, textAlign: 'center', padding: '0 32px' }}>
        <LogoMark dark size={48} />
        <div>
          <Mono style={{ color: CT.gold, fontSize: 10, letterSpacing: '0.22em' }}>Đang xác minh Google</Mono>
          <p style={{ marginTop: 12, fontFamily: 'var(--serif)', fontSize: 14, color: 'rgba(237,231,211,0.7)', lineHeight: 1.55, maxWidth: 280 }}>
            Một giây thôi — đang đối chiếu tài khoản với lịch của bạn.
          </p>
        </div>
        <div style={{ width: 200, height: 1.5, background: 'rgba(197,165,90,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%', background: CT.gold }} />
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

Object.assign(window, { CInstallBanner, CEmailLogin, CForgotPwReq, CForgotPwSent, COAuthCallback });
