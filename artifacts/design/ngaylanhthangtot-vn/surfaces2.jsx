/* global React, Mono, Kanji, Logo */

// Reusable bits
function StatusBar({ dark }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 22px 6px', fontSize: 14, fontWeight: 600, color: dark ? 'var(--cream)' : 'var(--ink)', fontFamily: 'system-ui' }}>
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>●●●●●</span>
        <span style={{ width: 22, height: 11, border: `1.2px solid ${dark ? 'var(--cream-dim)' : 'var(--ink)'}`, borderRadius: 2, position: 'relative' }}>
          <span style={{ position: 'absolute', inset: 1, background: dark ? 'var(--cream)' : 'var(--ink)', width: '70%' }} />
        </span>
      </span>
    </div>
  );
}

function HomeIndicator({ dark }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 10px' }}>
      <div style={{ width: 134, height: 5, borderRadius: 999, background: dark ? 'rgba(237,231,211,0.7)' : 'rgba(24,21,14,0.8)' }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PWA HOME — DIRECTION A : Refined editorial
// ═══════════════════════════════════════════════════════════════════════
function PWAHomeA() {
  const W = 390, H = 800;
  return (
    <div style={{ width: W, height: H, background: 'var(--bg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'var(--serif)' }} className="nltt-paper">
      <StatusBar />
      {/* Header — compact, brand-anchored */}
      <div style={{ padding: '8px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo size={32} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13, color: 'var(--gold-deep)' }}>20</span>
          <Mono style={{ color: 'var(--ink-mute)' }}>lượng</Mono>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }} className="clean-scroll">
        {/* Today card — flagship, glanceable */}
        <div style={{ background: 'var(--forest)', position: 'relative', overflow: 'hidden', padding: '20px 22px 22px', marginBottom: 18 }} className="grain">
          <Kanji ch="癸" size={150} style={{ position: 'absolute', right: -10, bottom: -28, color: 'transparent', WebkitTextStroke: '1px rgba(197,165,90,0.18)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Mono style={{ color: 'var(--gold)' }}>Hôm nay · T7 09/05</Mono>
              <Mono style={{ color: 'var(--green-mute)' }}>Bính Ngọ · Quý Tỵ</Mono>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 64, color: 'var(--gold)', lineHeight: 0.9, letterSpacing: '-0.03em' }}>78</div>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 18, color: 'var(--cream)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Ngày tốt</div>
                <div style={{ fontSize: 12, color: 'var(--green-mute)', marginTop: 2 }}>Trên 100 — bạn hợp với hôm nay</div>
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(197,165,90,0.2)' }}>
              <Mono style={{ color: 'var(--cream-dim)' }}>Hợp làm — 3 việc</Mono>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {['Ký kết', 'Cầu tài', 'Họp mặt'].map((t) => (
                  <span key={t} style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: 'var(--forest)', background: 'var(--gold)', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{t}</span>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <Mono style={{ color: 'var(--cream-dim)' }}>Kỵ — tránh</Mono>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {['Đổ móng', 'Khai trương'].map((t) => (
                    <span key={t} style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--green-mute)', border: '1px solid rgba(122,154,128,0.4)', padding: '4px 10px', textTransform: 'uppercase' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA — single, unmissable */}
        <button style={{ width: '100%', padding: 18, background: 'var(--gold)', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 22 }}>
          <span>Chọn ngày cho việc cụ thể</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>→</span>
        </button>

        {/* This week — pull-to-engage habit driver */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div className="lp-cond" style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', textTransform: 'uppercase' }}>Tuần này</div>
          <Mono style={{ color: 'var(--gold-deep)' }}>Xem cả tháng →</Mono>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[
            ['CN', '04', 62, 'kha'],
            ['T2', '05', 71, 'kha'],
            ['T3', '06', 45, 'thuong'],
            ['T4', '07', 88, 'tot'],
            ['T5', '08', 30, 'xau'],
            ['T6', '09', 78, 'tot'],
            ['T7', '10', 55, 'thuong'],
          ].map(([d, n, s, k], i) => {
            const isToday = i === 5;
            const c = k === 'tot' ? 'var(--gold-deep)' : k === 'kha' ? 'var(--ink)' : k === 'xau' ? 'var(--danger)' : 'var(--ink-mute)';
            return (
              <div key={i} style={{ flex: 1, background: isToday ? 'var(--ink)' : 'rgba(255,255,255,0.5)', border: `1px solid ${isToday ? 'var(--ink)' : 'var(--border)'}`, padding: '8px 0 10px', textAlign: 'center', position: 'relative' }}>
                <Mono style={{ color: isToday ? 'var(--cream-dim)' : 'var(--ink-mute)', fontSize: 9 }}>{d}</Mono>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: isToday ? 'var(--gold)' : 'var(--ink)', marginTop: 1 }}>{n}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: isToday ? 'var(--gold)' : c, fontWeight: 600, marginTop: 1 }}>{s}</div>
              </div>
            );
          })}
        </div>

        {/* Việc của bạn — saved tasks */}
        <div className="lp-cond" style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: 10 }}>Việc của bạn</div>
        {[
          ['Khai trương cửa hàng', 'Tìm trong T6 → T8', '3 ngày tốt'],
          ['Ký hợp đồng nhà', 'Trong tuần này', '1 ngày · CN 17'],
        ].map(([t, d, r], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{t}</div>
              <Mono style={{ color: 'var(--ink-mute)', marginTop: 2 }}>{d}</Mono>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--gold-deep)', fontSize: 14, textTransform: 'uppercase' }}>{r}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        {[['Hôm nay', '☷', true], ['Chọn ngày', '◇', false], ['Lá số', '☰', false], ['Lượng', '◯', false]].map(([t, ic, on], i) => (
          <div key={i} style={{ flex: 1, padding: '10px 0 6px', textAlign: 'center', borderTop: on ? '2px solid var(--gold)' : '2px solid transparent' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 16, color: on ? 'var(--gold-deep)' : 'var(--ink-mute)', lineHeight: 1 }}>{ic}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, color: on ? 'var(--ink)' : 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{t}</div>
          </div>
        ))}
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PWA HOME — DIRECTION B : Almanac (dark page, gold-on-forest)
// ═══════════════════════════════════════════════════════════════════════
function PWAHomeB() {
  const W = 390, H = 800;
  return (
    <div style={{ width: W, height: H, background: 'var(--forest)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }} className="grain">
      <Kanji ch="日" size={420} style={{ position: 'absolute', top: 80, right: -120, color: 'transparent', WebkitTextStroke: '1px rgba(197,165,90,0.07)' }} />
      <StatusBar dark />
      <div style={{ padding: '8px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <Logo dark size={30} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: '1px solid rgba(197,165,90,0.4)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13, color: 'var(--gold)' }}>20</span>
          <Mono style={{ color: 'var(--green-mute)' }}>lượng</Mono>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 16px', position: 'relative' }} className="clean-scroll">
        {/* Almanac block — feels like a page from the book */}
        <div style={{ position: 'relative', textAlign: 'center', padding: '8px 0 18px' }}>
          <Mono style={{ color: 'var(--gold)' }}>Niên giám · 09 tháng 5</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 110, color: 'var(--gold)', lineHeight: 0.85, letterSpacing: '-0.04em', margin: '6px 0 0' }}>78</div>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: 'var(--cream)', fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Ngày Tốt</div>
          <div style={{ fontSize: 13, color: 'var(--green-mute)', fontStyle: 'italic', marginTop: 6, fontFamily: 'var(--serif)' }}>"Quý Thủy gặp Mộc — phát biểu, ký kết được lòng"</div>

          {/* meridian rule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
            <span style={{ flex: 1, height: 1, background: 'rgba(197,165,90,0.3)' }} />
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: 'var(--gold)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Quý Thủy · giờ Tỵ</span>
            <span style={{ flex: 1, height: 1, background: 'rgba(197,165,90,0.3)' }} />
          </div>
        </div>

        {/* Two columns — like book pages */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div style={{ background: 'rgba(237,231,211,0.06)', border: '1px solid rgba(197,165,90,0.25)', padding: 14, borderTop: '3px solid var(--gold)' }}>
            <Mono style={{ color: 'var(--gold)' }}>Nên</Mono>
            <div style={{ marginTop: 8, color: 'var(--cream)', fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.7 }}>
              <div>· Ký kết</div>
              <div>· Cầu tài</div>
              <div>· Họp mặt</div>
            </div>
          </div>
          <div style={{ background: 'rgba(139,26,26,0.12)', border: '1px solid rgba(139,26,26,0.4)', padding: 14, borderTop: '3px solid var(--danger)' }}>
            <Mono style={{ color: '#d88080' }}>Kỵ</Mono>
            <div style={{ marginTop: 8, color: 'var(--cream)', fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.7 }}>
              <div>· Đổ móng</div>
              <div>· Khai trương</div>
              <div>· An táng</div>
            </div>
          </div>
        </div>

        {/* Big CTA */}
        <button style={{ width: '100%', padding: 18, background: 'var(--gold)', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--forest)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
          <span>Chọn ngày cho việc của tôi</span><span>→</span>
        </button>

        {/* week strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '24px 0 10px' }}>
          <Mono style={{ color: 'var(--gold)' }}>Tuần này — kéo xem</Mono>
          <Mono style={{ color: 'var(--green-mute)' }}>Tháng 5 →</Mono>
        </div>
        <div style={{ display: 'flex', gap: 4, paddingBottom: 8 }}>
          {[['CN', 4, 62], ['T2', 5, 71], ['T3', 6, 45], ['T4', 7, 88], ['T5', 8, 30], ['T6', 9, 78], ['T7', 10, 55]].map(([d, n, s], i) => {
            const today = i === 5;
            const h = (s / 100) * 60 + 10;
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{ width: '70%', height: h, background: today ? 'var(--gold)' : s > 70 ? 'rgba(197,165,90,0.5)' : 'rgba(237,231,211,0.18)', borderTop: today ? 'none' : '1px solid rgba(197,165,90,0.4)' }} />
                </div>
                <Mono style={{ color: today ? 'var(--gold)' : 'var(--green-mute)', fontSize: 9, marginTop: 4, display: 'block' }}>{d}</Mono>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: today ? 'var(--gold)' : 'var(--cream-dim)' }}>{n}</div>
              </div>
            );
          })}
        </div>
      </div>

      {window.BottomNav ? <window.BottomNav active="home" /> : null}
      <HomeIndicator dark />
    </div>
  );
}

window.PWAHomeA = PWAHomeA;
window.PWAHomeB = PWAHomeB;
window.StatusBar = StatusBar;
window.HomeIndicator = HomeIndicator;
