/* B refresh — light-default Hôm nay, Pick result, Sổ việc + Mua lượng v2 + Habit v2 (tiết khí wheel)
   Globals: React, useB, LogoMark, Mono, Kanji, Stamp, ScoreCounter, StatusBar, HomeIndicator */
/* global React, useB, LogoMark, Mono, Kanji, Stamp, ScoreCounter, StatusBar, HomeIndicator */
const { useState: rUseState, useEffect: rUseEffect } = React;

// ═══════════════════════════════════════════════════════════════════════════
// Light-mode shell — paper-default app chrome
// ═══════════════════════════════════════════════════════════════════════════

function LightShell({ children, title, subtitle, rightChip, scrollable = true, back = false, onBack, onClose }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f0ece2', color: '#18150e', fontFamily: 'var(--serif)' }}>
      <StatusBar />
      {back ? (
        <div style={{ borderBottom: '1px solid rgba(154,124,34,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
          <div style={{ flex: 1 }}><BackBar subtitle={subtitle} title={title} onBack={onBack || (() => {})} onClose={onClose} /></div>
          {rightChip && <div style={{ paddingBottom: 8 }}>{rightChip}</div>}
        </div>
      ) : (
        <div style={{ padding: '8px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(154,124,34,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={26} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{title}</span>
              {subtitle && <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#7a7050', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{subtitle}</span>}
            </div>
          </div>
          {rightChip}
        </div>
      )}
      <div style={{ flex: 1, overflow: scrollable ? 'auto' : 'hidden', position: 'relative' }}>{children}</div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Hôm nay — light default
// Forest is now an accent: status pill, primary button, score ring fill
// ═══════════════════════════════════════════════════════════════════════════

function HomTodayLight() {
  const luongChip = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#fff', border: '1px solid rgba(154,124,34,0.35)', borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9a7c22' }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: '#18150e' }}>20 lượng</span>
    </div>
  );
  return (
    <LightShell title="Hôm nay" subtitle="T2 · 11/05/2026 · Bính Tuất" rightChip={luongChip}>
      {/* Today verdict — the primary glance */}
      <div style={{ padding: '20px 22px 8px' }}>
        <Mono style={{ color: '#9a7c22' }}>Phán định cho hôm nay</Mono>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 12, padding: '20px 22px', background: '#1d3129', color: '#ede7d3', borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
          <Kanji ch="吉" size={140} drift style={{ position: 'absolute', right: -20, top: -20, color: 'rgba(197,165,90,0.10)', WebkitTextStroke: '1px rgba(197,165,90,0.10)' }} />
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 48, color: '#c5a55a', lineHeight: 0.9 }}>HOÀNG ĐẠO</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(237,231,211,0.75)', marginTop: 4, lineHeight: 1.5 }}>Trực <strong style={{ color: '#c5a55a' }}>Định</strong> · Sao tốt: Thiên Đức, Nguyệt Đức · Sao xấu: —</div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['Khai trương', 'Ký kết', 'Đính hôn'].map(k => (
                <span key={k} style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(197,165,90,0.18)', border: '1px solid rgba(197,165,90,0.35)', fontSize: 11, color: '#c5a55a', letterSpacing: '0.04em' }}>{k}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Best hour band — 6 hoàng đạo + giờ xấu line */}
      <div style={{ padding: '14px 22px 8px' }}>
        <Mono style={{ color: '#7a7050' }}>Giờ tốt — 6 hoàng đạo</Mono>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
          {[['Tý', '23–01', '★★★'], ['Sửu', '01–03', '★★'], ['Thìn', '07–09', '★★★★'], ['Tỵ', '09–11', '★★★'], ['Mùi', '13–15', '★★'], ['Thân', '15–17', '★★★']].map(([t, h, s]) => (
            <div key={t} style={{ background: '#fff', border: '1px solid rgba(154,124,34,0.2)', borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, color: '#18150e', textTransform: 'uppercase' }}>{t}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: '#7a7050', marginTop: 2 }}>{h}</div>
              <div style={{ fontSize: 9, color: '#c5a55a', marginTop: 4 }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mono style={{ color: '#8b1a1a' }}>Giờ xấu</Mono>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['Dần', '03–05'], ['Ngọ', '11–13']].map(([t, h]) => (
              <div key={t} style={{ padding: '4px 8px', border: '1px solid rgba(139,26,26,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, color: '#8b1a1a' }}>{t}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050' }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal layer — Đại Vận band */}
      <div style={{ padding: '14px 22px 8px' }}>
        <div style={{ background: '#fff', border: '1px solid rgba(154,124,34,0.2)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Mono style={{ color: '#9a7c22' }}>Đại Vận của bạn · 32 → 41</Mono>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#7a7050' }}>Năm thứ 3</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: '#18150e', letterSpacing: '0.02em' }}>Giáp Dần · Mộc</span>
          </div>
          <div style={{ fontSize: 12, color: '#3a3220', lineHeight: 1.55, marginTop: 6 }}>
            Mộc vượng thuận lợi cho khởi đầu mới. Hôm nay <strong>tương sinh</strong> — nên chốt việc đã chuẩn bị lâu.
          </div>
        </div>
      </div>

      {/* Suggested actions */}
      <div style={{ padding: '14px 22px 24px' }}>
        <Mono style={{ color: '#7a7050' }}>3 ngày lành sắp tới</Mono>
        <div style={{ marginTop: 10 }}>
          {[['T6 15/05', 'Khai trương', '92'], ['CN 17/05', 'Ký kết', '88'], ['T3 19/05', 'Cưới hỏi', '85']].map(([d, k, s], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid rgba(154,124,34,0.18)', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: '#9a7c22', minWidth: 64 }}>{s}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#7a7050', marginTop: 2 }}>{d}</div>
              </div>
              <span style={{ color: '#9a7c22', fontSize: 18 }}>→</span>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', marginTop: 6, padding: '14px', background: '#1d3129', color: '#ede7d3', border: 'none', borderRadius: 10, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>+ Chọn ngày cho việc khác</button>
      </div>
    </LightShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Pick result — light default
// ═══════════════════════════════════════════════════════════════════════════

function PickResultLight() {
  const luongChip = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#fff', border: '1px solid rgba(154,124,34,0.35)', borderRadius: 999 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: '#18150e' }}>14 lượng</span>
    </div>
  );
  const days = [
    { d: 'T6', date: '15/05', score: 92, grade: 'A', ly: 'Trục Định · Thiên Đức · giờ Thìn 7–9h' },
    { d: 'CN', date: '17/05', score: 88, grade: 'A', ly: 'Trực Thành · Nguyệt Đức · giờ Tỵ 9–11h' },
    { d: 'T3', date: '19/05', score: 85, grade: 'B+', ly: 'Trục Khai · giờ Mùi 13–15h' },
    { d: 'T5', date: '21/05', score: 78, grade: 'B', ly: 'Trục Bình · giờ Thân 15–17h' },
    { d: 'T7', date: '23/05', score: 72, grade: 'B', ly: 'Trục Mãn · giờ Dậu 17–19h' },
  ];
  return (
    <LightShell title="Khai trương" subtitle="30 ngày · 5 ngày lành" rightChip={luongChip}>
      <div style={{ padding: '16px 22px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Mono style={{ color: '#9a7c22' }}>Kết quả · sắp xếp theo điểm</Mono>
          <button style={{ background: 'transparent', border: 'none', fontFamily: 'var(--mono)', fontSize: 10, color: '#7a7050', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Lọc ▾</button>
        </div>
      </div>
      {days.map((day, i) => (
        <div key={i} style={{ margin: '10px 22px', background: '#fff', border: '1px solid rgba(154,124,34,0.22)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* Left: date + score */}
            <div style={{ width: 96, background: i === 0 ? '#1d3129' : '#f5efe2', color: i === 0 ? '#ede7d3' : '#18150e', padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em' }}>{day.d}</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{day.date.split('/')[0]}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, opacity: 0.7 }}>tháng {day.date.split('/')[1]}</div>
              <div style={{ height: 1, width: '70%', background: i === 0 ? 'rgba(197,165,90,0.5)' : 'rgba(154,124,34,0.3)', margin: '4px 0' }} />
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: i === 0 ? '#c5a55a' : '#9a7c22' }}>{day.score}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, opacity: 0.7 }}>/100</div>
            </div>
            {/* Right: reasoning */}
            <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 28, height: 22, padding: '0 8px', borderRadius: 4, background: i === 0 ? '#9a7c22' : 'rgba(154,124,34,0.15)', color: i === 0 ? '#ede7d3' : '#9a7c22', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.05em' }}>{day.grade}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#7a7050', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{i === 0 ? 'Đề cử nhất' : `Lựa chọn ${i + 1}`}</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#3a3220', lineHeight: 1.55, marginTop: 8 }}>{day.ly}</div>
              {i === 0 && (
                <button style={{ marginTop: 10, padding: '6px 12px', background: '#1d3129', color: '#ede7d3', border: 'none', borderRadius: 6, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Lưu vào sổ →</button>
              )}
            </div>
          </div>
        </div>
      ))}
      {/* Bulk unlock CTA */}
      <div style={{ margin: '14px 22px 8px', padding: '14px 16px', background: 'rgba(154,124,34,0.08)', border: '1px dashed rgba(154,124,34,0.4)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>Mở chi tiết cả 5 ngày</div>
            <div style={{ fontSize: 11, color: '#7a7050', marginTop: 2 }}>Luận sao tốt/xấu, giờ tốt cụ thể, kiêng kỵ</div>
          </div>
          <button style={{ padding: '8px 12px', background: '#9a7c22', color: '#ede7d3', border: 'none', borderRadius: 6, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>4 lượng × 5</button>
        </div>
      </div>
      <div style={{ padding: '8px 22px 24px' }}>
        <button style={{ width: '100%', padding: '12px', background: 'transparent', color: '#9a7c22', border: '1px solid rgba(154,124,34,0.4)', borderRadius: 10, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Chia sẻ ngày lành ↗</button>
      </div>
    </LightShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Sổ việc — light default (saved tasks list)
// ═══════════════════════════════════════════════════════════════════════════

function ViecListLight() {
  const items = [
    { ev: 'Khai trương quán', d: 'T6 15/05', state: 'sắp tới', score: 92, days: 4 },
    { ev: 'Ký hợp đồng nhà', d: 'CN 17/05', state: 'sắp tới', score: 88, days: 6 },
    { ev: 'Đính hôn em gái', d: 'T7 23/05', state: 'sắp tới', score: 85, days: 12 },
    { ev: 'Chuyển bàn thờ', d: 'T2 25/05', state: 'sắp tới', score: 81, days: 14 },
    { ev: 'Xuất hành công tác', d: 'T2 04/05', state: 'đã qua', score: 78, days: -7 },
    { ev: 'Cắt tóc trả lễ', d: 'CN 03/05', state: 'đã qua', score: 72, days: -8 },
  ];
  const upcoming = items.filter(i => i.state === 'sắp tới');
  const past = items.filter(i => i.state === 'đã qua');
  const tabBtn = (label, active) => (
    <button key={label} style={{ flex: 1, padding: '10px 0', background: active ? '#1d3129' : 'transparent', color: active ? '#ede7d3' : '#7a7050', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 8 }}>{label}</button>
  );
  return (
    <LightShell title="Sổ việc" subtitle="6 việc · 4 sắp tới">
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(154,124,34,0.08)', borderRadius: 10 }}>
          {tabBtn('Sắp tới · 4', true)}
          {tabBtn('Đã qua · 2', false)}
        </div>
      </div>
      <div style={{ padding: '14px 22px 8px' }}>
        <Mono style={{ color: '#7a7050' }}>Sắp xếp theo ngày gần nhất</Mono>
      </div>
      {upcoming.map((it, i) => (
        <div key={i} style={{ margin: '8px 22px', background: '#fff', border: '1px solid rgba(154,124,34,0.22)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: it.days <= 5 ? '#9a7c22' : 'rgba(154,124,34,0.3)' }} />
          <div style={{ padding: '14px 16px 14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ minWidth: 56, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 28, color: '#18150e', lineHeight: 1 }}>{it.days}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>còn ngày</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: '#18150e', textTransform: 'uppercase' }}>{it.ev}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#7a7050' }}>{it.d}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(122,112,80,0.4)' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9a7c22', fontWeight: 600 }}>{it.score}/100</span>
              </div>
            </div>
            <span style={{ color: '#9a7c22', fontSize: 18 }}>→</span>
          </div>
        </div>
      ))}
      <div style={{ padding: '14px 22px 8px' }}>
        <Mono style={{ color: '#7a7050' }}>Đã qua · 2</Mono>
      </div>
      {past.map((it, i) => (
        <div key={i} style={{ margin: '6px 22px', padding: '10px 14px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(154,124,34,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.75 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 12, color: '#3a3220', textTransform: 'uppercase' }}>{it.ev}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#7a7050', marginTop: 2 }}>{it.d} · {it.score}/100</div>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050', letterSpacing: '0.1em', textTransform: 'uppercase' }}>cách {Math.abs(it.days)} ngày</span>
        </div>
      ))}
      <div style={{ padding: '14px 22px 24px' }}>
        <button style={{ width: '100%', padding: '14px', background: '#1d3129', color: '#ede7d3', border: 'none', borderRadius: 10, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>+ Thêm việc mới</button>
      </div>
    </LightShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Habit v2 — Tiết Khí lunar wheel (replaces streak-flame Duolingo trope)
// 24 tiết khí of the year, current marker, "đại vận năm nay" arc
// ═══════════════════════════════════════════════════════════════════════════

const TIET_KHI_24 = [
  ['立春','Lập Xuân','04/02'], ['雨水','Vũ Thuỷ','19/02'], ['驚蟄','Kinh Trập','06/03'], ['春分','Xuân Phân','21/03'],
  ['清明','Thanh Minh','05/04'], ['穀雨','Cốc Vũ','20/04'], ['立夏','Lập Hạ','06/05'], ['小滿','Tiểu Mãn','21/05'],
  ['芒種','Mang Chủng','06/06'], ['夏至','Hạ Chí','21/06'], ['小暑','Tiểu Thử','07/07'], ['大暑','Đại Thử','23/07'],
  ['立秋','Lập Thu','08/08'], ['處暑','Xử Thử','23/08'], ['白露','Bạch Lộ','08/09'], ['秋分','Thu Phân','23/09'],
  ['寒露','Hàn Lộ','08/10'], ['霜降','Sương Giáng','23/10'], ['立冬','Lập Đông','08/11'], ['小雪','Tiểu Tuyết','22/11'],
  ['大雪','Đại Tuyết','07/12'], ['冬至','Đông Chí','22/12'], ['小寒','Tiểu Hàn','06/01'], ['大寒','Đại Hàn','20/01'],
];

function TietKhiWheel({ currentIdx = 7, size = 280, daysVisited = 18 }) {
  // currentIdx = Tiểu Mãn
  const r = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <defs>
        <radialGradient id="wheelGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1d3129" />
          <stop offset="100%" stopColor="#0d1f17" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r + 12} fill="url(#wheelGrad)" />
      {/* outer ring */}
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="#c5a55a" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke="#9a7c22" strokeWidth="0.5" opacity="0.6" />
      {/* progress arc — daysVisited / 365 */}
      {(() => {
        const frac = daysVisited / 365;
        const start = -Math.PI / 2;
        const end = start + frac * Math.PI * 2;
        const ax = cx + Math.cos(start) * (r + 4);
        const ay = cy + Math.sin(start) * (r + 4);
        const bx = cx + Math.cos(end) * (r + 4);
        const by = cy + Math.sin(end) * (r + 4);
        const large = frac > 0.5 ? 1 : 0;
        return <path d={`M ${ax} ${ay} A ${r + 4} ${r + 4} 0 ${large} 1 ${bx} ${by}`} stroke="#c5a55a" strokeWidth="3.5" fill="none" strokeLinecap="round" />;
      })()}
      {/* tiết khí marks */}
      {TIET_KHI_24.map(([cn, vn], i) => {
        const angle = -Math.PI / 2 + (i / 24) * Math.PI * 2;
        const x1 = cx + Math.cos(angle) * (r - 6);
        const y1 = cy + Math.sin(angle) * (r - 6);
        const x2 = cx + Math.cos(angle) * (r + 4);
        const y2 = cy + Math.sin(angle) * (r + 4);
        const tx = cx + Math.cos(angle) * (r - 22);
        const ty = cy + Math.sin(angle) * (r - 22);
        const isCurrent = i === currentIdx;
        const isPast = i < currentIdx;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isCurrent ? '#c5a55a' : isPast ? '#9a7c22' : 'rgba(197,165,90,0.35)'} strokeWidth={isCurrent ? 2.5 : 1} />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif SC', serif" fontWeight="700" fontSize={isCurrent ? 14 : 10} fill={isCurrent ? '#c5a55a' : isPast ? 'rgba(197,165,90,0.7)' : 'rgba(197,165,90,0.3)'}>{cn}</text>
          </g>
        );
      })}
      {/* current marker — large dot at outer edge */}
      {(() => {
        const angle = -Math.PI / 2 + (currentIdx / 24) * Math.PI * 2;
        const x = cx + Math.cos(angle) * (r + 4);
        const y = cy + Math.sin(angle) * (r + 4);
        return (
          <g>
            <circle cx={x} cy={y} r="6" fill="#c5a55a" />
            <circle cx={x} cy={y} r="10" fill="none" stroke="#c5a55a" strokeWidth="1" opacity="0.5" />
          </g>
        );
      })()}
      {/* center label */}
      <text x={cx} y={cy - 16} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" letterSpacing="2" fill="rgba(197,165,90,0.7)">TIẾT KHÍ HIỆN TẠI</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="800" fontSize="22" fill="#ede7d3">TIỂU MÃN</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="rgba(237,231,211,0.5)">{daysVisited} / 365 ngày · {Math.round(daysVisited / 365 * 100)}%</text>
    </svg>
  );
}

function HabitTietKhi() {
  return (
    <div style={{ height: '100%', background: '#0e1c14', color: '#ede7d3', display: 'flex', flexDirection: 'column', fontFamily: 'var(--serif)' }}>
      <StatusBar dark />
      <BackBar dark subtitle="Năm Bính Ngọ · 2026" title="Hành trình" onBack={() => {}} />
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Hero — wheel itself */}
        <TietKhiWheel currentIdx={7} daysVisited={18} size={300} />
        {/* Caption */}
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Mono style={{ color: '#c5a55a' }}>Bạn đang ở Tiểu Mãn — kỳ thứ 8</Mono>
          <p style={{ fontSize: 13, color: 'rgba(237,231,211,0.78)', lineHeight: 1.6, marginTop: 6, maxWidth: 280 }}>
            <strong>Mầm đã thành hạt</strong>, chưa đầy nhưng đã chắc. Tháng này thuận lợi cho việc <strong style={{ color: '#c5a55a' }}>củng cố</strong> hơn là khởi sự mới.
          </p>
        </div>
        {/* Mini stats — anchored to lunar/solar units, not generic streaks */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
          {[['18', 'ngày đã ghé'], ['8 / 24', 'tiết khí'], ['6', 'phiếu đã lưu']].map(([n, l]) => (
            <div key={l} style={{ background: 'rgba(197,165,90,0.06)', border: '1px solid rgba(197,165,90,0.18)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: '#c5a55a' }}>{n}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(237,231,211,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Next milestone */}
        <div style={{ marginTop: 18, width: '100%', padding: '14px 16px', background: 'rgba(197,165,90,0.06)', border: '1px solid rgba(197,165,90,0.2)', borderRadius: 12 }}>
          <Mono style={{ color: '#c5a55a' }}>Sắp tới · Mang Chủng</Mono>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14 }}>06/06 · còn 26 ngày</div>
              <div style={{ fontSize: 11, color: 'rgba(237,231,211,0.65)', marginTop: 2 }}>Lúa đã ngậm sữa — kỳ gieo cuối</div>
            </div>
          </div>
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Mua lượng v2 — anchored math, social proof, PayOS recovery
// ═══════════════════════════════════════════════════════════════════════════

function MuaLuongV2() {
  const luongChip = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#fff', border: '1px solid rgba(154,124,34,0.35)', borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9a7c22' }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: '#18150e' }}>3 lượng còn</span>
    </div>
  );
  const [sel, setSel] = rUseState(1);
  const packs = [
    { luong: 10, price: '29.000₫', perL: '2.900đ', picks: '~5 lần chọn ngày', save: null, badge: null },
    { luong: 30, price: '79.000₫', perL: '2.633đ', picks: '~15 lần chọn ngày', save: '−9%', badge: 'PHỔ BIẾN' },
    { luong: 100, price: '249.000₫', perL: '2.490đ', picks: '~50 lần chọn ngày · cả gia đình', save: '−14%', badge: null },
  ];
  return (
    <LightShell back onClose={() => {}} title="Mua lượng" subtitle="Trả 1 lần · không tự gia hạn" rightChip={luongChip}>
      {/* Anchored math hero — "1 lượt chọn ngày = 2 lượng" */}
      <div style={{ padding: '18px 22px 8px' }}>
        <div style={{ background: '#1d3129', color: '#ede7d3', borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <Kanji ch="兩" size={120} drift style={{ position: 'absolute', right: -10, top: -16, color: 'rgba(197,165,90,0.1)', WebkitTextStroke: '1px rgba(197,165,90,0.1)' }} />
          <Mono style={{ color: '#c5a55a' }}>Một lượt chọn ngày</Mono>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 36, color: '#c5a55a' }}>2</span>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase' }}>lượng</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(237,231,211,0.78)', marginTop: 4, lineHeight: 1.55, position: 'relative' }}>
            Quẹt 1 sự kiện trong 30 ngày · <strong style={{ color: '#c5a55a' }}>+ 4 lượng</strong> mở luận chi tiết · Lá số chi tiết một lần <strong style={{ color: '#c5a55a' }}>10 lượng</strong>
          </div>
        </div>
      </div>

      {/* Pack picker */}
      <div style={{ padding: '14px 22px 8px' }}>
        <Mono style={{ color: '#9a7c22' }}>Chọn gói lượng</Mono>
      </div>
      {packs.map((p, i) => (
        <button key={i} onClick={() => setSel(i)}
          style={{ width: 'calc(100% - 44px)', margin: '6px 22px', padding: '14px 16px', background: sel === i ? '#fff' : 'rgba(255,255,255,0.5)', border: sel === i ? '2px solid #9a7c22' : '1px solid rgba(154,124,34,0.22)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer', position: 'relative' }}>
          {p.badge && (
            <span style={{ position: 'absolute', top: -8, left: 16, padding: '2px 8px', background: '#9a7c22', color: '#ede7d3', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', borderRadius: 3 }}>{p.badge}</span>
          )}
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${sel === i ? '#9a7c22' : 'rgba(154,124,34,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {sel === i && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9a7c22' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: '#18150e' }}>{p.luong}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#7a7050', letterSpacing: '0.14em', textTransform: 'uppercase' }}>lượng</span>
              {p.save && <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: '#9a7c22', fontWeight: 700, letterSpacing: '0.06em' }}>{p.save}</span>}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#7a7050', marginTop: 2 }}>{p.picks}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: '#9a7c22' }}>{p.price}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050', marginTop: 1 }}>{p.perL}/lượng</div>
          </div>
        </button>
      ))}

      {/* Social proof — single, real-feeling */}
      <div style={{ margin: '14px 22px 0', padding: '12px 14px', background: 'rgba(154,124,34,0.06)', borderLeft: '3px solid #9a7c22', borderRadius: '0 8px 8px 0' }}>
        <Mono style={{ color: '#9a7c22' }}>Người vừa mua · 2 phút trước</Mono>
        <div style={{ fontSize: 12, color: '#3a3220', marginTop: 4, lineHeight: 1.55, fontStyle: 'italic' }}>
          "Mua gói 30 cho cả nhà — bố mẹ chọn ngày tân gia, mình chọn ngày cưới." — <strong>chị Mai, Q.7</strong>
        </div>
      </div>

      {/* Trust band */}
      <div style={{ padding: '14px 22px 8px', display: 'flex', gap: 14, fontSize: 11, color: '#7a7050' }}>
        <span>✓ PayOS · ngân hàng VN</span>
        <span>✓ Lượng không hết hạn</span>
      </div>

      {/* Primary CTA */}
      <div style={{ padding: '8px 22px 14px' }}>
        <button style={{ width: '100%', padding: '16px', background: '#1d3129', color: '#ede7d3', border: 'none', borderRadius: 12, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: '0 8px 18px rgba(29,49,41,0.25)' }}>
          Thanh toán {packs[sel].price} →
        </button>
        <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: '#7a7050', marginTop: 8, letterSpacing: '0.12em', textTransform: 'uppercase' }}>QR · ATM · Internet Banking</div>
      </div>

      {/* Recovery banner — visible when payment failed/cancelled */}
      <div style={{ margin: '8px 22px 24px', padding: '12px 14px', background: 'rgba(179,74,58,0.08)', border: '1px dashed rgba(179,74,58,0.4)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 22, color: '#b34a3a', lineHeight: 1 }}>!</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: '#b34a3a', textTransform: 'uppercase' }}>Lần trước hủy giữa chừng?</div>
          <div style={{ fontSize: 11.5, color: '#3a3220', marginTop: 2, lineHeight: 1.5 }}>Không trừ tiền nếu bạn chưa hoàn tất ở PayOS. <span style={{ color: '#9a7c22', textDecoration: 'underline' }}>Xem hướng dẫn ↗</span></div>
        </div>
      </div>
    </LightShell>
  );
}

Object.assign(window, { HomTodayLight, PickResultLight, ViecListLight, HabitTietKhi, MuaLuongV2, TietKhiWheel });
