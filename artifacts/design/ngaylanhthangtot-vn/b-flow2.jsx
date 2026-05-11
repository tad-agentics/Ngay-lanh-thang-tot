/* B-flow gaps: Welcome/Sign-in, Chọn-ngày entry, Tháng calendar, Việc list, Payment confirm, Splash + BottomNav */
/* global React, useB, Ticket, Kanji, Mono, Logo, Stamp, StatusBar, HomeIndicator */
const { useState: uS } = React;

/** Splash progress bar rotation — defined here so Splash works when b-screens `LoadingResult` (which injects `spin`) has not mounted yet. */
function Flow2SplashMotionStyles() {
  return (
    <style>{`
      @keyframes flow2-splash-spin { to { transform: rotate(360deg); } }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════
// Persistent bottom nav — almanac-styled, 4 tabs + centre FAB
// Lives on the four "rooms": Hôm nay · Tháng · Sổ việc · Tôi
// ═══════════════════════════════════════════════════════════
// Outline icon set — 22px SVG. Stroke uses currentColor so active/inactive
// just changes the parent color. No emoji, no glyph trick.
const NavIcon = ({ name, size = 22 }) => {
  const s = { width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
      </svg>);
    case 'month': return (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
        <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
        <circle cx="12" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>);
    case 'book': return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M5 5h11a3 3 0 0 1 3 3v11H8a3 3 0 0 1-3-3V5z" />
        <path d="M9 9h6M9 12.5h6M9 16h4" />
      </svg>);
    case 'me': return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5" />
      </svg>);
    case 'plus': return (
      <svg viewBox="0 0 24 24" {...s} strokeWidth={2}>
        <path d="M12 5v14M5 12h14" />
      </svg>);
    default: return null;
  }
};
window.NavIcon = NavIcon;

function BottomNav({ active = 'home', onFab }) {
  const b = useB();
  const tabs = [
    { id: 'home',  ic: 'home',  vi: 'Hôm nay' },
    { id: 'month', ic: 'month', vi: 'Tháng' },
    { id: 'fab',   ic: 'plus',  vi: 'Chọn ngày', fab: true },
    { id: 'book',  ic: 'book',  vi: 'Tra cứu' },
    { id: 'me',    ic: 'me',    vi: 'Tôi' },
  ];
  const Perf = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', height: 6, alignItems: 'center', background: '#1d3129' }}>
      {Array.from({ length: 28 }).map((_, i) => (
        <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(197,165,90,0.28)' }} />
      ))}
    </div>
  );
  return (
    <div style={{ position: 'relative', background: '#1d3129', borderTop: '1px solid rgba(197,165,90,0.32)' }}>
      <Perf />
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '4px 0 6px', position: 'relative' }}>
        {tabs.map((t) => {
          // FAB cell — keeps its grid slot so the four real tabs space evenly.
          if (t.fab) {
            return (
              <div key={t.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
                {/* Label ABOVE the FAB so it can't collide with home indicator */}
                <div style={{ position: 'absolute', top: -34, fontFamily: 'var(--mono)', fontSize: 8.5, fontWeight: 700, color: b.accent, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{t.vi}</div>
                <button onClick={onFab} style={{ marginTop: -22, width: 52, height: 52, borderRadius: '50%', background: b.accent, border: 'none', boxShadow: '0 6px 14px rgba(0,0,0,0.35), 0 0 0 4px #1d3129', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d3129', cursor: 'pointer', transition: 'transform 0.12s ease' }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <NavIcon name="plus" size={24} />
                </button>
              </div>
            );
          }
          const on = t.id === active;
          return (
            <button key={t.id} style={{ flex: 1, padding: '6px 0 4px', textAlign: 'center', background: 'transparent', border: 'none', borderTop: on ? `2px solid ${b.accent}` : '2px solid transparent', marginTop: -6, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: on ? b.accent : 'rgba(212,200,154,0.5)', transition: 'color 0.15s ease' }}>
              <NavIcon name={t.ic} size={20} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, fontWeight: 700, color: on ? '#ede7d3' : '#7a9a80', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{t.vi}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
window.BottomNav = BottomNav;

function WelcomeBack() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Kanji ch="迎" size={520} style={{ position: 'absolute', top: 100, right: -150 }} />
      <StatusBar dark />
      <div style={{ padding: '24px 28px 0' }}><Logo dark size={32} /></div>
      <div style={{ flex: 1, padding: '60px 28px 0', position: 'relative' }}>
        <Mono style={{ color: b.accent }}>Chào mừng trở lại</Mono>
        <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 44, color: '#ede7d3', lineHeight: 1, margin: '14px 0 16px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Phiếu hôm nay<br /><span style={{ color: b.accent }}>đã sẵn sàng</span>
        </h1>
        <div style={{ marginTop: 32, padding: 16, border: `1px solid ${b.accent}`, background: 'rgba(197,165,90,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#a89270' }} />
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: '#ede7d3', fontSize: 16 }}>Nguyễn Thị Minh</div>
              <Mono style={{ color: b.accent, marginTop: 2, display: 'block' }}>Quý Thủy · 20/05/1990 · Mão</Mono>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
          {[['Mật khẩu', '••••••••'], ['hoặc Face ID', 'Chạm để mở khóa']].map(([l, v]) => (
            <div key={l} style={{ padding: '14px 16px', background: 'rgba(237,231,211,0.06)', border: '1px solid rgba(197,165,90,0.25)' }}>
              <Mono style={{ color: '#7a9a80' }}>{l}</Mono>
              <div style={{ color: '#ede7d3', fontFamily: 'var(--serif)', fontSize: 14, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '20px 28px 8px' }}>
        <button style={{ width: '100%', padding: 16, background: b.accent, color: '#1d3129', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mở phiếu hôm nay →</button>
        <Mono style={{ display: 'block', textAlign: 'center', color: '#7a9a80', marginTop: 12, fontSize: 9 }}>Không phải bạn? Đăng nhập tài khoản khác</Mono>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

function PickEntry() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <div style={{ padding: '4px 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 16 }}>←</span>
        <div style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: '#ede7d3' }}>Chọn ngày — việc gì?</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <Mono style={{ color: b.accent }}>26 kiểu việc · luận theo lá số của bạn</Mono>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(237,231,211,0.06)', border: '1px solid rgba(197,165,90,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', color: '#7a9a80', fontSize: 14 }}>⌕</span>
          <span style={{ color: '#7a9a80', fontFamily: 'var(--serif)', fontSize: 14 }}>Tìm việc — vd. "khai trương"</span>
        </div>

        {[
          ['Đại sự', [['Khai trương cửa hàng', 'Mở quán, công ty, dự án', 24], ['Cưới hỏi', 'Đám hỏi · đám cưới', 30], ['Nhập trạch', 'Dọn về nhà mới', 14], ['Đổ móng · động thổ', 'Khởi công xây dựng', 12], ['An táng', 'Mai táng, cải táng', 8]]],
          ['Thường gặp', [['Ký kết hợp đồng', 'Hợp đồng, giấy tờ', 18], ['Cầu tài · khai vốn', 'Đầu tư, mở vốn', 10], ['Họp mặt · đàm phán', 'Gặp đối tác, thương lượng', 6], ['Xuất hành · đi xa', 'Du lịch, công tác', 4]]],
          ['Trong nhà', [['Cắt may · chỉnh thợ', 'May đo, sửa quần áo', 6], ['Sửa bếp', 'Đặt bếp, sửa lò', 6], ['Cúng tổ tiên', 'Giỗ chạp, lễ', 4]]],
        ].map(([cat, items]) => (
          <div key={cat} style={{ marginTop: 22 }}>
            <Mono style={{ color: '#7a9a80', display: 'block', marginBottom: 8 }}>{cat}</Mono>
            <div style={{ border: '1px solid rgba(197,165,90,0.22)' }}>
              {items.map(([n, sub, cost], i) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? '1px solid rgba(197,165,90,0.18)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#ede7d3', fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 14 }}>{n}</div>
                    <div style={{ color: '#7a9a80', fontSize: 11, fontFamily: 'var(--serif)', marginTop: 2 }}>{sub}</div>
                  </div>
                  <Mono style={{ color: b.accent }}>{cost} lượng</Mono>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(197,165,90,0.2)', background: '#243a30' }}>
        <Mono style={{ color: '#7a9a80', display: 'block', marginBottom: 6 }}>Đã chọn · Khai trương cửa hàng</Mono>
        <button style={{ width: '100%', padding: 14, background: b.accent, color: '#1d3129', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tiếp — chọn khoảng ngày →</button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

function MonthCalendar() {
  const b = useB();
  const days = Array.from({ length: 35 }, (_, i) => {
    const n = i - 3;
    if (n < 1 || n > 31) return null;
    // deterministic-ish score
    const s = ((n * 7 + 11) % 60) + 30;
    return { n, s };
  });
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 16 }}>←</span>
        <div style={{ flex: 1 }}>
          <Mono style={{ color: b.accent }}>Lịch tháng · cho mệnh của bạn</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 18, color: '#ede7d3', textTransform: 'uppercase' }}>Tháng 5 · 2026</div>
        </div>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)' }}>→</span>
      </div>
      <div style={{ padding: '0 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: '#7a9a80', letterSpacing: '0.1em', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {days.map((d, i) => {
            if (!d) return <div key={i} style={{ aspectRatio: '1', opacity: 0.2 }} />;
            const tier = d.s >= 80 ? 'tot' : d.s >= 65 ? 'kha' : d.s >= 45 ? 'tb' : 'xau';
            const today = d.n === 9;
            const bg = today ? b.accent : tier === 'tot' ? 'rgba(197,165,90,0.18)' : tier === 'xau' ? 'rgba(139,26,26,0.15)' : 'rgba(237,231,211,0.04)';
            const dotC = tier === 'tot' ? b.accent : tier === 'kha' ? '#7a9a80' : tier === 'xau' ? '#8b1a1a' : '#7a7050';
            return (
              <div key={i} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, border: today ? `2px solid ${b.accent}` : '1px solid rgba(197,165,90,0.15)', padding: 4 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: today ? '#1d3129' : '#ede7d3', lineHeight: 1 }}>{d.n}</div>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: today ? '#1d3129' : dotC, marginTop: 4 }} />
                <Mono style={{ color: today ? '#1d3129' : '#7a9a80', fontSize: 8, marginTop: 2 }}>{d.s}</Mono>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, padding: '18px 16px 10px', display: 'flex', flexDirection: 'column' }}>
        <Mono style={{ color: b.accent }}>Hôm nay · 09 / 05</Mono>
        <Ticket holes={false} style={{ marginTop: 10 }} stub stubLabel="·NLTT·">
          <div style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, color: '#1d3129', textTransform: 'uppercase' }}>Thứ Bảy</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 36, color: '#1d3129', lineHeight: 0.9 }}>09/05</div>
            </div>
            <div style={{ flex: 1 }}>
              <Mono style={{ color: '#7a7050' }}>Hợp · Ký kết, cầu tài, họp mặt</Mono>
              <div style={{ fontSize: 12, color: '#3a3220', marginTop: 4, fontFamily: 'var(--serif)' }}>Giờ đẹp: Tỵ 9–11h · Mùi 13–15h</div>
            </div>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 32, color: '#9a7c22' }}>78</div>
          </div>
        </Ticket>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, fontFamily: 'var(--mono)', fontSize: 9, color: '#7a9a80', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: b.accent, marginRight: 4 }} />Tốt</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#7a9a80', marginRight: 4 }} />Khá</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#7a7050', marginRight: 4 }} />Bình</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#8b1a1a', marginRight: 4 }} />Kỵ</span>
        </div>
      </div>
      <BottomNav active="month" />
      <HomeIndicator dark />
    </div>
  );
}

function ViecList() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 16 }}>←</span>
        <div style={{ flex: 1 }}>
          <Mono style={{ color: b.accent }}>Sổ việc của tôi</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 18, color: '#ede7d3', textTransform: 'uppercase' }}>3 việc · 5 phiếu đã lưu</div>
        </div>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)' }}>+</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <Mono style={{ color: b.accent, display: 'block', marginBottom: 10 }}>Sắp tới</Mono>
        <Ticket transform="rotate(-1deg)" style={{ marginBottom: 14 }} stub stubLabel="Khai trương — đã chốt">
          <div style={{ padding: '14px 18px 8px', display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative' }}>
            <Stamp ch="吉日" style={{ position: 'absolute', top: 10, right: 12 }} />
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: '#7a7050', textTransform: 'uppercase' }}>Thứ Tư · 39 ngày nữa</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 56, color: '#1d3129', lineHeight: 0.85, marginTop: 4 }}>17/06</div>
              <Mono style={{ color: '#9a7c22', marginTop: 6, display: 'block' }}>Khai trương cửa hàng</Mono>
              <div style={{ display: 'inline-block', padding: '3px 10px', background: '#1d3129', color: b.accent, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>92 · Đại cát</div>
            </div>
          </div>
        </Ticket>

        {[
          ['Ký hợp đồng nhà', 'Trong tuần này', 'CN 17/05', 84, 'Mùi 13–15h'],
          ['Cưới em gái', 'Tháng 9 — tìm 5 ngày', '5 ứng viên', null, 'Tốt nhất: 14/09 · 88'],
        ].map(([t, range, badge, score, hour], i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(197,165,90,0.18)' }}>
            <div style={{ width: 4, alignSelf: 'stretch', background: score ? b.accent : 'rgba(197,165,90,0.4)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: '#ede7d3', fontSize: 15 }}>{t}</div>
              <Mono style={{ color: '#7a9a80', display: 'block', marginTop: 2 }}>{range}</Mono>
              <div style={{ fontSize: 12, color: '#c8bc98', marginTop: 6, fontFamily: 'var(--serif)' }}>{hour}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: b.accent, fontSize: 13 }}>{badge}</div>
              {score && <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, color: '#ede7d3', fontSize: 22, marginTop: 4 }}>{score}</div>}
            </div>
          </div>
        ))}

        <Mono style={{ color: '#7a9a80', display: 'block', marginTop: 22, marginBottom: 8 }}>Đã qua · Lưu trữ</Mono>
        {[['Họp đối tác Nhật', '15/04 · 86 đại cát'], ['Cúng tổ — giỗ ông', '02/03 · 74 cát']].map(([t, d]) => (
          <div key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed rgba(197,165,90,0.15)', opacity: 0.6 }}>
            <div style={{ color: '#ede7d3', fontFamily: 'var(--serif)', fontSize: 13 }}>{t}</div>
            <Mono style={{ color: '#7a9a80' }}>{d}</Mono>
          </div>
        ))}
      </div>
      <BottomNav active="book" />
      <HomeIndicator dark />
    </div>
  );
}

function PaymentConfirm() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 16 }}>←</span>
        <div style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: '#ede7d3' }}>Xác nhận thanh toán</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <Mono style={{ color: b.accent }}>Đơn hàng</Mono>
        <div style={{ marginTop: 8, padding: 16, border: `1px solid ${b.accent}`, background: 'rgba(197,165,90,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: '#ede7d3', textTransform: 'uppercase' }}>Gói 6 tháng</div>
              <Mono style={{ color: '#7a9a80', marginTop: 2, display: 'block' }}>600 lượng · sku <span style={{ color: b.accent }}>goi_6thang</span></Mono>
            </div>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: b.accent }}>299.000₫</div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(197,165,90,0.25)', fontSize: 12, color: '#7a9a80', fontFamily: 'var(--serif)' }}>
            Cộng dồn 20 lượng còn lại · subscription_expires_at +6 tháng
          </div>
        </div>

        <Mono style={{ color: b.accent, display: 'block', marginTop: 22, marginBottom: 8 }}>Phương thức · PayOS</Mono>
        <div style={{ border: '1px solid rgba(197,165,90,0.22)' }}>
          {[['VietQR', 'Quét bằng app ngân hàng — phổ biến', true], ['Chuyển khoản thủ công', 'Nhập nội dung mã đơn hàng', false]].map(([n, h, sel], i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderTop: i ? '1px solid rgba(197,165,90,0.18)' : 'none' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${sel ? b.accent : '#7a9a80'}`, background: sel ? b.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1d3129' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#ede7d3', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14 }}>{n}</div>
                <Mono style={{ color: '#7a9a80' }}>{h}</Mono>
              </div>
            </div>
          ))}
        </div>

        {/* VietQR preview — what PayOS returns in transfer */}
        <div style={{ marginTop: 14, padding: 14, background: '#ede7d3', display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 110, height: 110, background: '#fff', position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)' }}>
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} style={{ background: ((i * 7 + 3) % 5 < 2 || i % 13 === 0) ? '#1d3129' : 'transparent' }} />
            ))}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: '#3a3220', lineHeight: 1.6 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1d3129' }}>VietQR · Vietcombank</div>
            <div style={{ marginTop: 4 }}>STK <strong>•••• 4827</strong></div>
            <div>NLTT JSC</div>
            <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 6px', background: '#1d3129', color: b.accent, display: 'inline-block' }}>NLTT-A1B2C3</div>
          </div>
        </div>

        <div style={{ marginTop: 14, padding: '10px 12px', borderLeft: `2px solid ${b.accent}`, fontSize: 12, color: '#c8bc98', fontFamily: 'var(--serif)', lineHeight: 1.5 }}>
          Đơn hết hạn sau 15 phút · webhook PayOS sẽ tự động cộng lượng · Hủy bất cứ lúc nào trong Cài đặt
        </div>
      </div>
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(197,165,90,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <Mono style={{ color: '#7a9a80' }}>Tổng thanh toán</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 26, color: '#ede7d3' }}>299.000₫</div>
        </div>
        <button style={{ width: '100%', padding: 16, background: b.accent, color: '#1d3129', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mở app ngân hàng → quét mã</button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

function Splash() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
      <Flow2SplashMotionStyles />
      <Kanji ch="日" size={420} style={{ position: 'absolute', top: 80, left: -110, animation: 'b-drift 18s ease-in-out infinite' }} />
      <Kanji ch="月" size={320} style={{ position: 'absolute', bottom: 100, right: -80, animation: 'b-drift 22s ease-in-out infinite reverse' }} />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <img src="assets/logo-mark.svg" width={84} height={84} alt="" />
        <div style={{ marginTop: 18, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 32, color: '#ede7d3', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>Ngày Lành</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16, letterSpacing: '0.32em', color: b.accent, textTransform: 'uppercase', marginTop: 4 }}>Tháng Tốt</div>
        <div style={{ marginTop: 24, width: 100, height: 1, background: `linear-gradient(90deg, transparent, ${b.accent}, transparent)`, margin: '24px auto' }} />
        <Mono style={{ color: '#7a9a80' }}>Niên giám điện tử · 2026</Mono>
        <div style={{ marginTop: 50, fontFamily: 'var(--mono)', fontSize: 10, color: '#7a9a80', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Đang tải lá số…</div>
        <div style={{ width: 140, height: 2, background: 'rgba(197,165,90,0.2)', margin: '12px auto 0', overflow: 'hidden' }}>
          <div style={{ width: '60%', height: '100%', background: b.accent, animation: 'flow2-splash-spin 1.4s ease-in-out infinite' }} />
        </div>
      </div>
    </div>
  );
}

function InstallPrompt() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: 'linear-gradient(180deg, #2a3d54 0%, #1a2638 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      {/* Browser tab feel */}
      <div style={{ flex: 1, padding: '60px 18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
        <div style={{ width: 84, height: 84, borderRadius: 18, background: '#1d3129', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}>
          <img src="assets/logo-mark.svg" width="52" height="52" alt="" />
        </div>
        <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, color: '#fff', fontSize: 26, marginTop: 22, lineHeight: 1.1, textTransform: 'uppercase' }}>
          Cài Ngày Lành Tháng Tốt<br />lên màn hình chính
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 280, lineHeight: 1.55, fontFamily: 'system-ui', marginTop: 10 }}>
          Mở phiếu hôm nay chỉ một chạm — không cần qua trình duyệt. Hoạt động khi không có mạng.
        </p>
        <div style={{ width: '100%', maxWidth: 320, marginTop: 28, padding: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14 }}>
          {[
            ['1', 'Chạm nút Chia sẻ', '⎘'],
            ['2', 'Chọn "Thêm vào MH chính"', '+'],
            ['3', 'Chạm "Thêm" góc trên', '✓'],
          ].map(([n, t, ic]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: b.accent, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13 }}>{n}</div>
              <div style={{ flex: 1, color: '#fff', fontFamily: 'system-ui', fontSize: 14, textAlign: 'left' }}>{t}</div>
              <span style={{ color: b.accent, fontFamily: 'var(--mono)' }}>{ic}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 18px 8px' }}>
        <button style={{ width: '100%', padding: 14, background: b.accent, color: '#1d3129', border: 'none', borderRadius: 12, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Đã cài — Mở app →</button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

Object.assign(window, { WelcomeBack, PickEntry, MonthCalendar, ViecList, PaymentConfirm, Splash, InstallPrompt });
