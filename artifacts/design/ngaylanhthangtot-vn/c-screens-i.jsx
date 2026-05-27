/* Direction C — screens part I. Wave 1+2 follow-up screens.
   New: Bazi locked (paywall preview), Pay confirm standalone, Pay success standalone, Tôi locked variant */
/* global React, useB, Logo, LogoMark, Mono, StatusBar, HomeIndicator,
   CT, PROFILE, CBackBar, CBottomNav, scoreDot */

// ═══════════════════════════════════════════════════════════════════
// WAVE 1 · Bazi reading — LOCKED variant
//      Monthly/6mo users see section 01 then paywall sheet
// ═══════════════════════════════════════════════════════════════════
function CBaziLocked() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Luận giải Bát tự · 2026" />

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Section 01 visible as teaser */}
        <div style={{ padding: '4px 24px 0', overflow: 'hidden' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted, lineHeight: 1.5 }}>
            {PROFILE.name} · sinh 20.05.1990 · giờ Mão · {PROFILE.tuoi}
          </div>

          <section style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 6, borderBottom: `1px solid ${CT.ink}` }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.goldDeep, letterSpacing: '0.18em' }}>01</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Mệnh tổng quan</span>
            </div>
            <h2 style={{ marginTop: 14, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26, color: CT.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.015em' }}>
              Quý Thủy · <span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>Trường Lưu Thủy</span>
            </h2>
            <p style={{ marginTop: 8, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, color: CT.ink2, lineHeight: 1.6 }}>
              "Nước sông dài — hợp người làm việc bền bỉ, dẻo dai. Sự nghiệp thường tỏ rõ sau tuổi 35, không thuộc dạng phát nhanh."
            </p>
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {[['Niên', 'Canh Ngọ', 'Kim'], ['Nguyệt', 'Quý Mùi', 'Thủy'], ['Nhật', 'Quý Tỵ', 'Thủy', true], ['Thời', 'Ất Mão', 'Mộc']].map(([l, v, ng, hi], i) => (
                <div key={i} style={{ padding: '8px 4px', textAlign: 'center', background: hi ? 'rgba(154,124,34,0.08)' : 'transparent', border: `1px solid ${hi ? CT.goldDeep : CT.hairline2}` }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 9.5, color: CT.muted }}>{l}</div>
                  <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: hi ? CT.goldDeep : CT.ink, letterSpacing: '-0.005em' }}>{v}</div>
                  <div style={{ marginTop: 3, fontFamily: 'var(--mono)', fontSize: 8, color: CT.muted, letterSpacing: '0.04em' }}>{ng}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Fade-out overlay */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 360, background: 'linear-gradient(to bottom, rgba(240,236,226,0) 0%, rgba(240,236,226,0.95) 30%, rgba(240,236,226,1) 100%)', pointerEvents: 'none' }} />

        {/* Paywall sheet on top */}
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18, background: '#fff', border: `1.5px solid ${CT.goldDeep}`, padding: '18px 18px 16px', boxShadow: '0 16px 36px rgba(0,0,0,0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: CT.goldDeep, fontSize: 16 }}>★</span>
            <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: '0.18em' }}>Còn 4 chương nữa</Mono>
          </div>
          <h3 style={{ marginTop: 6, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Tính cách · vận năm<br />phong thuỷ · quý nhân
          </h3>
          <p style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2, lineHeight: 1.55 }}>
            Mở khoá đầy đủ — đọc cả luận giải Bát tự + luận giải Tiểu Vận năm Bính Ngọ.
          </p>

          {/* 2 paths */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={{ padding: '11px 14px', background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span>Nâng lên Lịch năm · gồm cả 2</span>
              <span style={{ color: CT.gold, fontVariantNumeric: 'tabular-nums' }}>449k</span>
            </button>
            <button style={{ padding: '11px 14px', background: 'transparent', color: CT.ink, border: `1px solid ${CT.goldDeep}`, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span>Chỉ mua riêng Bát tự</span>
              <span style={{ color: CT.goldDeep, fontVariantNumeric: 'tabular-nums' }}>299k</span>
            </button>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WAVE 2 · Pay confirm — STANDALONE (Bát tự 299k)
// ═══════════════════════════════════════════════════════════════════
function CPayConfirmStandalone() {
  return (
    <div style={{ width: 390, height: 800, background: 'rgba(24,21,14,0.45)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <StatusBar />
      <div style={{ background: CT.paper, padding: '14px 24px 32px', borderTopLeftRadius: 16, borderTopRightRadius: 16, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 36, height: 4, background: 'rgba(24,21,14,0.18)', borderRadius: 2 }} />
        </div>

        <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>Mua lẻ</div>
        <h2 style={{ marginTop: 4, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.015em' }}>Luận giải Bát tự</h2>
        <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>Một lần · dùng suốt đời</div>

        <div style={{ marginTop: 20, padding: '14px 0', borderTop: `1px solid ${CT.hairline}`, borderBottom: `1px solid ${CT.hairline}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink }}>Luận giải Bát tự năm</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginTop: 3 }}>5 chương · mệnh · tính cách · quý nhân</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: CT.goldDeep, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em' }}>299.000đ</div>
          </div>
        </div>

        {/* Upsell nudge */}
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(154,124,34,0.08)', borderLeft: `2px solid ${CT.goldDeep}`, fontFamily: 'var(--serif)', fontSize: 12, color: CT.ink2, lineHeight: 1.5 }}>
          Đổi sang <strong style={{ color: CT.ink, fontWeight: 600 }}>Lịch năm 449k</strong> để thêm lịch cá nhân + Tiểu Vận 2026. <span style={{ color: CT.goldDeep, cursor: 'pointer' }}>Đổi gói</span>
        </div>

        <div style={{ marginTop: 16, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted }}>Thanh toán qua</div>
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

        <button style={{ marginTop: 22, width: '100%', padding: 15, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Thanh toán 299.000đ
        </button>
        <div style={{ marginTop: 10, textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted, lineHeight: 1.6 }}>
          Hoàn tiền 7 ngày · giao dịch một lần
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WAVE 2 · Pay success — STANDALONE
// ═══════════════════════════════════════════════════════════════════
function CPaySuccessStandalone() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ flex: 1, padding: '40px 32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <svg width="84" height="84" viewBox="0 0 88 88" fill="none">
          <circle cx="44" cy="44" r="42" stroke={CT.goldDeep} strokeWidth="1.5" fill="rgba(154,124,34,0.06)" />
          <circle cx="44" cy="44" r="36" stroke={CT.goldDeep} strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M28 46 L40 58 L60 32" stroke={CT.goldDeep} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: '0.22em', marginTop: 24 }}>Đã mua thành công</Mono>
        <h2 style={{ marginTop: 10, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.015em', maxWidth: 320 }}>
          Luận giải Bát tự<br /><span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>của bạn đã mở</span>
        </h2>
        <p style={{ marginTop: 12, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink2, lineHeight: 1.55, maxWidth: 300 }}>
          Đọc được vĩnh viễn · không hết hạn. Hoá đơn đã gửi vào <strong style={{ color: CT.ink }}>minh.nguyen@gmail.com</strong>.
        </p>

        {/* Cross-sell to year plan */}
        <div style={{ marginTop: 22, padding: '12px 14px', background: 'rgba(154,124,34,0.06)', borderLeft: `2px solid ${CT.goldDeep}`, width: '100%', maxWidth: 320, textAlign: 'left' }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Còn thiếu</Mono>
          <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2, lineHeight: 1.55 }}>
            Bạn chưa có <strong style={{ color: CT.ink, fontWeight: 600 }}>Lịch cá nhân</strong> và <strong style={{ color: CT.ink, fontWeight: 600 }}>Tiểu Vận 2026</strong>. Nâng lên Lịch năm chỉ thêm <strong style={{ color: CT.goldDeep, fontWeight: 700 }}>150.000đ</strong>.
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11.5, color: CT.goldDeep, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Xem chi tiết →</div>
        </div>

        <button style={{ marginTop: 22, width: '100%', maxWidth: 320, padding: 14, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Đọc luận giải ngay →
        </button>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WAVE 2 · Tôi · variant — monthly user, Bazi LOCKED
// ═══════════════════════════════════════════════════════════════════
function CMeLocked() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      <div style={{ flex: 1, padding: '20px 24px 100px', overflow: 'auto' }}>
        {/* Identity */}
        <div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{PROFILE.name}</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted }}>{PROFILE.tuoi} · mệnh {PROFILE.menh}</div>
        </div>

        {/* Lịch của tôi · monthly */}
        <div style={{ marginTop: 28, padding: '14px 16px', background: CT.forest, color: CT.cream }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: CT.gold, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Lịch của tôi · gói tháng</div>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 11, color: 'rgba(237,231,211,0.6)' }}>còn 22 ngày</span>
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Dùng đến 17.06.2026</div>
          <div style={{ marginTop: 12, height: 3, background: 'rgba(237,231,211,0.15)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '6%', background: CT.gold }} />
          </div>
          <button style={{ marginTop: 14, width: '100%', padding: 12, background: CT.gold, color: CT.forest, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Nâng lên lịch năm — tiết kiệm 498k
          </button>
        </div>

        {/* Bazi card — LOCKED variant */}
        <div style={{ marginTop: 22, padding: '14px 16px', background: '#fff', border: `1px solid ${CT.hairline}`, cursor: 'pointer', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: CT.muted, fontSize: 14 }}>○</span>
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Chưa mở khoá</Mono>
          </div>
          <div style={{ marginTop: 6, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 19, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Luận giải Bát tự năm</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>tính cách · vận năm · phong thuỷ · quý nhân</div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.goldDeep, fontVariantNumeric: 'tabular-nums' }}>299.000đ</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted }}>· hoặc miễn phí với Lịch năm</span>
          </div>
        </div>

        {/* Ngày sắp tới — mini reminder list (replaces Sổ ngày) */}
        <div style={{ marginTop: 36, paddingTop: 22, borderTop: `1px solid ${CT.hairline}` }}>
          <Mono style={{ color: CT.muted, fontSize: 9, display: 'block', marginBottom: 6 }}>Ngày sắp tới · đã đánh dấu</Mono>
          {[
            { d: '06.06', v: 'Khai trương cửa hàng', s: 92, in: '11 ngày nữa' },
            { d: '17.06', v: 'Ký hợp đồng', s: 85, in: '22 ngày nữa' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${CT.hairline2}` : 'none', alignItems: 'baseline' }}>
              <div style={{ minWidth: 50 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 17, color: CT.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em' }}>{r.d}</div>
                <Mono style={{ color: CT.muted, fontSize: 8.5, marginTop: 3 }}>{r.in}</Mono>
              </div>
              <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink }}>{r.v}</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: scoreDot(r.s), fontVariantNumeric: 'tabular-nums' }}>{r.s}</div>
            </div>
          ))}
        </div>

        {/* Lá số */}
        <div style={{ marginTop: 36, paddingTop: 22, borderTop: `1px solid ${CT.hairline}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Lá số tứ trụ</Mono>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.goldDeep, cursor: 'pointer' }}>Xem chi tiết →</span>
          </div>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {[['Niên', 'Canh Ngọ'], ['Nguyệt', 'Quý Mùi'], ['Nhật', 'Quý Tỵ', true], ['Thời', 'Ất Mão']].map(([l, v, hi], i) => (
              <div key={i} style={{ padding: '8px 6px', textAlign: 'center', background: hi ? 'rgba(154,124,34,0.08)' : 'transparent', border: `1px solid ${hi ? CT.goldDeep : CT.hairline2}` }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 10, color: CT.muted }}>{l}</div>
                <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: hi ? CT.goldDeep : CT.ink, letterSpacing: '-0.005em' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tiện ích */}
        <div style={{ marginTop: 36, paddingTop: 22, borderTop: `1px solid ${CT.hairline}` }}>
          <Mono style={{ color: CT.muted, fontSize: 9, display: 'block', marginBottom: 4 }}>Tiện ích · cài đặt</Mono>
          {[['Chuyển lịch', 'âm ↔ dương'], ['Cài đặt', 'thông báo · tài khoản · hỗ trợ']].map(([t, sub], i, arr) => (
            <div key={t} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${CT.hairline2}` : 'none', cursor: 'pointer' }}>
              <div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink, letterSpacing: '-0.005em' }}>{t}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginTop: 2 }}>{sub}</div>
              </div>
              <span style={{ fontFamily: 'var(--serif)', color: CT.goldDeep, fontSize: 14 }}>›</span>
            </div>
          ))}
        </div>
      </div>

      <CBottomNav active={2} />
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { CBaziLocked, CPayConfirmStandalone, CPaySuccessStandalone, CMeLocked });
