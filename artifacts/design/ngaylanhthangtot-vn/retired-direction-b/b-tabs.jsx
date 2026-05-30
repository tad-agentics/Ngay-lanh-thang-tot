/* Tabs 4 (Tra cứu) and 5 (Tôi) — replaces the Explore sheet by folding its
   destinations into the bottom-nav. Light variant matching HomTodayLight. */
/* global React, BottomNav, Mono, Kanji, useB, Phone */

const TAB_PAPER = '#f0ece2';
const TAB_INK = '#18150e';
const TAB_GOLD = '#9a7c22';
const TAB_FOREST = '#1d3129';

function TabHeader({ title, subtitle, rightChip }) {
  return (
    <div style={{ padding: '8px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(154,124,34,0.18)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', letterSpacing: '-0.005em', color: TAB_INK }}>{title}</span>
        {subtitle && <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#7a7050', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2 }}>{subtitle}</span>}
      </div>
      {rightChip}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Tab 4 · Tra cứu (Tools + Sổ của tôi)
// ═════════════════════════════════════════════════════════════════

function TraCuuHub() {
  const b = useB();
  const tools = [
    { ic: '⚭', vi: 'Hợp tuổi', en: 'Age compatibility', sub: 'Vợ chồng · đối tác · gia đình', count: '3 lần dùng' },
    { ic: '⌂', vi: 'Phong thuỷ', en: 'Feng-shui house', sub: 'Hướng nhà · phòng · bếp', count: 'Mới' },
    { ic: '✦', vi: 'Hợp giờ', en: 'Hour finder', sub: 'Tìm giờ tốt cho 1 việc cụ thể', count: null },
    { ic: '◐', vi: 'Tiểu Vận', en: 'Yearly fortune', sub: 'Vận khí 12 tháng tới', count: null },
  ];
  const events = [
    { d: '15', m: '11', label: 'Khai trương cửa hàng', tag: 'A · 92', state: 'upcoming' },
    { d: '22', m: '11', label: 'Cưới em gái', tag: 'A · 88', state: 'upcoming' },
    { d: '04', m: '12', label: 'Ký hợp đồng', tag: 'B · 76', state: 'pending' },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: TAB_PAPER, color: TAB_INK, fontFamily: 'var(--serif)' }}>
      <TabHeader title="Tra cứu" subtitle="Công cụ · sổ ngày · việc đã chọn" />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 0 12px' }}>
        {/* Tools section */}
        <div style={{ padding: '0 22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <Mono style={{ color: TAB_GOLD }}>Công cụ tra cứu</Mono>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#7a7050', letterSpacing: '0.12em' }}>4 / 4</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {tools.map(t => (
              <button key={t.vi} style={{ background: '#fff', border: '1px solid rgba(154,124,34,0.22)', textAlign: 'left', padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', position: 'relative', minHeight: 130, fontFamily: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--display-2)', fontSize: 22, color: TAB_GOLD, lineHeight: 1 }}>{t.ic}</span>
                  {t.count && <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: t.count === 'Mới' ? '#fff' : '#7a7050', background: t.count === 'Mới' ? '#3d6b4a' : 'transparent', padding: t.count === 'Mới' ? '2px 6px' : 0, letterSpacing: '0.1em' }}>{t.count.toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '-0.005em', color: TAB_INK }}>{t.vi}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050', letterSpacing: '0.12em', marginTop: 2 }}>{t.en.toUpperCase()}</div>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: '#5a5040', lineHeight: 1.3, marginTop: 'auto' }}>{t.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hairline + events */}
        <div style={{ padding: '24px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <Mono style={{ color: TAB_GOLD }}>Sổ của tôi · việc sắp tới</Mono>
            <button style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: TAB_GOLD, letterSpacing: '0.12em', background: 'transparent', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>Xem tất cả ›</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map((e, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid rgba(154,124,34,0.22)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, textAlign: 'center', borderRight: '1px solid rgba(154,124,34,0.2)', paddingRight: 12 }}>
                  <div style={{ fontFamily: 'var(--display-2)', fontSize: 22, fontWeight: 800, color: TAB_INK, lineHeight: 1 }}>{e.d}</div>
                  <Mono style={{ color: TAB_GOLD, marginTop: 2 }}>TH {e.m}</Mono>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: TAB_INK, fontWeight: 500, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.label}</div>
                  <Mono style={{ color: '#7a7050', marginTop: 4 }}>{e.state === 'upcoming' ? 'CÒN ' + (15 - i * 3) + ' NGÀY' : 'CHƯA XÁC NHẬN'}</Mono>
                </div>
                <div style={{ background: e.tag.startsWith('A') ? TAB_FOREST : TAB_GOLD, color: e.tag.startsWith('A') ? '#ede7d3' : '#1d1810', padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>{e.tag}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved-day pile teaser */}
        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ background: '#1d3129', color: '#ede7d3', padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <Kanji ch="冊" size={120} drift style={{ position: 'absolute', right: -10, top: -20, color: 'rgba(197,165,90,0.1)' }} />
            <Mono style={{ color: '#c5a55a' }}>Sổ ngày đã chọn</Mono>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontSize: 32, fontWeight: 800, lineHeight: 1 }}>23</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 13, color: '#c8bc98' }}>ngày đã lưu trong 2026</span>
            </div>
            <button style={{ marginTop: 12, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: '#1d3129', background: '#c5a55a', border: 'none', padding: '8px 14px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>Mở sổ →</button>
          </div>
        </div>
      </div>
      <BottomNav active="book" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Tab 5 · Tôi (profile + wallet + settings)
// ═════════════════════════════════════════════════════════════════

function ToiProfile() {
  const b = useB();
  const truPills = [
    { gan: 'Quý', chi: 'Thuỷ', label: 'Năm', mau: '#3a5d8a' },
    { gan: 'Đinh', chi: 'Tỵ', label: 'Tháng', mau: '#8b4a2a' },
    { gan: 'Bính', chi: 'Tuất', label: 'Ngày', mau: '#9a7c22' },
    { gan: 'Mậu', chi: 'Tý', label: 'Giờ', mau: '#3d6b4a' },
  ];
  const settings = [
    { label: 'Thông báo', sub: '3 nhịp · 7:00 · giờ tốt · cuối tuần', val: 'Bật', on: true },
    { label: 'Ngôn ngữ luận', sub: 'Cổ điển / Hiện đại / Thực tế', val: 'Cổ điển' },
    { label: 'Hiển thị chữ Hán', sub: 'Trên thẻ ngày và phiếu tear-off', val: 'Có' },
    { label: 'Đồng bộ iCloud', sub: 'Sao lưu sổ ngày + lá số', val: 'Bật', on: true },
    { label: 'Riêng tư', sub: 'Lá số chỉ trên máy của bạn', val: '›' },
    { label: 'Hỗ trợ · Liên hệ', sub: 'Phản hồi · báo lỗi', val: '›' },
    { label: 'Đăng xuất', sub: null, val: '›', danger: true },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: TAB_PAPER, color: TAB_INK, fontFamily: 'var(--serif)' }}>
      <TabHeader title="Tôi" subtitle="Hồ sơ · ví lượng · cài đặt" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Identity card — dark forest, 4-trụ pillars */}
        <div style={{ margin: '16px 22px 0', background: TAB_FOREST, color: '#ede7d3', padding: '18px 18px 16px', position: 'relative', overflow: 'hidden' }}>
          <Kanji ch="我" size={180} drift style={{ position: 'absolute', right: -30, top: -40, color: 'rgba(197,165,90,0.08)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#a89270', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: TAB_FOREST }}>NM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>Nguyễn Thị Minh</div>
              <Mono style={{ color: '#c5a55a', marginTop: 4, display: 'block' }}>QUÝ THUỶ · 20/05/1990 · MÃO</Mono>
            </div>
            <button style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#c5a55a', background: 'transparent', border: '1px solid rgba(197,165,90,0.4)', padding: '5px 9px', letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase' }}>Sửa</button>
          </div>
          {/* Four pillars */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed rgba(197,165,90,0.25)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {truPills.map((p, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '6px 0' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(200,188,152,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{p.label}</div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: '#ede7d3', marginTop: 4 }}>{p.gan}</div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: '#c5a55a' }}>{p.chi}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet — lượng balance */}
        <div style={{ padding: '18px 22px 0' }}>
          <Mono style={{ color: TAB_GOLD, marginBottom: 8, display: 'block' }}>Ví lượng</Mono>
          <div style={{ background: '#fff', border: '1px solid rgba(154,124,34,0.22)', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 36, color: TAB_INK, lineHeight: 1 }}>20</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 14, color: '#7a7050' }}>lượng</span>
              </div>
              <Mono style={{ color: '#7a7050', marginTop: 4, display: 'block' }}>~10 LẦN CHỌN NGÀY · KHÔNG HẾT HẠN</Mono>
            </div>
            <button style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', color: '#ede7d3', background: TAB_FOREST, border: 'none', padding: '12px 16px', cursor: 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Mua thêm →</button>
          </div>
          {/* Recent activity */}
          <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(154,124,34,0.06)', borderLeft: `3px solid ${TAB_GOLD}` }}>
            <Mono style={{ color: '#7a7050' }}>Hoạt động gần nhất</Mono>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                ['11/05', 'Chọn ngày · Khai trương', '−2'],
                ['08/05', 'Mua gói 30 lượng', '+30'],
                ['05/05', 'Chọn ngày · Cưới em gái', '−2'],
              ].map(([d, l, n], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--serif)', fontSize: 12, color: TAB_INK }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#7a7050', width: 38, letterSpacing: '0.04em' }}>{d}</span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: n.startsWith('+') ? '#3d6b4a' : '#8b1a1a' }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings list */}
        <div style={{ padding: '20px 22px 16px' }}>
          <Mono style={{ color: TAB_GOLD, marginBottom: 8, display: 'block' }}>Cài đặt</Mono>
          <div style={{ background: '#fff', border: '1px solid rgba(154,124,34,0.22)' }}>
            {settings.map((s, i) => (
              <button key={i} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'transparent', border: 'none', borderTop: i ? '1px solid rgba(154,124,34,0.15)' : 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 13.5, fontWeight: 500, color: s.danger ? '#8b1a1a' : TAB_INK, lineHeight: 1.2 }}>{s.label}</div>
                  {s.sub && <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050', letterSpacing: '0.1em', marginTop: 3, textTransform: 'uppercase' }}>{s.sub}</div>}
                </div>
                {s.on != null ? (
                  <div style={{ width: 30, height: 18, borderRadius: 9, background: s.on ? '#3d6b4a' : '#d8d0bb', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: s.on ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.18)', transition: 'left 0.15s ease' }} />
                  </div>
                ) : (
                  <span style={{ fontFamily: s.val === '›' ? 'var(--serif)' : 'var(--mono)', fontSize: s.val === '›' ? 18 : 10.5, color: s.danger ? '#8b1a1a' : (s.val === '›' ? '#7a7050' : TAB_GOLD), letterSpacing: s.val === '›' ? 0 : '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>{s.val}</span>
                )}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Ngày Lành Tháng Tốt · v2.4 · 2026</div>
        </div>
      </div>
      <BottomNav active="me" />
    </div>
  );
}

// ─── Notes for the canvas row ───
function TabsNotes() {
  return (
    <div style={{ padding: '40px 56px', background: '#f1ece1', height: '100%', fontFamily: 'var(--serif)', color: '#18150e', overflow: 'auto', position: 'relative' }}>
      <div style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a7c22', borderBottom: '1px solid #c5a55a', paddingBottom: 4, marginBottom: 18 }}>Row 6 · Nav refresh — folded surfaces</div>
      <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 28, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.01em' }}>Explore Sheet → folded into 5-tab nav</h2>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#3a3424', marginBottom: 14 }}>The original prototype had an Explore bottom-sheet behind a swipe-up gesture. VN super-app users (Zalo, Momo, MB Bank) don't expect hidden gestures — drawer/sheet patterns are Western convention. This row reassigns Explore's 7 destinations to natural homes inside the 5-tab + FAB structure, with no sheet and no long-press.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 22 }}>
        <div>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', color: '#9a7c22', marginBottom: 8 }}>Tab 4 · Tra cứu</div>
          <ul style={{ fontSize: 13.5, lineHeight: 1.55, paddingLeft: 18, color: '#3a3424', margin: 0 }}>
            <li><strong>Công cụ</strong> — Hợp tuổi, Phong thuỷ, Hợp giờ, Tiểu Vận. Two-up grid, 130px tall cards.</li>
            <li><strong>Sổ của tôi · việc sắp tới</strong> — list of upcoming chosen days with A/B verdict pill.</li>
            <li><strong>Sổ ngày đã chọn</strong> — forest CTA card, opens full saved-day archive.</li>
          </ul>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#7a7050', letterSpacing: '0.12em', marginTop: 12, textTransform: 'uppercase' }}>Renamed from "Sổ việc" — broader scope now (lookup tools + records).</div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', color: '#9a7c22', marginBottom: 8 }}>Tab 5 · Tôi</div>
          <ul style={{ fontSize: 13.5, lineHeight: 1.55, paddingLeft: 18, color: '#3a3424', margin: 0 }}>
            <li><strong>Identity card</strong> — avatar + 4 trụ pillars (Năm/Tháng/Ngày/Giờ), forest bg.</li>
            <li><strong>Ví lượng</strong> — balance + Mua thêm CTA + 3-line activity log.</li>
            <li><strong>Cài đặt</strong> — 7-row settings list with toggles + chevrons + danger row.</li>
          </ul>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#7a7050', letterSpacing: '0.12em', marginTop: 12, textTransform: 'uppercase' }}>Replaces the old Cài đặt + Mua lượng routes — both fold here.</div>
        </div>
      </div>
      <div style={{ marginTop: 24, padding: 14, background: '#fff', border: '1px solid rgba(154,124,34,0.22)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: '#9a7c22', textTransform: 'uppercase', marginBottom: 8 }}>Mapping</div>
        <table style={{ width: '100%', fontSize: 12.5, color: '#3a3424', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['Hôm nay', 'Tab 1 (already there)'],
              ['Lịch tháng', 'Tab 2 (already there)'],
              ['Tuần này', 'Tab 2 → Tuần / Tháng segmented control'],
              ['Chọn ngày', 'FAB (already there)'],
              ['Hợp tuổi', 'Tab 4 · Công cụ'],
              ['Phong thuỷ', 'Tab 4 · Công cụ'],
              ['Mua lượng', 'Tab 5 · Ví → "Mua thêm" CTA'],
              ['Cài đặt', 'Tab 5 · Cài đặt section'],
            ].map(([a, b], i) => (
              <tr key={i} style={{ borderTop: i ? '1px solid rgba(154,124,34,0.12)' : 'none' }}>
                <td style={{ padding: '6px 8px 6px 0', fontFamily: 'var(--mono)', fontSize: 11, color: '#7a7050', letterSpacing: '0.06em' }}>{a}</td>
                <td style={{ padding: '6px 0' }}>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { TraCuuHub, ToiProfile, TabsNotes, ApiMergeNotes });

function ApiMergeNotes() {
  const rows = [
    ['20 · Hôm nay (API)', '07 · Hôm nay (light)', 'Hoàng Đạo verdict pill, Sao/Trực/Hành line, 6-hour grid, Đại Vận strip — all already represented in screen 07. Removed.'],
    ['21 · Pick-result (API)', '11 · Pick-result (light)', 'Layer-3 breakdown rows + verdict line live in screen 11. Removed.'],
    ['27 · Hồ sơ gia đình', 'Tab 5 · Tôi (Row 5)', 'Tab 5 covers the current user. Multi-profile family manager is genuinely net-new — but it lived as a misplaced "API re-skin" in Row 2b. Removed here; will rehome under Row 5/6 as a dedicated profile-manager artboard.'],
    ['28 · Share landing', 'Row 2 · Share Card', 'Sender-side share already in Row 2. The recipient-view differences (no auth, generic chrome) collapse into props on the same component. Removed.'],
  ];
  return (
    <div style={{ padding: '40px 56px', background: '#f1ece1', height: '100%', fontFamily: 'var(--serif)', color: '#18150e', overflow: 'auto', position: 'relative' }}>
      <div style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a7c22', borderBottom: '1px solid #c5a55a', paddingBottom: 4, marginBottom: 18 }}>Row 2b · Merge notes for FE handoff</div>
      <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 28, lineHeight: 1.1, margin: '0 0 14px', letterSpacing: '-0.01em' }}>4 dark API phones retired — production light is canonical</h2>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#3a3424', marginBottom: 18 }}>Row 2b was originally built as data-shape reference: dark, dense, every API field exposed. After Row 2 (production light) absorbed those fields, the dark twins became confusing — FE asked "which is canonical?". This row is now scoped to <strong>net-new surfaces only</strong> (Hợp tuổi, Phong thuỷ, Tiểu Vận, Chuyển lịch, Errors) — every screen here has no Row 2 counterpart and IS the spec.</p>
      <div style={{ background: '#fff', border: '1px solid rgba(154,124,34,0.22)', marginTop: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', padding: '10px 14px', borderBottom: '1px solid rgba(154,124,34,0.22)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: '#9a7c22', textTransform: 'uppercase', gap: 12 }}>
          <span>Retired</span><span>Canonical home</span><span>Why merged</span>
        </div>
        {rows.map(([a, b, c], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', padding: '12px 14px', borderTop: i ? '1px solid rgba(154,124,34,0.12)' : 'none', gap: 12, fontSize: 13, lineHeight: 1.45 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#7a7050', letterSpacing: '0.04em' }}>{a}</span>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: '#1d3129' }}>{b}</span>
            <span style={{ color: '#3a3424' }}>{c}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, padding: 14, background: 'rgba(154,124,34,0.06)', borderLeft: '3px solid #9a7c22' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: '#9a7c22', textTransform: 'uppercase', marginBottom: 6 }}>FE rule of thumb</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>If a screen has both a Row 2 (light) and a Row 2b (dark) version → ship the Row 2 visual, take the API field list from the Row 2b notes header. If a screen exists only in Row 2b → it's the canonical spec.</div>
      </div>
    </div>
  );
}
