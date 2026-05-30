/* Direction C — screens part E. PICKS + flow extras.
   Pick loading · Share sender · Sổ list (with items) · Hợp tuổi result */
/* global React, useB, Logo, LogoMark, Mono, StatusBar, HomeIndicator,
   CT, PROFILE, CBackBar, CBottomNav, CSegmented, scoreDot */

// ═══════════════════════════════════════════════════════════════════
// PICKS · Loading — "Đang tìm ngày tốt cho mệnh của bạn"
// ═══════════════════════════════════════════════════════════════════
function CPickLoading() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px', textAlign: 'center', gap: 24 }}>
        {/* Calendar-leaf-flip illustration: 3 stacked paper rectangles, top one rotating */}
        <div style={{ position: 'relative', width: 100, height: 110 }}>
          <div style={{ position: 'absolute', top: 6, left: 6, width: 88, height: 100, background: '#e1d8b8', boxShadow: '0 6px 12px rgba(0,0,0,0.06)' }} />
          <div style={{ position: 'absolute', top: 3, left: 3, width: 88, height: 100, background: '#e8dec1', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 88, height: 100, background: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '5px 0 0', textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 9, color: CT.muted }}>Tháng 6 · 2026</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 56, color: CT.red, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', animation: 'c-flip-num 1.6s ease-in-out infinite' }}>06</span>
            </div>
          </div>
          <style>{`
            @keyframes c-flip-num {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; transform: translateY(-2px) scale(0.97); }
            }
          `}</style>
        </div>

        <div>
          <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: '0.22em' }}>Đang tìm ngày tốt</Mono>
          <p style={{ marginTop: 10, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Khai trương cửa hàng
          </p>
          <p style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.muted, lineHeight: 1.55, maxWidth: 280 }}>
            Đối chiếu 31 ngày với lá số tứ trụ của bạn — vài giây nữa thôi.
          </p>
        </div>

        <div style={{ width: 200, height: 1.5, background: 'rgba(154,124,34,0.18)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '70%', background: CT.goldDeep }} />
        </div>
      </div>

      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PICKS · Share sender — user composes message for sharing the day
// ═══════════════════════════════════════════════════════════════════
function CShareSender() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Gửi cho cả nhà" right={<span style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.goldDeep, cursor: 'pointer' }}>Xem trước</span>} />

      <div style={{ flex: 1, padding: '4px 22px 28px', overflow: 'auto' }}>
        {/* The phiếu preview thumbnail */}
        <div style={{ display: 'flex', gap: 12, padding: '14px', background: '#fff', border: `1px solid ${CT.hairline}`, alignItems: 'center' }}>
          <div style={{ width: 56, padding: '10px 0', background: CT.paperWarm, textAlign: 'center', flexShrink: 0, border: `1px solid ${CT.hairline}` }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: CT.red, lineHeight: 1 }}>06</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 9, color: CT.muted, marginTop: 2 }}>Th 06</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Phiếu chọn ngày</Mono>
            <div style={{ marginTop: 2, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13.5, color: CT.ink, letterSpacing: '-0.005em', textTransform: 'uppercase' }}>Khai trương cửa hàng</div>
            <div style={{ marginTop: 3, fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>Thứ Bảy · ngày Kỷ Tỵ · điểm 92</div>
          </div>
        </div>

        {/* Personal message */}
        <div style={{ marginTop: 24 }}>
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Lời nhắn của bạn</Mono>
          <textarea
            defaultValue="Anh chị xem ngày khai trương quán em chọn — 06.06 hợp mệnh em nhất."
            style={{ width: '100%', marginTop: 6, padding: '12px 14px', minHeight: 84, background: '#fff', border: `1px solid ${CT.goldDeep}`, outline: 'none', fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink, lineHeight: 1.5, resize: 'none' }}
          />
        </div>

        {/* Share channels */}
        <div style={{ marginTop: 22 }}>
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Gửi qua</Mono>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { name: 'Zalo',      ic: 'Z', bg: '#0068ff', fg: '#fff' },
              { name: 'Messenger', ic: 'M', bg: '#0084ff', fg: '#fff' },
              { name: 'Email',     ic: '@', bg: CT.forest,  fg: CT.gold },
              { name: 'Sao link',  ic: '⎘', bg: CT.forest,  fg: CT.gold },
            ].map(p => (
              <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px', background: '#fff', border: `1px solid ${CT.hairline}`, cursor: 'pointer' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.bg, color: p.fg, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.ic}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: CT.muted, letterSpacing: '0.06em' }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Link preview */}
        <div style={{ marginTop: 22, padding: '12px 14px', background: 'rgba(154,124,34,0.05)', borderLeft: `2px solid ${CT.goldDeep}`, fontFamily: 'var(--serif)', fontSize: 12, color: CT.ink2, lineHeight: 1.5 }}>
          Người nhận sẽ thấy phiếu công khai và có thể tự lập lịch của mình. Link không yêu cầu đăng nhập.
        </div>

        <div style={{ marginTop: 14, padding: '10px 14px', background: '#fff', border: `1px dashed ${CT.hairline}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, color: CT.muted, letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ngaylanhthangtot.vn/p/0042-khai-truong</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.goldDeep, cursor: 'pointer', letterSpacing: '0.06em' }}>Sao</span>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PICKS · Sổ list — full history of saved days
// ═══════════════════════════════════════════════════════════════════
function CSoList() {
  const groups = [
    {
      label: 'Tháng 6 · 2026 — sắp tới',
      items: [
        { d: '06.06', wd: 'T7', v: 'Khai trương cửa hàng', s: 92, hl: true },
        { d: '17.06', wd: 'T4', v: 'Ký hợp đồng thuê mặt bằng', s: 85 },
      ],
    },
    {
      label: 'Tháng 7 — 9 · 2026',
      items: [
        { d: '14.07', wd: 'T3', v: 'Họp với nhà cung cấp', s: 78 },
        { d: '02.09', wd: 'T4', v: 'Cưới hỏi · em gái', s: 78 },
        { d: '23.09', wd: 'T4', v: 'Mua xe máy', s: 72 },
      ],
    },
    {
      label: 'Đã qua',
      items: [
        { d: '12.05', wd: 'T3', v: 'Xuất hành đi Đà Lạt', s: 80, past: true },
        { d: '03.04', wd: 'T6', v: 'Chuyển nhà', s: 88, past: true },
      ],
    },
  ];
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Sổ ngày đã chọn" right={<span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.goldDeep, cursor: 'pointer' }}>+ Tra cứu</span>} />

      <div style={{ flex: 1, padding: '4px 22px 100px', overflow: 'auto' }}>
        {/* Summary */}
        <div style={{ marginTop: 6, marginBottom: 22, fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted, lineHeight: 1.5 }}>
          <strong style={{ color: CT.ink, fontWeight: 600 }}>7 ngày</strong> đã lưu — 5 sắp tới, 2 đã qua
        </div>

        {groups.map((g, gi) => (
          <div key={gi} style={{ marginTop: gi > 0 ? 26 : 0 }}>
            <Mono style={{ color: CT.muted, fontSize: 9, display: 'block', marginBottom: 4 }}>{g.label}</Mono>
            {g.items.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < g.items.length - 1 ? `1px solid ${CT.hairline2}` : 'none', alignItems: 'center', cursor: 'pointer', opacity: r.past ? 0.6 : 1 }}>
                <div style={{ minWidth: 52 }}>
                  <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: r.hl ? CT.red : CT.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{r.d.split('.')[0]}</div>
                  <Mono style={{ color: CT.muted, fontSize: 8.5, marginTop: 4 }}>Th {r.d.split('.')[1]} · {r.wd}</Mono>
                </div>
                <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink, lineHeight: 1.4 }}>{r.v}</div>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: scoreDot(r.s), fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.005em' }}>{r.s}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TOOLS · Hợp tuổi result — compatibility score breakdown
// ═══════════════════════════════════════════════════════════════════
function CHopTuoiResult() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Hợp tuổi · kết quả" right={<span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.goldDeep, cursor: 'pointer' }}>Lưu</span>} />

      <div style={{ flex: 1, padding: '6px 22px 100px', overflow: 'auto' }}>
        {/* Pair */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <div style={{ flex: 1, padding: '10px 12px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink, letterSpacing: '-0.005em' }}>{PROFILE.name}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted, marginTop: 3 }}>Canh Ngọ · mệnh Thủy</div>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: CT.goldDeep }}>×</span>
          <div style={{ flex: 1, padding: '10px 12px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink, letterSpacing: '-0.005em' }}>Trần Văn Hùng</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted, marginTop: 3 }}>Mậu Thìn · mệnh Mộc</div>
          </div>
        </div>

        {/* Big score */}
        <div style={{ marginTop: 26, textAlign: 'center' }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: '0.22em' }}>Độ hợp · cưới hỏi</Mono>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 96, color: CT.goldDeep, lineHeight: 0.85, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>82</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 16, color: CT.muted }}>/100</span>
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Hợp tốt</div>
          <p style={{ marginTop: 8, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, color: CT.ink2, lineHeight: 1.55, maxWidth: 320, margin: '8px auto 0' }}>
            "Thủy sinh Mộc — bạn nuôi dưỡng anh ấy. Cặp đôi này thuận lợi cho cuộc sống chung dài hạn."
          </p>
        </div>

        {/* Breakdown sections */}
        <div style={{ marginTop: 28 }}>
          {[
            { t: 'Thiên Can', v: 'Canh × Mậu — không xung không hợp', s: '+18' },
            { t: 'Địa Chi', v: 'Ngọ × Thìn — tam hợp Mộc cục', s: '+26' },
            { t: 'Ngũ Hành', v: 'Thủy sinh Mộc — tương sinh', s: '+24' },
            { t: 'Niên Mệnh', v: 'Thủy × Mộc — tốt', s: '+14' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${CT.hairline2}` : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13.5, color: CT.ink, letterSpacing: '-0.005em', textTransform: 'uppercase' }}>{r.t}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.ink2, marginTop: 3, lineHeight: 1.45 }}>{r.v}</div>
              </div>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: CT.goldDeep, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{r.s}</span>
            </div>
          ))}
        </div>

        {/* Suggestion */}
        <div style={{ marginTop: 22, padding: '14px 14px', background: 'rgba(154,124,34,0.06)', borderLeft: `2px solid ${CT.goldDeep}` }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Có sẵn với gói lịch · gợi ý tiếp theo</Mono>
          <div style={{ marginTop: 6, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink, lineHeight: 1.55 }}>
            Tra cứu <strong style={{ fontWeight: 600 }}>ngày tốt cho lễ cưới</strong> theo cả hai mệnh — sẽ chấm điểm chéo Canh Ngọ × Mậu Thìn.
          </div>
          <button style={{ marginTop: 12, padding: '8px 14px', background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Tra cứu ngày cưới →
          </button>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { CPickLoading, CShareSender, CSoList, CHopTuoiResult });
