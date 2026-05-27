/* Direction C — Screens part B. Tra cứu, Hợp tuổi, Tôi, Pricing.
   Toned-down: keep the structure of v1 but lighten tints, drop redundant labels, soften badges. */
/* global React, useB, Logo, LogoMark, Mono, StatusBar, HomeIndicator,
   CT, PROFILE, CTopStrip, CSegmented, CBottomNav, IconSearch, IconCalendar, IconUser, scoreDot */
const { useState: c2UseState } = React;

// ═══════════════════════════════════════════════════════════════════
// 04 · Tra cứu — entry
// ═══════════════════════════════════════════════════════════════════
function CSearchEntry() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CTopStrip />
      <CSegmented options={['Ngày lành', 'Hợp tuổi']} active={0} />

      <div style={{ flex: 1, padding: '22px 24px 100px', overflow: 'auto' }}>
        {/* Intent */}
        <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>Tôi sắp làm</div>
        <div style={{ marginTop: 6, padding: '14px 14px', background: '#fff', border: `1px solid ${CT.goldDeep}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              Khai trương<br /><span style={{ color: CT.goldDeep, fontWeight: 700 }}>cửa hàng</span>
            </div>
            <div style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>26 việc · chọn lại</div>
          </div>
          <span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontSize: 16 }}>▾</span>
        </div>

        {/* Quick chips — softer */}
        <div style={{ marginTop: 14, fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted, lineHeight: 1.7 }}>
          Gợi ý:&nbsp;
          {['Cưới hỏi', 'Ký hợp đồng', 'Xuất hành', 'Động thổ', 'Mua nhà'].map((v, i, a) => (
            <span key={v}>
              <span style={{ color: CT.ink, cursor: 'pointer' }}>{v}</span>
              {i < a.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>

        {/* Range */}
        <div style={{ marginTop: 28, fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>Trong khoảng</div>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
          <div style={{ padding: '11px 12px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 10, color: CT.muted }}>Từ ngày</div>
            <div style={{ marginTop: 3, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink, letterSpacing: '-0.005em' }}>26 · 05 · 2026</div>
          </div>
          <span style={{ color: CT.muted, fontFamily: 'var(--serif)' }}>→</span>
          <div style={{ padding: '11px 12px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 10, color: CT.muted }}>Đến ngày</div>
            <div style={{ marginTop: 3, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink, letterSpacing: '-0.005em' }}>26 · 06 · 2026</div>
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          {['7 ngày', '14 ngày', '1 tháng', '3 tháng'].map((p, i) => (
            <span key={p} style={{
              flex: 1, fontFamily: 'var(--mono)', fontSize: 9.5, padding: '7px 4px',
              background: i === 2 ? CT.forest : 'transparent',
              color: i === 2 ? CT.cream : CT.muted,
              border: i === 2 ? 'none' : `1px solid ${CT.hairline}`,
              textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            }}>{p}</span>
          ))}
        </div>

        {/* Optional — quiet inline link */}
        <div style={{ marginTop: 26, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.goldDeep, cursor: 'pointer' }}>
          + Loại trừ ngày kỵ với người đi cùng
        </div>

        {/* CTA */}
        <button style={{ marginTop: 32, width: '100%', padding: 15, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Tìm ngày tốt nhất
        </button>
      </div>

      <CBottomNav active={1} />
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 05 · Tra cứu — result
// ═══════════════════════════════════════════════════════════════════
function CSearchResult() {
  const days = [
    { d: '06.06', wd: 'Thứ Bảy', lunar: 'Mùng 21 Tháng Tư', score: 92, chi: 'Kỷ Tỵ', why: 'Hỏa khí thịnh, hợp khai trương thương hiệu mới' },
    { d: '14.06', wd: 'Chủ Nhật', lunar: 'Mùng 29 Tháng Tư', score: 88, chi: 'Đinh Sửu', why: 'Thổ vượng, hợp mở cửa hàng dịch vụ' },
    { d: '17.06', wd: 'Thứ Tư', lunar: 'Mùng 2 Tháng Năm', score: 85, chi: 'Canh Thìn', why: 'Hợp với Quý Thủy của bạn — Kim sinh Thủy' },
    { d: '23.06', wd: 'Thứ Ba', lunar: 'Mùng 8 Tháng Năm', score: 78, chi: 'Bính Tuất', why: 'Khá tốt, nhưng tránh giờ Ngọ' },
    { d: '25.06', wd: 'Thứ Năm', lunar: 'Mùng 10 Tháng Năm', score: 73, chi: 'Mậu Tý', why: 'Hợp lễ ra mắt, ký kết hợp đồng phụ' },
  ];
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CTopStrip />
      <CSegmented options={['Ngày lành', 'Hợp tuổi']} active={0} />

      <div style={{ flex: 1, padding: '20px 24px 100px', overflow: 'auto' }}>
        {/* Query recap — single line */}
        <div style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted, lineHeight: 1.5 }}>
          Cho việc <strong style={{ color: CT.ink, fontWeight: 600 }}>khai trương cửa hàng</strong> · từ 26.05 đến 26.06 · <span style={{ color: CT.goldDeep, cursor: 'pointer' }}>sửa</span>
        </div>

        <div style={{ marginTop: 20, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
          5 ngày tốt nhất
        </div>

        {/* List — hairline rows */}
        <div style={{ marginTop: 4 }}>
          {days.map((day, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 14px', background: i === 0 ? 'rgba(154,124,34,0.12)' : 'transparent', borderBottom: i < days.length - 1 ? `1px solid ${CT.hairline2}` : 'none', cursor: 'pointer', alignItems: 'baseline', position: 'relative', borderLeft: i === 0 ? `3px solid ${CT.goldDeep}` : '3px solid transparent' }}>
              {i === 0 && <span style={{ position: 'absolute', top: 8, right: 14, fontFamily: 'var(--mono)', fontSize: 9, color: CT.goldDeep, letterSpacing: '0.2em', fontWeight: 800, background: CT.gold, padding: '2px 6px' }}>★ ĐỀ XUẤT</span>}
              <div style={{ minWidth: 54 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 24, color: i === 0 ? CT.red : CT.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{day.d.split('.')[0]}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted, marginTop: 3 }}>Th {day.d.split('.')[1]} · {day.wd.replace('Thứ ', 'T').replace('Chủ Nhật', 'CN')}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginBottom: 3 }}>{day.chi} · {day.lunar}</div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: CT.ink2, lineHeight: 1.45 }}>{day.why}</div>
              </div>
              <div style={{ minWidth: 38, textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: scoreDot(day.score), fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{day.score}</span>
              </div>
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
// 06 · Hợp tuổi
// ═══════════════════════════════════════════════════════════════════
function CHopTuoi() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CTopStrip />
      <CSegmented options={['Ngày lành', 'Hợp tuổi']} active={1} />

      <div style={{ flex: 1, padding: '22px 24px 100px', overflow: 'auto' }}>
        {/* Self */}
        <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>Bạn</div>
        <div style={{ marginTop: 8, padding: '12px 14px', background: CT.forest, color: CT.cream }}>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.005em' }}>{PROFILE.name}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: 'rgba(237,231,211,0.65)', marginTop: 4 }}>
            20.05.1990 · giờ Mão · {PROFILE.tuoi} · mệnh {PROFILE.menh}
          </div>
        </div>

        {/* Other */}
        <div style={{ marginTop: 22, fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>Đối phương</div>
        <div style={{ marginTop: 8, padding: '12px 14px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
          <input
            type="text"
            defaultValue="Trần Văn Hùng"
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 15, color: CT.ink, padding: 0, letterSpacing: '-0.005em' }}
          />
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 10, color: CT.muted }}>Ngày sinh</div>
              <div style={{ marginTop: 3, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 13, color: CT.ink, letterSpacing: '-0.005em' }}>18.09.1988</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 10, color: CT.muted }}>Giờ sinh</div>
              <div style={{ marginTop: 3, fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 13, color: CT.ink, letterSpacing: '-0.005em' }}>Sửu · 1–3h</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 4 }}>
            <span style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, padding: '8px 0', background: CT.forest, color: CT.cream, textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Nam</span>
            <span style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, padding: '8px 0', background: 'transparent', color: CT.muted, border: `1px solid ${CT.hairline}`, textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Nữ</span>
          </div>
        </div>

        {/* Purpose */}
        <div style={{ marginTop: 22, fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>Để</div>
        <div style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink, lineHeight: 1.7 }}>
          <span style={{ fontWeight: 600, cursor: 'pointer', borderBottom: `1.5px solid ${CT.goldDeep}` }}>cưới hỏi</span>, <span style={{ cursor: 'pointer' }}>hợp tác</span>, <span style={{ cursor: 'pointer' }}>cộng sự</span>, <span style={{ cursor: 'pointer' }}>sống chung</span>
        </div>

        <button style={{ marginTop: 32, width: '100%', padding: 15, background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Xem độ hợp
        </button>
      </div>

      <CBottomNav active={1} />
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 07 · Tôi
// ═══════════════════════════════════════════════════════════════════
function CMe() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      <div style={{ flex: 1, padding: '20px 24px 100px', overflow: 'auto' }}>

        {/* ── Group 1 · Identity (compact) ── */}
        <div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26, color: CT.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{PROFILE.name}</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted }}>{PROFILE.tuoi} · mệnh {PROFILE.menh}</div>
        </div>

        {/* ── Group 2 · Lịch của tôi (the conversion hero, moved up) ── */}
        <div style={{ marginTop: 28, padding: '14px 16px', background: CT.forest, color: CT.cream }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: CT.gold, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Lịch của tôi · gói tháng</div>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 11, color: 'rgba(237,231,211,0.6)' }}>còn 339 ngày</span>
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Dùng đến 30.04.2027</div>
          <div style={{ marginTop: 12, height: 3, background: 'rgba(237,231,211,0.15)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '93%', background: CT.gold }} />
          </div>
          <button style={{ marginTop: 14, width: '100%', padding: 12, background: CT.gold, color: CT.forest, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Nâng lên lịch năm — Đinh Mùi 2027
          </button>
        </div>

        {/* ── Group 3 · Luận giải Bát tự — dedicated card ── */}
        <div style={{ marginTop: 22, padding: '14px 16px', background: '#fff', border: `1px solid ${CT.goldDeep}`, cursor: 'pointer', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: CT.goldDeep, fontSize: 14 }}>★</span>
            <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Đã mở · gói năm</Mono>
          </div>
          <div style={{ marginTop: 6, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 19, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Luận giải Bát tự năm</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>tính cách · vận năm · phong thuỷ · quý nhân</div>
          <div style={{ marginTop: 10, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: CT.goldDeep, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Đọc ngay →</div>
        </div>

        {/* ── Group 4 · Ngày sắp tới ── */}
        <div style={{ marginTop: 36, paddingTop: 22, borderTop: `1px solid ${CT.hairline}` }}>
          <Mono style={{ color: CT.muted, fontSize: 9, display: 'block', marginBottom: 6 }}>Ngày sắp tới · đã đánh dấu</Mono>
          {[
            { d: '06.06', v: 'Khai trương cửa hàng', s: 92, in: '11 ngày nữa' },
            { d: '17.06', v: 'Ký hợp đồng thuê mặt bằng', s: 85, in: '22 ngày nữa' },
            { d: '02.09', v: 'Cưới hỏi · em gái', s: 78, in: '~3 tháng' },
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

        {/* ── Group 5 · Lá số ── */}
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

        {/* ── Group 4 · Tiện ích + Cài đặt ── */}
        <div style={{ marginTop: 36, paddingTop: 22, borderTop: `1px solid ${CT.hairline}` }}>
          <Mono style={{ color: CT.muted, fontSize: 9, display: 'block', marginBottom: 4 }}>Tiện ích · cài đặt</Mono>
          {[
            ['Chuyển lịch', 'âm ↔ dương', null],
            ['Cài đặt', 'thông báo · tài khoản · hỗ trợ', null],
          ].map(([t, sub, tag], i, arr) => (
            <div key={t} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${CT.hairline2}` : 'none', cursor: 'pointer' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink, letterSpacing: '-0.005em' }}>{t}</div>
                  {tag && <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: CT.goldDeep, letterSpacing: '0.14em' }}>{tag}</span>}
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginTop: 2 }}>{sub}</div>
              </div>
              <span style={{ fontFamily: 'var(--serif)', color: CT.goldDeep, fontSize: 14 }}>›</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, fontFamily: 'var(--mono)', fontSize: 9, color: CT.muted, textAlign: 'center', letterSpacing: '0.06em' }}>
          v1.0.4 · ngaylanhthangtot.vn
        </div>
      </div>

      <CBottomNav active={2} />
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 08 · Pricing
// ═══════════════════════════════════════════════════════════════════
function CPricing() {
  const tiers = [
    { name: '1 tháng', sub: 'Chỉ lịch · dùng thử',     price: '49.000',  baseline: null,       per: '/ tháng', save: null,                 hero: false },
    { name: '6 tháng', sub: 'Chỉ lịch · người mới quen', price: '249.000', baseline: '294.000',  per: '6 tháng', save: 'tiết kiệm 15%',        hero: false },
    { name: '1 năm',   sub: 'Lịch + cả 2 luận giải',    price: '449.000', baseline: '947.000',  per: 'cả năm',  save: 'tiết kiệm 498.000đ',   hero: true  },
  ];
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      {/* Back */}
      <div style={{ padding: '6px 22px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontSize: 18, cursor: 'pointer' }}>‹</span>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted }}>Tôi · Đặt lịch</span>
      </div>

      <div style={{ flex: 1, padding: '14px 24px 30px', overflow: 'auto' }}>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 34, lineHeight: 0.98, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.015em', margin: 0 }}>
          Lịch của bạn,<br /><span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>cho cả năm.</span>
        </h1>

        {/* ════ A · GÓI LỊCH ════ */}
        <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 6, borderBottom: `1px solid ${CT.ink}` }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.goldDeep, letterSpacing: '0.18em' }}>A</span>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Gói lịch · đăng ký</span>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tiers.map((t, i) => (
            <div key={i} style={{ padding: '16px 16px', background: t.hero ? CT.forest : '#fff', color: t.hero ? CT.cream : CT.ink, border: t.hero ? `1.5px solid ${CT.gold}` : `1px solid ${CT.hairline}`, boxShadow: t.hero ? '0 12px 26px rgba(29,49,41,0.2)' : 'none', position: 'relative' }}>
              {t.hero && (
                <div style={{ position: 'absolute', top: -10, left: 14, padding: '3px 8px', background: CT.gold, color: CT.forest, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 800, letterSpacing: '0.18em' }}>★ TỐT NHẤT</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{t.name}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: t.hero ? 'rgba(237,231,211,0.65)' : CT.muted, marginTop: 3 }}>
                    {t.sub}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {t.baseline && (
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: t.hero ? 'rgba(237,231,211,0.55)' : CT.muted, textDecoration: 'line-through', textDecorationThickness: 1, marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>{t.baseline}đ</div>
                  )}
                  <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 24, color: t.hero ? CT.gold : CT.goldDeep, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em' }}>{t.price}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: t.hero ? 'rgba(237,231,211,0.65)' : CT.muted, marginTop: 4 }}>đ · {t.per}</div>
                </div>
              </div>
              {/* Hero tier — savings callout + what's included */}
              {t.hero && (
                <>
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(197,165,90,0.18)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: CT.gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t.save}</span>
                    <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, color: CT.gold }}>≈ 53% rẻ hơn</span>
                  </div>
                  <div style={{ marginTop: 10, fontFamily: 'var(--serif)', fontSize: 11.5, color: 'rgba(237,231,211,0.75)', lineHeight: 1.55 }}>
                    Gồm: Lịch <strong style={{ color: CT.cream, fontWeight: 600 }}>449k</strong> + Luận giải Bát tự <strong style={{ color: CT.cream, fontWeight: 600 }}>299k</strong> + Luận giải Tiểu Vận 2026 <strong style={{ color: CT.cream, fontWeight: 600 }}>199k</strong>
                  </div>
                </>
              )}
              {!t.hero && t.save && (
                <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 10, color: CT.goldDeep, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.save}</div>
              )}
              <button style={{ marginTop: 12, width: '100%', padding: 11, background: t.hero ? CT.gold : 'transparent', color: t.hero ? CT.forest : CT.ink, border: t.hero ? 'none' : `1px solid ${CT.goldDeep}`, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {t.hero ? 'Đặt lịch năm — 449.000đ' : 'Chọn gói này'}
              </button>
            </div>
          ))}
        </div>

        {/* What's in every plan */}
        <div style={{ marginTop: 22, fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted, lineHeight: 1.6 }}>
          Mọi gói đều có: lịch cá nhân theo lá số · trang hôm nay · tháng · tra cứu ngày tốt không giới hạn · hợp tuổi · chuyển lịch.
        </div>

        {/* ════ B · MUA LẺ LUẬN GIẢI ════ */}
        <div style={{ marginTop: 36, display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 6, borderBottom: `1px solid ${CT.ink}` }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.goldDeep, letterSpacing: '0.18em' }}>B</span>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Mua lẻ · không cần gói lịch</span>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { name: 'Luận giải Bát tự', sub: 'mệnh · tính cách · quý nhân · suốt đời', price: '299.000', per: 'một lần' },
            { name: 'Luận giải Tiểu Vận', sub: 'vận năm Bính Ngọ 2026 · phong thuỷ năm', price: '199.000', per: '1 năm' },
          ].map((r, i) => (
            <div key={i} style={{ padding: '14px 14px', background: '#fff', border: `1px solid ${CT.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink, letterSpacing: '-0.005em' }}>{r.name}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginTop: 3 }}>{r.sub}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 17, color: CT.goldDeep, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em' }}>{r.price}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 10.5, color: CT.muted, marginTop: 3 }}>đ · {r.per}</div>
              </div>
            </div>
          ))}
        </div>

        {/* The math callout — "buy both = 498k. Year plan 449k includes both + lịch" */}
        <div style={{ marginTop: 14, padding: '14px 16px', background: 'rgba(154,124,34,0.08)', borderLeft: `3px solid ${CT.goldDeep}` }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>So sánh nhanh</Mono>
          <div style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink, lineHeight: 1.6 }}>
            Mua lẻ cả 2 luận giải = <strong style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: CT.ink }}>498.000đ</strong> — nhưng <strong style={{ color: CT.ink, fontWeight: 600 }}>không có lịch</strong>.
          </div>
          <div style={{ marginTop: 6, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink2, lineHeight: 1.6 }}>
            Lịch năm <strong style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: CT.goldDeep }}>449.000đ</strong> đã bao gồm cả 2 — rẻ hơn <strong style={{ color: CT.green, fontWeight: 600 }}>49.000đ</strong> mà còn có lịch dùng cả năm.
          </div>
        </div>

        <div style={{ marginTop: 22, fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, textAlign: 'center', lineHeight: 1.7 }}>
          Thanh toán qua ZaloPay · MoMo · Thẻ<br />
          Hoàn tiền 7 ngày · không tự gia hạn
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { CSearchEntry, CSearchResult, CHopTuoi, CMe, CPricing });
