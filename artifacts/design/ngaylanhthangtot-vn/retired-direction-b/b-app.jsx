/* B canvas + tweaks. Globals expected: DesignCanvas, DCSection, DCArtboard, BProvider, useB, MotionStyles, IOSDevice
   plus all surface components from b-shared/screens/landing */
/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, BProvider, MotionStyles, Phone, LandingFull,
   OnboardingA, OnboardingB, OnboardingC, LaSoCenterfold, ShareCard, NotificationDemo, SettingsScreen,
   EmptyResult, LoadingResult, TicketVariants, ResultMotion, HomeMotion, TearMotion, PWAHomeB, PickResultB, BuyB,
   TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakSlider, TweakColor, TweakSelect */

const { useState } = React;

const TWEAK_DEFAULS = /*EDITMODE-BEGIN*/{
  "perforation": "classic",
  "kanjiDensity": 0.18,
  "accent": "#c5a55a"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULS);

  const value = { perforation: t.perforation, kanjiDensity: t.kanjiDensity, accent: t.accent };

  return (
    <BProvider value={value}>
      <MotionStyles />

      <DesignCanvas
        title="Direction B — Almanac Pocket · Full build"
        subtitle="Same forest + gold + paper tokens · expanded across landing, full PWA flow, variants, and motion. Toggle Tweaks for live theming."
      >

        <DCSection id="reasoning" title="What's in this canvas">
          <DCArtboard id="map" label="Map" width={1100} height={620}>
            <NotesCard t={t} />
          </DCArtboard>
        </DCSection>

        <DCSection id="visual" title="1 · Visual variants — ticket perforation styles">
          <DCArtboard id="ticket-variants" label="Ticket — three perforation styles" width={1100} height={600}>
            <TicketVariants />
          </DCArtboard>
        </DCSection>

        <DCSection id="flow" title="2 · Full PWA flow — every entry/listing/result surface">
          <DCArtboard id="splash" label="01 · Splash / launch" width={420} height={830}>
            <Phone dark><window.Splash /></Phone>
          </DCArtboard>
          <DCArtboard id="install" label="02 · PWA install prompt" width={420} height={830}>
            <Phone dark><window.InstallPrompt /></Phone>
          </DCArtboard>
          <DCArtboard id="onboard-1" label="03 · Onboarding 1 / 3 — Mở quẻ" width={420} height={830}>
            <Phone dark><OnboardingA /></Phone>
          </DCArtboard>
          <DCArtboard id="onboard-2" label="04 · Onboarding 2 / 3 — Giờ sinh" width={420} height={830}>
            <Phone dark><OnboardingB /></Phone>
          </DCArtboard>
          <DCArtboard id="onboard-3" label="05 · Onboarding 3 / 3 — Phiếu chào mừng" width={420} height={830}>
            <Phone dark><OnboardingC /></Phone>
          </DCArtboard>
          <DCArtboard id="welcome" label="06 · Welcome back — returning user" width={420} height={830}>
            <Phone dark><window.WelcomeBack /></Phone>
          </DCArtboard>
          <DCArtboard id="home" label="07 · Hôm nay (home)" width={420} height={830}>
            <Phone><window.HomTodayLight /></Phone>
          </DCArtboard>
          <DCArtboard id="month" label="08 · Lịch tháng — month view" width={420} height={830}>
            <Phone dark><window.MonthCalendar /></Phone>
          </DCArtboard>
          <DCArtboard id="pick-entry" label="09 · Chọn ngày — chọn việc (entry)" width={420} height={830}>
            <Phone dark><window.PickEntry /></Phone>
          </DCArtboard>
          <DCArtboard id="loading2" label="10 · Đang luận đoán" width={420} height={830}>
            <Phone dark><LoadingResult /></Phone>
          </DCArtboard>
          <DCArtboard id="result" label="11 · Chọn ngày — kết quả" width={420} height={830}>
            <Phone><window.PickResultLight /></Phone>
          </DCArtboard>
          <DCArtboard id="share" label="12 · Chia sẻ — phiếu cho cả nhà" width={420} height={830}>
            <Phone dark><ShareCard /></Phone>
          </DCArtboard>
          <DCArtboard id="viec" label="13 · Sổ việc — saved tasks list" width={420} height={830}>
            <Phone><window.ViecListLight /></Phone>
          </DCArtboard>
          <DCArtboard id="empty2" label="14 · Sổ việc — empty state" width={420} height={830}>
            <Phone dark><EmptyResult /></Phone>
          </DCArtboard>
          <DCArtboard id="laso2" label="15 · Lá số tứ trụ" width={420} height={830}>
            <Phone dark><LaSoCenterfold /></Phone>
          </DCArtboard>
          <DCArtboard id="notify" label="16 · Thông báo — daily push" width={420} height={830}>
            <Phone dark><NotificationDemo /></Phone>
          </DCArtboard>
          <DCArtboard id="buy" label="17 · Mua lượng / gói" width={420} height={830}>
            <Phone><window.MuaLuongV2 /></Phone>
          </DCArtboard>
          <DCArtboard id="pay" label="18 · Xác nhận thanh toán" width={420} height={830}>
            <Phone dark><window.PaymentConfirm /></Phone>
          </DCArtboard>
          <DCArtboard id="settings" label="19 · Cài đặt" width={420} height={830}>
            <Phone dark><SettingsScreen /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="api" title="2b · API-only surfaces — net-new from spec (no Row-2 counterpart)">
          <DCArtboard id="api-merge-notes" label="Merge notes · 4 dark phones retired into Row 2 production light" width={1100} height={620}>
            <window.ApiMergeNotes />
          </DCArtboard>
          <DCArtboard id="hoptuoi-in" label="22 · Hợp tuổi — chọn 2 người + 8 quan hệ" width={420} height={830}>
            <Phone dark><window.HopTuoiInput /></Phone>
          </DCArtboard>
          <DCArtboard id="hoptuoi-out" label="23 · Hợp tuổi — kết quả v2 (verdict + criteria)" width={420} height={830}>
            <Phone dark><window.HopTuoiResult /></Phone>
          </DCArtboard>
          <DCArtboard id="phongthuy" label="24 · Phong thủy — la bàn + Cửu Cung phi tinh" width={420} height={830}>
            <Phone dark><window.PhongThuy /></Phone>
          </DCArtboard>
          <DCArtboard id="tieuvan" label="25 · Tiểu Vận — vận tháng" width={420} height={830}>
            <Phone dark><window.TieuVan /></Phone>
          </DCArtboard>
          <DCArtboard id="convert" label="26 · Chuyển âm ↔ dương" width={420} height={830}>
            <Phone dark><window.ConvertLich /></Phone>
          </DCArtboard>
          <DCArtboard id="err-nodates" label="29 · Lỗi — NO_DATES_FOUND" width={420} height={830}>
            <Phone dark><window.ErrorNoDates /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="ai-reading" title="2c · LLM Luận Giải — the AI reading system">
          <DCArtboard id="ai-notes" label="Map · why this row exists" width={1100} height={620}>
            <window.AIReadingNotes />
          </DCArtboard>
          <DCArtboard id="ai-loading" label="AR-01 · Loading 4 phases (animated)" width={420} height={830}>
            <Phone dark><window.AILoading4Phase /></Phone>
          </DCArtboard>
          <DCArtboard id="ai-typed" label="AR-02 · Typed reveal + chữ hán watermark" width={420} height={830}>
            <Phone dark><window.AITypedReveal /></Phone>
          </DCArtboard>
          <DCArtboard id="ai-sectioned" label="AR-03 · Sectioned card — 論 / 勸 / 忌 + citations" width={420} height={830}>
            <Phone dark><window.AISectionedCard /></Phone>
          </DCArtboard>
          <DCArtboard id="ai-locked" label="AR-04 · Locked + bulk reasons unlock" width={420} height={830}>
            <Phone dark><window.AILocked /></Phone>
          </DCArtboard>
          <DCArtboard id="ai-retry" label="AR-05 · Section retry + depth badges" width={420} height={830}>
            <Phone dark><window.AIRetryDepth /></Phone>
          </DCArtboard>
          <DCArtboard id="ai-pin" label="AR-06 · Pin + share-just-reading" width={420} height={830}>
            <Phone dark><window.AIPinShare /></Phone>
          </DCArtboard>
          <DCArtboard id="ai-chitiet" label="AR-07 · Lá số chi tiết — 5 mục + tổng hợp" width={420} height={830}>
            <Phone dark><window.LaSoChiTietFull /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="flow-complete" title="2d · Flow-complete — the screens B was missing">
          <DCArtboard id="fc-notes" label="Map · what & why" width={1100} height={620}>
            <window.FCNotes />
          </DCArtboard>
          <DCArtboard id="fc-login" label="30 · Đăng nhập (chooser)" width={420} height={830}>
            <Phone dark><window.FCLoginChooser /></Phone>
          </DCArtboard>
          <DCArtboard id="fc-login-email" label="31 · Đăng nhập email" width={420} height={830}>
            <Phone dark><window.FCLoginEmail /></Phone>
          </DCArtboard>
          <DCArtboard id="fc-signup" label="32 · Đăng ký + prefill + referral" width={420} height={830}>
            <Phone dark><window.FCSignup /></Phone>
          </DCArtboard>
          <DCArtboard id="fc-batdau" label="33 · Bắt đầu — welcome gate" width={420} height={830}>
            <Phone dark><window.FCBatDau /></Phone>
          </DCArtboard>
          <DCArtboard id="fc-day" label="34 · Chi tiết ngày · /ngay/:ngay" width={420} height={830}>
            <Phone dark><window.FCDayDetail /></Phone>
          </DCArtboard>
          <DCArtboard id="fc-week" label="35 · Tuần này" width={420} height={830}>
            <Phone dark><window.FCWeekList /></Phone>
          </DCArtboard>
          <DCArtboard id="fc-month" label="36 · Lịch tháng (re-skin)" width={420} height={830}>
            <Phone dark><window.FCMonthFull /></Phone>
          </DCArtboard>
          <DCArtboard id="fc-pay-ok" label="37 · Thanh toán thành công" width={420} height={830}>
            <Phone dark><window.FCPaymentSuccess /></Phone>
          </DCArtboard>
          <DCArtboard id="fc-callback" label="38 · OAuth callback" width={420} height={830}>
            <Phone dark><window.FCAuthCallback /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="habit" title="2e · Habit loop — the reason to come back">
          <DCArtboard id="hb-notes" label="Map · daily-return engine" width={1100} height={620}>
            <window.HBNotes />
          </DCArtboard>
          <DCArtboard id="hb-home" label="39 · Hôm nay · tiết khí wheel" width={420} height={830}>
            <Phone dark><window.HabitTietKhi /></Phone>
          </DCArtboard>
          <DCArtboard id="hb-7" label="40 · Đủ 7 ngày — celebration" width={420} height={830}>
            <Phone dark><window.HBStreak7 /></Phone>
          </DCArtboard>
          <DCArtboard id="hb-broken" label="41 · Liền ngắt — gentle restart" width={420} height={830}>
            <Phone dark><window.HBStreakBroken /></Phone>
          </DCArtboard>
          <DCArtboard id="hb-notif" label="42 · 3 nhịp thông báo" width={420} height={830}>
            <Phone dark><window.HBNotifCadence /></Phone>
          </DCArtboard>
          <DCArtboard id="hb-history" label="43 · Lịch sử 30 ngày" width={420} height={830}>
            <Phone dark><window.HBStreakHistory /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection id="cleanup" title="2f · Trust / cleanup — before · after diffs">
          <DCArtboard id="cu-notes" label="Map · 30-min fixes" width={1100} height={620}>
            <window.CUNotes />
          </DCArtboard>
          <DCArtboard id="cu-pay" label="44 · Thanh công · webhook leak fixed" width={760} height={620}>
            <window.CUPaySuccess />
          </DCArtboard>
          <DCArtboard id="cu-api" label="45 · /hom-nay · API doc removed" width={760} height={620}>
            <window.CUApiDoc />
          </DCArtboard>
          <DCArtboard id="cu-empty" label="46 · NO_DATES_FOUND · empty state" width={760} height={620}>
            <window.CUEmptyState />
          </DCArtboard>
          <DCArtboard id="cu-method" label="47 · Methodology card" width={760} height={620}>
            <window.CUMethodology />
          </DCArtboard>
          <DCArtboard id="cu-locked" label="48 · Locked-state explainer" width={760} height={620}>
            <window.CULocked />
          </DCArtboard>
        </DCSection>

        <DCSection id="landing" title="3 · Landing — desktop + mobile">
          <DCArtboard id="landing-desktop" label="ngaylanhthangtot.vn · desktop · 1440w" width={1440} height={4400}>
            <window.LandingV2 />
          </DCArtboard>
          <DCArtboard id="landing-mobile" label="ngaylanhthangtot.vn · mobile · 390w" width={390} height={2400}>
            <window.LandingV2Mobile />
          </DCArtboard>
        </DCSection>

        <DCSection id="motion" title="4 · Motion pass — looping">
          <DCArtboard id="m-home" label="Watermark drift (home)" width={420} height={830}>
            <Phone dark><HomeMotion /></Phone>
          </DCArtboard>
          <DCArtboard id="m-result" label="Score count + stamp slam" width={420} height={830}>
            <Phone dark><ResultMotion /></Phone>
          </DCArtboard>
          <DCArtboard id="m-tear" label="Ticket tear-off on save" width={420} height={830}>
            <Phone dark><TearMotion /></Phone>
          </DCArtboard>
        </DCSection>
        <DCSection id="nav-refresh" title="5 · Nav refresh — Tab 4 (Tra cứu) + Tab 5 (Tôi)">
          <DCArtboard id="tabs-notes" label="Notes · Explore folded into 5-tab nav" width={1100} height={620}>
            <window.TabsNotes />
          </DCArtboard>
          <DCArtboard id="tab-4-tracuu" label="Tab 4 · Tra cứu — tools + sổ" width={420} height={830}>
            <Phone><window.TraCuuHub /></Phone>
          </DCArtboard>
          <DCArtboard id="tab-5-toi" label="Tab 5 · Tôi — profile · ví · cài đặt" width={420} height={830}>
            <Phone><window.ToiProfile /></Phone>
          </DCArtboard>
          <DCArtboard id="ho-so-gia-dinh" label="Tab 5 → Hồ sơ gia đình (multi-profile manager)" width={420} height={830}>
            <Phone dark><window.ProfilesList /></Phone>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks · Direction B">
        <TweakSection title="Visual system">
          <TweakRadio label="Perforation" value={t.perforation} onChange={(v) => setTweak('perforation', v)}
            options={[
              { value: 'classic', label: 'Classic' },
              { value: 'sharp', label: 'Sharp' },
              { value: 'wave', label: 'Wave' },
            ]} />
          <TweakSlider label="Kanji density" value={t.kanjiDensity} min={0.04} max={0.5} step={0.02} onChange={(v) => setTweak('kanjiDensity', v)} format={(v) => `${Math.round(v * 100)}%`} />
          <TweakColor label="Accent" value={t.accent} onChange={(v) => setTweak('accent', v)}
            options={['#c5a55a', '#9a7c22', '#b34a3a', '#7a8a78']} />
        </TweakSection>
      </TweaksPanel>
    </BProvider>
  );
}

function NotesCard({ t }) {
  return (
    <div style={{ padding: '40px 56px', background: '#f1ece1', height: '100%', fontFamily: 'var(--serif)', color: '#18150e', overflow: 'auto', position: 'relative' }}>
      <div style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a7c22', borderBottom: '1px solid #c5a55a', paddingBottom: 4 }}>
        Direction B — Full build · 5 dimensions
      </div>
      <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 44, lineHeight: 1.05, margin: '14px 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
        Almanac, but a product.<br />Toggle <span style={{ color: '#9a7c22' }}>Tweaks</span> to retune live.
      </h1>
      <p style={{ fontSize: 16, color: '#3a3220', lineHeight: 1.65, maxWidth: 720 }}>
        Five passes layered into one canvas. Same tokens — forest <code>#1d3129</code>, gold <code>#c5a55a</code>, paper <code>#f1ece1</code>, Lora + Barlow + Plex Mono + Noto Serif SC. The Tweaks panel re-keys the whole system: perforation, kanji density, accent.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 28 }}>
        {[
          ['1 · Visual variants', '3 ticket styles (classic / sharp / wave) + Lá số centrefold + empty + loading. Picks the register before the rest of the system commits.'],
          ['2 · Full PWA flow', '3-step onboarding · Hôm nay · Chọn ngày · Chia sẻ · Notification preview · Mua lượng · Settings — every screen rendered as a phiếu where it earns it.'],
          ['3 · Landing full scroll', 'Hero · Vì sao (3-up: lịch in vs thầy bốc vs NLTT) · How it works · Pricing · Testimonials · CTA · Footer.'],
          ['4 · Tweakable', 'Right-side panel — toggle perforation, slide kanji density, swap accent. Every artboard re-renders in place.'],
          ['5 · Motion', 'Watermark drift on home, score count-up + 吉日 stamp slam on result, ticket tear-off on save. Loops every few seconds.'],
        ].map(([t, d]) => (
          <div key={t} style={{ borderTop: '2px solid #18150e', paddingTop: 14 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase' }}>{t}</div>
            <div style={{ fontSize: 14, color: '#3a3220', marginTop: 6, lineHeight: 1.55 }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28, padding: '14px 18px', background: 'rgba(154,124,34,0.08)', borderLeft: '3px solid #9a7c22' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#9a7c22', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Live tweaks · current state</div>
        <div style={{ fontSize: 13, color: '#3a3220', marginTop: 6, fontFamily: 'var(--mono)' }}>
          perforation: <strong>{t.perforation}</strong> · kanji: <strong>{Math.round(t.kanjiDensity * 100)}%</strong> · accent: <strong style={{ color: t.accent }}>{t.accent}</strong>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
