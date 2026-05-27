/* Direction C — canvas assembly. Strategy artboards + full PWA flow (10 bands). */
/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   BProvider, MotionStyles, Phone,
   CSplash, CHomePage, CMonthSpread, CSearchEntry, CSearchResult, CHopTuoi, CMe, CPricing,
   CAuthChooser, CSignup, CBirthTime, CBuildingCalendar, CReveal,
   CDayDetail, CEmptySo, CSharePublic, CPayConfirm, CPaySuccess,
   CInstallBanner, CEmailLogin, CForgotPwReq, CForgotPwSent, COAuthCallback,
   CPickLoading, CShareSender, CSoList, CHopTuoiResult,
   CPhongThuy, CTieuVan, CChuyenLich, CEditProfile,
   CAITyped, CAISectioned, CLaSoFull, CBaziReadingFull,
   CBaziLocked, CPayConfirmStandalone, CPaySuccessStandalone, CMeLocked,
   CSettings, CNotifPerm, CNoDatesFound, CPayFailure, CSubExpired, CConfirmDialog, COfflineHome,
   CT, CBottomNav, IconCalendar, IconSearch, IconUser */

const C_TONE = {
  paper: '#f1ece1', ink: '#18150e', ink2: '#3a3220', muted: '#7a7050',
  forest: '#1d3129', cream: '#ede7d3', gold: '#c5a55a', goldDeep: '#9a7c22',
};

const KICKER = { fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C_TONE.goldDeep };
const H_NOTE = { fontFamily: 'var(--serif)', fontSize: 14, color: C_TONE.ink2, lineHeight: 1.55 };

// ─── Reasoning card ─────────────────────────────────────────────────
function CReasoningCard() {
  return (
    <div style={{ padding: '38px 48px', background: C_TONE.paper, height: '100%', overflow: 'auto', position: 'relative' }}>
      <div style={{ ...KICKER, display: 'inline-block', borderBottom: `1px solid ${C_TONE.gold}`, paddingBottom: 4 }}>Direction C · pivot brief</div>
      <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 56, lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-0.015em', color: C_TONE.ink, margin: '14px 0 10px' }}>
        Lịch ngày lành <span style={{ color: C_TONE.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>cho riêng bạn.</span>
      </h1>
      <p style={{ ...H_NOTE, maxWidth: 760, marginTop: 4 }}>
        Direction B đóng gói sản phẩm là <strong>tool</strong> — "AI chọn ngày tốt". User đến khi cần, đi khi xong.
        Direction C đóng gói thành <strong>vật phẩm sở hữu cả năm</strong> — như cuốn lịch vạn niên trên tường nhà,
        nhưng cá nhân hoá theo lá số tứ trụ của bạn.
      </p>

      {/* Why this works — three pillars */}
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {[
          ['Mental model có sẵn', 'Mỗi nhà Việt Nam đã có một cuốn lịch tờ. Không cần dạy user khái niệm gì mới — chỉ làm cuốn lịch đó cá nhân hơn.'],
          ['Mua theo năm là ritual sẵn có', 'Người Việt vốn đã quen mua lịch cuối năm. Subscription năm = mental model có sẵn, không bị bán "phần mềm".'],
          ['LTV cao hơn nhiều', 'Tool dùng-khi-cần = thấp. "Lịch của tôi" = ritual hằng ngày, vào hằng tuần để check, giữ chân tốt.'],
        ].map(([t, d]) => (
          <div key={t} style={{ padding: '16px 18px', background: '#fff', border: `1px solid rgba(154,124,34,0.18)` }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, color: C_TONE.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>{t}</div>
            <div style={{ ...H_NOTE, fontSize: 13, marginTop: 8 }}>{d}</div>
          </div>
        ))}
      </div>

      {/* What changes — table */}
      <div style={{ marginTop: 30 }}>
        <div style={KICKER}>Hậu quả thiết kế</div>
        <div style={{ marginTop: 10, background: '#fff', border: `1px solid rgba(154,124,34,0.2)` }}>
          {[
            ['Tâm điểm', 'Pick wedge (FAB)', 'Trang lịch của bạn (Tab 1)'],
            ['Home tab', '"Hôm nay" — daily horoscope cảm giác', '"Trang hôm nay" — như tờ lịch bóc, bạn lật mỗi sáng'],
            ['BottomNav', '5 tabs · 1 FAB', '3 tabs · không FAB'],
            ['Tool tabs', 'Tab 4 "Tra cứu" có 4 công cụ riêng', 'Tab 2 "Tra cứu" gộp Pick + Hợp tuổi · 3 tool còn lại chôn trong Tab 3'],
            ['Pricing', 'Mua "lượng" — micro-tx 49k/89k/749k', 'Đặt lịch — gói tháng/6 tháng/năm · gói NĂM là hero'],
            ['Onboarding', '3 màn riêng + auth gate', 'Giữ — chính đáng vì cần lá số để cá nhân hoá'],
            ['Phiếu', 'Default surface — mọi kết quả', 'Chỉ khi share/in — không còn là centerpiece'],
          ].map(([k, a, b], i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.2fr 1.2fr', borderTop: i ? '1px solid rgba(154,124,34,0.12)' : 'none' }}>
              <div style={{ padding: '11px 16px', borderRight: '1px solid rgba(154,124,34,0.12)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em', color: C_TONE.goldDeep, textTransform: 'uppercase' }}>{k}</div>
              <div style={{ padding: '11px 16px', borderRight: '1px solid rgba(154,124,34,0.12)', fontFamily: 'var(--serif)', fontSize: 13, color: C_TONE.muted, lineHeight: 1.4, textDecoration: 'line-through', textDecorationColor: 'rgba(122,112,80,0.4)' }}>{a}</div>
              <div style={{ padding: '11px 16px', fontFamily: 'var(--serif)', fontSize: 13, color: C_TONE.ink, lineHeight: 1.4 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(154,124,34,0.08)', borderLeft: `3px solid ${C_TONE.goldDeep}`, fontFamily: 'var(--serif)', fontSize: 13, color: C_TONE.ink2, lineHeight: 1.5 }}>
        <strong style={{ fontFamily: 'var(--display-2)', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.06em', color: C_TONE.goldDeep }}>Net surface area:</strong> ~20 màn (từ 30) · giảm 1/3 · mỗi màn cá nhân hơn.
      </div>
    </div>
  );
}

// ─── IA map — 5-tab → 3-tab ─────────────────────────────────────────
function CIAMap() {
  const Old = (
    <div>
      <div style={{ ...KICKER, color: C_TONE.muted }}>Direction B · cũ</div>
      <div style={{ marginTop: 10, padding: '14px 16px', background: 'rgba(122,112,80,0.06)', border: '1px dashed rgba(122,112,80,0.3)' }}>
        {[
          ['Tab 1', 'Hôm nay', 'PickFirstHome — wedge home'],
          ['Tab 2', 'Tháng', 'Calendar'],
          ['FAB', 'Chọn ngày', 'Pick wedge · oversized gold disc'],
          ['Tab 4', 'Tra cứu', 'Hợp tuổi + 3 tools'],
          ['Tab 5', 'Tôi', 'Identity + Ví lượng + Sổ'],
        ].map(([k, t, d], i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: i ? '1px solid rgba(122,112,80,0.15)' : 'none', fontFamily: 'var(--serif)', fontSize: 13, color: C_TONE.muted, textDecoration: 'line-through', textDecorationColor: 'rgba(122,112,80,0.3)' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C_TONE.muted, minWidth: 40, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
            <span style={{ minWidth: 100, fontFamily: 'var(--display-2)', fontWeight: 700, color: C_TONE.muted, textTransform: 'uppercase', fontSize: 12.5 }}>{t}</span>
            <span>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const New = (
    <div>
      <div style={KICKER}>Direction C · mới</div>
      <div style={{ marginTop: 10, padding: '14px 16px', background: '#fff', border: `1px solid ${C_TONE.gold}` }}>
        {/* Tab 1 */}
        <div style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C_TONE.goldDeep, minWidth: 40, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 2 }}>Tab 1</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: C_TONE.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Lịch</div>
            <div style={{ marginTop: 4, paddingLeft: 12, borderLeft: `2px solid ${C_TONE.gold}` }}>
              <div style={{ ...H_NOTE, fontSize: 12.5 }}><strong>[Hôm nay]</strong> &nbsp;Trang lịch tờ — như bóc 1 trang lịch bloc</div>
              <div style={{ ...H_NOTE, fontSize: 12.5 }}><strong>[Tháng]</strong> &nbsp;Spread cả tháng, mỗi ngày chấm điểm theo mệnh</div>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: 'rgba(154,124,34,0.15)', margin: '8px 0' }} />
        {/* Tab 2 */}
        <div style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C_TONE.goldDeep, minWidth: 40, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 2 }}>Tab 2</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: C_TONE.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Tra cứu</div>
            <div style={{ marginTop: 4, paddingLeft: 12, borderLeft: `2px solid ${C_TONE.gold}` }}>
              <div style={{ ...H_NOTE, fontSize: 12.5 }}><strong>[Ngày tốt cho việc...]</strong> &nbsp;Pick wedge — 26 việc, nhập khoảng thời gian</div>
              <div style={{ ...H_NOTE, fontSize: 12.5 }}><strong>[Hợp tuổi]</strong> &nbsp;So tuổi 2 người · cưới, cộng sự, sống chung</div>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: 'rgba(154,124,34,0.15)', margin: '8px 0' }} />
        {/* Tab 3 */}
        <div style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C_TONE.goldDeep, minWidth: 40, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 2 }}>Tab 3</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: C_TONE.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Tôi</div>
            <div style={{ marginTop: 4, paddingLeft: 12, borderLeft: `2px solid ${C_TONE.gold}` }}>
              <div style={{ ...H_NOTE, fontSize: 12.5 }}>Lá số tứ trụ · Lịch của tôi (hạn dùng)</div>
              <div style={{ ...H_NOTE, fontSize: 12.5 }}>Tiện ích: <em>Luận giải Bát tự năm · Chuyển lịch</em> · Cài đặt</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '38px 48px', background: C_TONE.paper, height: '100%', overflow: 'auto' }}>
      <div style={KICKER}>Information architecture</div>
      <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 38, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.01em', color: C_TONE.ink, margin: '8px 0 22px' }}>
        5 tabs + FAB &nbsp;→&nbsp; <span style={{ color: C_TONE.goldDeep }}>3 tabs</span>
      </h2>
      <p style={{ ...H_NOTE, maxWidth: 760, marginBottom: 22 }}>
        Không bỏ tính năng nào — chỉ gộp đúng chỗ. Mỗi tab cũ vẫn có nhà mới rõ ràng.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>{Old}{New}</div>
    </div>
  );
}

// ─── Language map ───────────────────────────────────────────────────
function CLanguageMap() {
  const rows = [
    ['Mở quẻ — 30 giây', 'Lập lịch của bạn'],
    ['Niên giám điện tử', 'Lịch riêng cho mệnh của bạn'],
    ['Phiếu chọn ngày', 'Trang lịch · ngày bạn chọn'],
    ['Hôm nay (Tab 1)', 'Trang hôm nay'],
    ['Mua lượng', 'Đặt lịch năm / 6 tháng / tháng'],
    ['Bạn còn 47 lượng', 'Lịch của bạn dùng đến 30.04.2027'],
    ['Lập lá số', 'Lập lịch (gồm: nhập ngày giờ sinh)'],
    ['Pick wedge', 'Tra cứu ngày tốt cho việc...'],
  ];
  return (
    <div style={{ padding: '38px 48px', background: C_TONE.paper, height: '100%', overflow: 'auto' }}>
      <div style={KICKER}>Re-language</div>
      <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 38, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.01em', color: C_TONE.ink, margin: '8px 0 22px' }}>
        Mọi nơi đều nói <span style={{ color: C_TONE.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>"lịch"</span>.
      </h2>
      <p style={{ ...H_NOTE, maxWidth: 760 }}>
        User không "dùng app" — họ <strong>mở lịch của mình</strong>. Mỗi câu copy đều phải gắn vào metaphor cuốn lịch tờ.
      </p>

      <div style={{ marginTop: 22, background: '#fff', border: '1px solid rgba(154,124,34,0.2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 16px', background: 'rgba(154,124,34,0.06)', borderBottom: '1px solid rgba(154,124,34,0.18)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', color: C_TONE.goldDeep, textTransform: 'uppercase' }}>
          <span>Cũ</span><span>Mới</span>
        </div>
        {rows.map(([a, b], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '12px 16px', borderTop: i ? '1px solid rgba(154,124,34,0.1)' : 'none', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 14, color: C_TONE.muted, textDecoration: 'line-through', textDecorationColor: 'rgba(122,112,80,0.4)' }}>{a}</span>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: C_TONE.ink, letterSpacing: '-0.005em' }}>{b}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22, padding: '12px 16px', background: 'rgba(29,49,41,0.06)', borderLeft: `3px solid ${C_TONE.forest}`, fontFamily: 'var(--serif)', fontSize: 13, color: C_TONE.ink2, lineHeight: 1.55 }}>
        Một câu duy nhất nên cảm: <em>"Lịch của tôi — của riêng tôi, dùng cả năm."</em> &nbsp;Tránh "quyển lịch" theo yêu cầu — chỉ nói <strong>"lịch"</strong>.
      </div>
    </div>
  );
}

// ─── Bottom nav close-up artboard ─────────────────────────────────
function CNavCloseup() {
  return (
    <div style={{ padding: '38px 48px', background: C_TONE.paper, height: '100%' }}>
      <div style={KICKER}>BottomNav · close-up</div>
      <h3 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, textTransform: 'uppercase', letterSpacing: '-0.01em', color: C_TONE.ink, margin: '6px 0 20px' }}>3 tabs · floating pill</h3>
      {/* Light variant */}
      <div style={{ position: 'relative', width: 380, height: 92, background: '#f4ecd9', border: '1px dashed rgba(154,124,34,0.3)' }}>
        <CBottomNav active={0} />
      </div>
      <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: C_TONE.muted, textTransform: 'uppercase' }}>Trên paper · Tab 1 active</div>

      {/* Dark variant */}
      <div style={{ marginTop: 22, position: 'relative', width: 380, height: 92, background: '#1d3129' }}>
        <CBottomNav active={1} dark />
      </div>
      <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: C_TONE.muted, textTransform: 'uppercase' }}>Trên forest · Tab 2 active</div>

      <div style={{ marginTop: 28, ...H_NOTE, fontSize: 13, maxWidth: 460 }}>
        Mỗi tab có internal segmented control (Lịch: <strong>[Hôm nay | Tháng]</strong>; Tra cứu: <strong>[Ngày tốt cho việc | Hợp tuổi]</strong>) — không cần thêm tab cấp 1.
      </div>
    </div>
  );
}

// ─── App root ───────────────────────────────────────────────────────
// ─── Flow map artboard — visualizes the 9 bands of full PWA flow ───
function CFlowMap() {
  const bands = [
    { id: 'LAUNCH',     n: 2, kind: 'mixed', screens: ['Splash', 'Install banner'] },
    { id: 'AUTH',       n: 6, kind: 'dark',  screens: ['Chooser', 'Email login', 'Quên mật khẩu', 'Đã gửi link', 'OAuth callback', 'Lập lịch (signup)'] },
    { id: 'FIRST RUN',  n: 3, kind: 'dark',  screens: ['Giờ sinh', 'Đang dựng lịch', 'Lịch đã mở'] },
    { id: 'DAILY LOOP', n: 3, kind: 'mixed', screens: ['Hôm nay (lịch tờ)', 'Tháng (grid)', 'Chi tiết một ngày'] },
    { id: 'LUẬN GIẢI',  n: 4, kind: 'light', screens: ['Luận AI streaming', 'Luận có nguồn', 'Lá số chi tiết', 'Luận Bát tự năm'] },
    { id: 'PICKS',      n: 3, kind: 'light', screens: ['Tra cứu', 'Đang tìm', 'Kết quả'] },
    { id: 'TOOLS',      n: 3, kind: 'light', screens: ['Hợp tuổi', 'Hợp tuổi · kết quả', 'Chuyển lịch'] },
    { id: 'COMMERCE',   n: 3, kind: 'mixed', screens: ['Đặt lịch (pricing)', 'Xác nhận thanh toán', 'Thành công'] },
    { id: 'ACCOUNT',    n: 2, kind: 'light', screens: ['Tôi', 'Sửa hồ sơ'] },
  ];
  const total = bands.reduce((s, b) => s + b.n, 0);
  return (
    <div style={{ padding: '38px 48px', background: C_TONE.paper, height: '100%', overflow: 'auto' }}>
      <div style={KICKER}>Full flow · 9 băng · {total} màn</div>
      <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 38, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.01em', color: C_TONE.ink, margin: '8px 0 8px' }}>
        Lưu đồ toàn bộ PWA
      </h2>
      <p style={{ ...H_NOTE, maxWidth: 760, marginBottom: 22 }}>
        9 băng theo thứ tự user thường đi: launch → auth → first run → daily loop. Từ daily loop, user nhảy vào luận giải AI, tra cứu, tools, commerce, hoặc account.
      </p>
      <div style={{ background: '#fff', border: `1px solid rgba(154,124,34,0.18)` }}>
        {bands.map((b, i) => (
          <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '120px 50px 1fr', alignItems: 'baseline', padding: '14px 18px', borderTop: i ? '1px solid rgba(154,124,34,0.1)' : 'none', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: C_TONE.ink, letterSpacing: '-0.005em' }}>{b.id}</div>
              <Mono style={{ color: C_TONE.muted, fontSize: 9, marginTop: 3 }}>{b.kind}</Mono>
            </div>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: C_TONE.goldDeep, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{b.n}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: C_TONE.ink2, lineHeight: 1.5 }}>{b.screens.join(' · ')}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, padding: '14px 16px', background: 'rgba(154,124,34,0.06)', borderLeft: `3px solid ${C_TONE.goldDeep}`, fontFamily: 'var(--serif)', fontSize: 13, color: C_TONE.ink2, lineHeight: 1.55 }}>
        So với Direction B (30 màn trong 8 băng): C có <strong>{total} màn trong 9 băng</strong>. Băng <strong>LUẬN GIẢI</strong> tách riêng (LLM streaming + có nguồn + lá số chi tiết). FAB đã bỏ — mọi tính năng đều có nhà trong 3-tab nav.
      </div>
    </div>
  );
}

// ─── App root ───────────────────────────────────────────────────────
function App() {
  return (
    <>
      <MotionStyles />
      <BProvider value={{ perforation: 'classic', kanjiDensity: 0.08, accent: '#c5a55a', accentDeep: '#9a7c22', tone: 'modern', density: 'default' }}>
        <DesignCanvas defaultZoom={0.5} title="Direction C" subtitle='"Lịch ngày lành cho riêng bạn" · full PWA flow'>

          <DCSection id="brief" title="0 · Pivot brief" subtitle="Tại sao reposition + hậu quả thiết kế">
            <DCArtboard id="c-brief" label="Brief" width={1200} height={760}>
              <CReasoningCard />
            </DCArtboard>
          </DCSection>

          <DCSection id="ia" title="1 · IA map" subtitle="5-tab+FAB → 3-tab consolidation">
            <DCArtboard id="c-ia" label="Information architecture" width={1200} height={720}>
              <CIAMap />
            </DCArtboard>
            <DCArtboard id="c-nav" label="BottomNav close-up" width={520} height={620}>
              <CNavCloseup />
            </DCArtboard>
          </DCSection>

          <DCSection id="lang" title="2 · Language map" subtitle="Mọi copy đều phải nói 'lịch'">
            <DCArtboard id="c-lang" label="Re-language table" width={900} height={780}>
              <CLanguageMap />
            </DCArtboard>
          </DCSection>

          <DCSection id="flowmap" title="3 · Lưu đồ toàn bộ" subtitle="9 băng · ~34 màn — mở rộng bên dưới">
            <DCArtboard id="c-flowmap" label="Flow map" width={1100} height={760}>
              <CFlowMap />
            </DCArtboard>
          </DCSection>

          <DCSection id="launch" title="4 · LAUNCH" subtitle="Splash · Install banner">
            <DCArtboard id="c-splash" label="01 · Splash" width={420} height={830}>
              <Phone dark><CSplash /></Phone>
            </DCArtboard>
            <DCArtboard id="c-install" label="02 · Install banner (iOS A2HS)" width={420} height={830}>
              <Phone><CInstallBanner /></Phone>
            </DCArtboard>
          </DCSection>

          <DCSection id="auth" title="5 · AUTH" subtitle="Chooser · Email login · Quên mật khẩu · OAuth callback · Signup">
            <DCArtboard id="c-chooser" label="03 · Chooser" width={420} height={830}>
              <Phone dark><CAuthChooser /></Phone>
            </DCArtboard>
            <DCArtboard id="c-emaillogin" label="04 · Email login (returning)" width={420} height={830}>
              <Phone dark><CEmailLogin /></Phone>
            </DCArtboard>
            <DCArtboard id="c-fpreq" label="05 · Quên mật khẩu" width={420} height={830}>
              <Phone dark><CForgotPwReq /></Phone>
            </DCArtboard>
            <DCArtboard id="c-fpsent" label="06 · Đã gửi link" width={420} height={830}>
              <Phone dark><CForgotPwSent /></Phone>
            </DCArtboard>
            <DCArtboard id="c-oauth" label="07 · OAuth callback" width={420} height={830}>
              <Phone dark><COAuthCallback /></Phone>
            </DCArtboard>
            <DCArtboard id="c-signup" label="08 · Lập lịch · bước 1 (signup)" width={420} height={830}>
              <Phone dark><CSignup /></Phone>
            </DCArtboard>
          </DCSection>

          <DCSection id="firstrun" title="6 · FIRST RUN" subtitle="Lập lịch bước 2 → reveal">
            <DCArtboard id="c-birthtime" label="09 · Giờ sinh — 12 canh" width={420} height={830}>
              <Phone dark><CBirthTime /></Phone>
            </DCArtboard>
            <DCArtboard id="c-building" label="10 · Đang dựng lịch" width={420} height={830}>
              <Phone dark><CBuildingCalendar /></Phone>
            </DCArtboard>
            <DCArtboard id="c-reveal" label="11 · Lịch đã mở — trang đầu" width={420} height={830}>
              <Phone dark><CReveal /></Phone>
            </DCArtboard>
          </DCSection>

          <DCSection id="daily" title="7 · DAILY LOOP" subtitle="Lịch — trang hôm nay · spread tháng · chi tiết ngày">
            <DCArtboard id="c-home" label="12 · Tab 1 Lịch · [Hôm nay] · trang lịch tờ" width={420} height={830}>
              <Phone dark><CHomePage /></Phone>
            </DCArtboard>
            <DCArtboard id="c-month" label="13 · Tab 1 Lịch · [Tháng] · grid chấm điểm" width={420} height={830}>
              <Phone><CMonthSpread /></Phone>
            </DCArtboard>
            <DCArtboard id="c-day" label="14 · Chi tiết một ngày (khác hôm nay)" width={420} height={830}>
              <Phone><CDayDetail /></Phone>
            </DCArtboard>
          </DCSection>

          <DCSection id="ai" title="8 · LUẬN GIẢI (LLM)" subtitle="Streaming · có nguồn · lá số chi tiết">
            <DCArtboard id="c-aityped" label="15 · Luận AI · streaming" width={420} height={830}>
              <Phone><CAITyped /></Phone>
            </DCArtboard>
            <DCArtboard id="c-aisec" label="16 · Luận đầy đủ · có nguồn trích dẫn" width={420} height={830}>
              <Phone><CAISectioned /></Phone>
            </DCArtboard>
            <DCArtboard id="c-laso" label="17 · Lá số chi tiết" width={420} height={830}>
              <Phone><CLaSoFull /></Phone>
            </DCArtboard>
            <DCArtboard id="c-bazi" label="18 · Luận giải Bát tự · năm Bính Ngọ" width={420} height={830}>
              <Phone><CBaziReadingFull /></Phone>
            </DCArtboard>
          </DCSection>

          <DCSection id="picks" title="9 · PICKS" subtitle="Tra cứu → đang tìm → kết quả">
            <DCArtboard id="c-search" label="19 · Tra cứu · entry" width={420} height={830}>
              <Phone><CSearchEntry /></Phone>
            </DCArtboard>
            <DCArtboard id="c-pickloading" label="20 · Đang tìm ngày tốt" width={420} height={830}>
              <Phone><CPickLoading /></Phone>
            </DCArtboard>
            <DCArtboard id="c-results" label="21 · Tra cứu · kết quả" width={420} height={830}>
              <Phone><CSearchResult /></Phone>
            </DCArtboard>
          </DCSection>

          <DCSection id="tools" title="10 · TOOLS" subtitle="Hợp tuổi · Chuyển lịch">
            <DCArtboard id="c-hoptuoi" label="22 · Hợp tuổi · entry" width={420} height={830}>
              <Phone><CHopTuoi /></Phone>
            </DCArtboard>
            <DCArtboard id="c-hoptuoi-r" label="23 · Hợp tuổi · kết quả" width={420} height={830}>
              <Phone><CHopTuoiResult /></Phone>
            </DCArtboard>
            <DCArtboard id="c-chuyenlich" label="24 · Chuyển lịch âm ↔ dương" width={420} height={830}>
              <Phone><CChuyenLich /></Phone>
            </DCArtboard>
          </DCSection>

          <DCSection id="commerce" title="11 · COMMERCE" subtitle="Đặt lịch — pricing · confirm · thành công">
            <DCArtboard id="c-pricing" label="25 · Đặt lịch · gói năm là hero" width={420} height={830}>
              <Phone><CPricing /></Phone>
            </DCArtboard>
            <DCArtboard id="c-payconfirm" label="26 · Xác nhận thanh toán (sheet)" width={420} height={830}>
              <Phone><CPayConfirm /></Phone>
            </DCArtboard>
            <DCArtboard id="c-paysuccess" label="27 · Đặt lịch thành công" width={420} height={830}>
              <Phone><CPaySuccess /></Phone>
            </DCArtboard>
          </DCSection>

          <DCSection id="account" title="12 · ACCOUNT" subtitle="Tôi · sửa hồ sơ">
            <DCArtboard id="c-me" label="28 · Tôi (Tab 3)" width={420} height={830}>
              <Phone><CMe /></Phone>
            </DCArtboard>
            <DCArtboard id="c-editprofile" label="29 · Sửa hồ sơ" width={420} height={830}>
              <Phone><CEditProfile /></Phone>
            </DCArtboard>
          </DCSection>

          <DCSection id="edge" title="13 · EDGE STATES + SETTINGS" subtitle="Cài đặt · paywall · standalone variants · expired · confirm · offline">
            <DCArtboard id="c-settings" label="30 · Cài đặt" width={420} height={830}>
              <Phone><CSettings /></Phone>
            </DCArtboard>
            <DCArtboard id="c-notif" label="31 · Xin quyền thông báo (pre-prompt)" width={420} height={830}>
              <Phone><CNotifPerm /></Phone>
            </DCArtboard>
            <DCArtboard id="c-nodates" label="32 · Không có ngày tốt (NO_DATES_FOUND)" width={420} height={830}>
              <Phone><CNoDatesFound /></Phone>
            </DCArtboard>
            <DCArtboard id="c-bazi-lock" label="33 · Luận giải Bát tự · LOCKED (giá gói tháng)" width={420} height={830}>
              <Phone><CBaziLocked /></Phone>
            </DCArtboard>
            <DCArtboard id="c-me-lock" label="34 · Tôi · gói tháng · Bazi khóa" width={420} height={830}>
              <Phone><CMeLocked /></Phone>
            </DCArtboard>
            <DCArtboard id="c-payconfirm-s" label="35 · Xác nhận TT · mua lẻ Bát tự" width={420} height={830}>
              <Phone><CPayConfirmStandalone /></Phone>
            </DCArtboard>
            <DCArtboard id="c-paysuccess-s" label="36 · TT thành công · mua lẻ Bát tự" width={420} height={830}>
              <Phone><CPaySuccessStandalone /></Phone>
            </DCArtboard>
            <DCArtboard id="c-payfail" label="37 · Thanh toán thất bại" width={420} height={830}>
              <Phone><CPayFailure /></Phone>
            </DCArtboard>
            <DCArtboard id="c-subexpired" label="38 · Lịch hết hạn" width={420} height={830}>
              <Phone><CSubExpired /></Phone>
            </DCArtboard>
            <DCArtboard id="c-confirm" label="39 · Confirm dialog (đăng xuất)" width={420} height={830}>
              <Phone><CConfirmDialog /></Phone>
            </DCArtboard>
            <DCArtboard id="c-offline" label="40 · Hôm nay · offline state" width={420} height={830}>
              <Phone dark><COfflineHome /></Phone>
            </DCArtboard>
          </DCSection>

        </DesignCanvas>
      </BProvider>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
