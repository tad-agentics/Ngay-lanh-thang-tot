/* Direction C — screens part F. TOOLS — Phong thuỷ · Tiểu Vận · Chuyển lịch · Sửa hồ sơ.
   These are secondary features — buried in Tab 3 (Tôi) under "Tiện ích khác". */
/* global React, useB, Logo, LogoMark, Mono, StatusBar, HomeIndicator,
   CT, PROFILE, CBackBar */

// ═══════════════════════════════════════════════════════════════════
// TOOLS · Phong thuỷ — direction, color, flying stars
// ═══════════════════════════════════════════════════════════════════
function CPhongThuy() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Phong thuỷ" />

      <div style={{ flex: 1, padding: '4px 24px 28px', overflow: 'auto' }}>
        <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: '0.22em' }}>Theo mệnh {PROFILE.menh}</Mono>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.015em', margin: '8px 0 6px' }}>
          Hướng · màu · sao bay
        </h1>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted, lineHeight: 1.55 }}>
          Cá nhân hoá theo lá số — Quý Thủy năm Canh Ngọ. Cập nhật theo lưu niên 2026.
        </p>

        {/* Hướng tốt */}
        <div style={{ marginTop: 26 }}>
          <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 10 }}>Hướng tốt cho bạn</Mono>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { name: 'Đông Nam', sub: 'Sinh Khí — tài lộc', d: 'tốt nhất' },
              { name: 'Bắc', sub: 'Diên Niên — sức khoẻ', d: 'tốt' },
              { name: 'Đông', sub: 'Thiên Y — quý nhân', d: 'tốt' },
              { name: 'Nam', sub: 'Phục Vị — bình ổn', d: 'tốt vừa' },
            ].map((d, i) => (
              <div key={d.name} style={{ padding: '12px 14px', background: '#fff', border: `1px solid ${i === 0 ? CT.goldDeep : CT.hairline}` }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: i === 0 ? CT.goldDeep : CT.ink, letterSpacing: '-0.005em', textTransform: 'uppercase' }}>{d.name}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginTop: 4 }}>{d.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>
            Tránh hướng: <strong style={{ color: CT.red, fontWeight: 600 }}>Tây Bắc</strong> (Tuyệt Mệnh), <strong style={{ color: CT.red, fontWeight: 600 }}>Tây Nam</strong> (Hoạ Hại)
          </div>
        </div>

        {/* Mầu sắc */}
        <div style={{ marginTop: 28 }}>
          <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 10 }}>Mầu sắc hợp</Mono>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {[
              { c: '#e8e6df', n: 'Trắng' },
              { c: '#8a8c8c', n: 'Xám' },
              { c: '#1d2538', n: 'Xanh đậm' },
              { c: '#1d3129', n: 'Xanh rêu' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '1/1', background: s.c, border: `1px solid ${CT.hairline}` }} />
                <div style={{ marginTop: 6, fontFamily: 'var(--serif)', fontSize: 11, color: CT.ink2 }}>{s.n}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>
            Tránh: <strong style={{ color: CT.red, fontWeight: 600 }}>vàng đậm, nâu, đỏ chói</strong> (Thổ Hỏa khắc mệnh)
          </div>
        </div>

        {/* Sao bay (cửu cung phi tinh) */}
        <div style={{ marginTop: 28 }}>
          <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 10 }}>Sao bay 2026 — Bính Ngọ</Mono>
          <div style={{ padding: '14px 14px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {[
                ['Tây Nam', '2 · Bệnh', CT.red],
                ['Đông', '7 · Phá', CT.red],
                ['Đông Nam', '9 · Hỷ', CT.goldDeep],
                ['Bắc', '6 · Tài', CT.goldDeep],
                ['Trung', '5 · Tử', CT.red],
                ['Nam', '1 · Bạch', CT.goldDeep],
                ['Đông Bắc', '4 · Văn', CT.goldDeep],
                ['Tây', '3 · Thị', CT.muted],
                ['Tây Bắc', '8 · Tài', CT.goldDeep],
              ].map(([dir, s, col], i) => (
                <div key={i} style={{ padding: '8px 4px', textAlign: 'center', background: i === 4 ? 'rgba(154,124,34,0.06)' : 'transparent', border: `1px solid ${CT.hairline2}` }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: CT.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{dir}</div>
                  <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11.5, color: col, letterSpacing: '-0.005em' }}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11.5, color: CT.muted, lineHeight: 1.4 }}>
              Trung cung — sao 5 Tử đáo. Tránh đào xới, sửa chữa hướng giữa nhà trong năm Bính Ngọ.
            </div>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TOOLS · Tiểu Vận — annual fortune cycle
// ═══════════════════════════════════════════════════════════════════
function CTieuVan() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Tiểu Vận · vận hạn năm" />

      <div style={{ flex: 1, padding: '4px 24px 28px', overflow: 'auto' }}>
        <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: '0.22em' }}>{PROFILE.tuoi} · 36 tuổi</Mono>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.015em', margin: '8px 0 6px' }}>
          Năm Bính Ngọ <span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>· 2026</span>
        </h1>

        {/* Headline verdict */}
        <div style={{ marginTop: 22, padding: '16px 18px', background: '#fff', border: `1px solid ${CT.goldDeep}` }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Vận năm</Mono>
          <div style={{ marginTop: 4, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Năm tốt — củng cố
          </div>
          <p style={{ marginTop: 8, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: CT.ink2, lineHeight: 1.55 }}>
            "Bính Ngọ — Hỏa vượng. Bạn mệnh Thủy, năm này nên nuôi dưỡng, củng cố — chưa phải lúc phát rộng. Sang Đinh Mùi (2027) mới là thời cơ lớn."
          </p>
        </div>

        {/* Highlight sections */}
        <div style={{ marginTop: 22 }}>
          {[
            { t: 'Tài lộc', verdict: 'Trung bình ↑', d: 'Thu nhập ổn, nhưng tránh đầu tư mạo hiểm. Quý 3 tốt nhất.' },
            { t: 'Sự nghiệp', verdict: 'Tiến triển', d: 'Cơ hội thăng tiến cuối năm. Người trẻ học hành thuận lợi.' },
            { t: 'Tình duyên', verdict: 'Ổn định', d: 'Người độc thân — quý nhân quanh tháng 10. Đã có đôi — tránh tranh cãi tháng 6.' },
            { t: 'Sức khoẻ', verdict: 'Cẩn trọng', d: 'Tâm-thận yếu, nên giảm stress. Khám sức khoẻ đầu năm.' },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${CT.hairline2}` : 'none', alignItems: 'baseline' }}>
              <div style={{ minWidth: 76 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: CT.ink, letterSpacing: '-0.005em', textTransform: 'uppercase' }}>{s.t}</div>
                <Mono style={{ color: CT.goldDeep, fontSize: 8.5, marginTop: 4 }}>{s.verdict}</Mono>
              </div>
              <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink2, lineHeight: 1.55 }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* Tam tai / Tuế phá warnings */}
        <div style={{ marginTop: 22, padding: '14px 14px', background: 'rgba(163,32,31,0.05)', borderLeft: `2px solid ${CT.red}` }}>
          <Mono style={{ color: CT.red, fontSize: 9 }}>Cảnh báo</Mono>
          <div style={{ marginTop: 6, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink2, lineHeight: 1.55 }}>
            <strong style={{ color: CT.ink, fontWeight: 600 }}>Tam Tai</strong> — năm cuối tam tai (Thân Tý Thìn → Ngọ là năm thứ 3). Hạn nhẹ, cẩn thận tháng 7 âm và các chuyến đi xa.
          </div>
        </div>

        {/* Next year tease */}
        <div style={{ marginTop: 22, padding: '12px 14px', background: 'rgba(154,124,34,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Năm sau</Mono>
            <div style={{ marginTop: 3, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13.5, color: CT.ink, letterSpacing: '-0.005em' }}>Đinh Mùi 2027 — Năm phát</div>
          </div>
          <span style={{ fontFamily: 'var(--serif)', color: CT.goldDeep, fontSize: 14, cursor: 'pointer' }}>Xem trước ›</span>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TOOLS · Chuyển lịch — lunar ↔ solar converter
// ═══════════════════════════════════════════════════════════════════
function CChuyenLich() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Chuyển lịch âm ↔ dương" />

      <div style={{ flex: 1, padding: '12px 28px 28px', display: 'flex', flexDirection: 'column' }}>
        {/* Direction toggle */}
        <div style={{ display: 'flex', gap: 6, padding: 3, background: 'rgba(154,124,34,0.07)', borderRadius: 999 }}>
          {['Dương → Âm', 'Âm → Dương'].map((l, i) => (
            <button key={l} style={{ flex: 1, padding: '9px 0', background: i === 0 ? CT.forest : 'transparent', color: i === 0 ? CT.cream : CT.muted, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11.5, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>{l}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ marginTop: 26 }}>
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Ngày dương lịch</Mono>
          <div style={{ marginTop: 6, padding: '14px 16px', background: '#fff', border: `1px solid ${CT.goldDeep}`, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 28, color: CT.ink, letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>26 · 05 · 2026</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 16, color: CT.goldDeep }}>▾</span>
          </div>
        </div>

        {/* Arrow */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: 22, color: CT.muted }}>↓</div>

        {/* Result */}
        <div style={{ marginTop: 16 }}>
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Ngày âm lịch</Mono>
          <div style={{ marginTop: 6, padding: '14px 16px', background: 'rgba(154,124,34,0.05)', border: `1px solid ${CT.hairline}` }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 28, color: CT.ink, letterSpacing: '-0.015em' }}>Mùng 10 · Tháng Tư</div>
            <div style={{ marginTop: 6, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink2, lineHeight: 1.55 }}>
              Năm <strong style={{ color: CT.ink, fontWeight: 600 }}>Bính Ngọ</strong> &nbsp;·&nbsp; ngày <strong style={{ color: CT.ink, fontWeight: 600 }}>Mậu Tuất</strong> &nbsp;·&nbsp; tiết <strong style={{ color: CT.ink, fontWeight: 600 }}>Tiểu Mãn</strong>
            </div>
          </div>
        </div>

        {/* Extras */}
        <div style={{ marginTop: 22, padding: '14px 14px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Sự kiện cùng ngày</Mono>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2, lineHeight: 1.55 }}>
            <div><strong style={{ color: CT.ink, fontWeight: 600 }}>Tiết Tiểu Mãn</strong> · đang trong tiết</div>
            <div><strong style={{ color: CT.ink, fontWeight: 600 }}>Ngày Phật Đản</strong> · đã qua (15.4 âm = 11.5 dương)</div>
            <div style={{ color: CT.muted }}>Không trùng ngày lễ Quốc gia nào</div>
          </div>
        </div>

        <button style={{ marginTop: 'auto', width: '100%', padding: 13, background: 'transparent', color: CT.ink, border: `1px solid ${CT.goldDeep}`, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Mở trang lịch ngày này →
        </button>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACCOUNT · Sửa hồ sơ
// ═══════════════════════════════════════════════════════════════════
function CEditProfile() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Sửa hồ sơ" right={<span style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.goldDeep, cursor: 'pointer' }}>Lưu</span>} />

      <div style={{ flex: 1, padding: '12px 28px 28px', overflow: 'auto' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted, lineHeight: 1.55 }}>
          Sửa lá số sẽ chấm lại tất cả ngày trong lịch của bạn. Cẩn thận với giờ sinh — sai một canh, sai cả luận đoán.
        </div>

        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name */}
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>Họ và tên</div>
            <input type="text" defaultValue="Nguyễn Thị Minh" style={{ width: '100%', marginTop: 4, padding: '6px 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${CT.hairline}`, outline: 'none', color: CT.ink, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em' }} />
          </div>
          {/* Sex */}
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>Giới tính</div>
            <div style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 14, color: CT.ink }}>
              <span style={{ cursor: 'pointer' }}>Nam</span>
              <span style={{ margin: '0 8px', color: CT.muted }}>·</span>
              <span style={{ cursor: 'pointer', fontWeight: 600, borderBottom: `1.5px solid ${CT.goldDeep}` }}>Nữ</span>
            </div>
          </div>
          {/* Email — disabled */}
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>Email</div>
            <div style={{ marginTop: 8, padding: '6px 0', borderBottom: `1px solid ${CT.hairline}`, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, color: CT.ink2, letterSpacing: '-0.005em' }}>minh.nguyen@gmail.com</span>
              <Mono style={{ marginLeft: 'auto', color: CT.muted, fontSize: 9 }}>khoá</Mono>
            </div>
          </div>
          {/* Birth date */}
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>Ngày sinh dương lịch</div>
            <div style={{ marginTop: 4, padding: '6px 0', borderBottom: `1px solid ${CT.goldDeep}`, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, color: CT.ink, letterSpacing: '-0.005em' }}>20 · 05 · 1990</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>Mùng 26 · Tháng Tư · Canh Ngọ</span>
            </div>
          </div>
          {/* Birth time */}
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>Giờ sinh — 12 canh</div>
            <div style={{ marginTop: 4, padding: '6px 0', borderBottom: `1px solid ${CT.hairline}`, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 17, color: CT.ink, letterSpacing: '-0.005em' }}>Mão · 5–7h sáng</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--serif)', fontSize: 12, color: CT.goldDeep, cursor: 'pointer' }}>Đổi</span>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ marginTop: 36, paddingTop: 18, borderTop: `1px solid ${CT.hairline}` }}>
          <Mono style={{ color: CT.red, fontSize: 9 }}>Vùng nhạy cảm</Mono>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 13.5, color: CT.ink, letterSpacing: '-0.005em' }}>Tải xuống dữ liệu</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginTop: 2 }}>Lá số + sổ ngày — file JSON</div>
              </div>
              <span style={{ fontFamily: 'var(--serif)', color: CT.goldDeep, fontSize: 14 }}>›</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 13.5, color: CT.red, letterSpacing: '-0.005em' }}>Xoá tài khoản</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginTop: 2 }}>Không khôi phục được</div>
              </div>
              <span style={{ fontFamily: 'var(--serif)', color: CT.red, fontSize: 14 }}>›</span>
            </div>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { CPhongThuy, CTieuVan, CChuyenLich, CEditProfile });
