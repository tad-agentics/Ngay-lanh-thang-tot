/* Row 2e · Habit loop — streak ribbon, push cadence, day-7 celebration, streak history, streak broken.
   Daily-return engine. Ties to existing /thong-bao-quyen + /hom-nay surfaces. */
/* global React, Phone, Ticket, Kanji, Mono, Stamp, Logo, useB */

const HB_FOREST = { background: 'radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)', minHeight: '100%', padding: '0 20px 32px', position: 'relative', overflow: 'hidden' };

// ─── Streak ribbon (reusable across home variants) ───
function HBStreakRibbon({ days = 7, total = 7, broken = false }) {
  const b = useB();
  return (
    <div style={{ background: broken ? 'rgba(139,26,26,0.18)' : 'rgba(197,165,90,0.1)', border: `1px solid ${broken ? 'rgba(196,77,77,0.5)' : b.accent}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontFamily: 'var(--display-2)', fontSize: 22, color: broken ? '#e58a5c' : b.accent, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>{broken ? '—' : days}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Mono style={{ color: broken ? '#e58a5c' : b.accent }}>{broken ? 'Liền · gián đoạn' : `Liền · ${days} ngày`}</Mono>
        <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
          {[...Array(total)].map((_, i) => (
            <span key={i} style={{ flex: 1, height: 4, background: i < days ? (broken ? '#e58a5c' : b.accent) : 'rgba(200,188,152,0.18)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 39 · Streak home (Hôm nay with streak ribbon) ───
function HBStreakHome() {
  const b = useB();
  return (
    <div style={HB_FOREST}>
      {/* Top bar — phiếu */}
      <div style={{ paddingTop: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '50px 0 12px' }}>
        <div>
          <Mono style={{ color: b.accent }}>23 / 10 · Quý Mão</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: '#ede7d3', marginTop: 2, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Hà Thanh · Tân Kim</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: `1px solid ${b.accent}`, color: b.accent }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lợ</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>15</span>
        </div>
      </div>

      <HBStreakRibbon days={5} total={7} />

      {/* Today ticket */}
      <div style={{ marginTop: 10 }}>
        <Ticket>
          <div style={{ padding: '20px 22px 18px', textAlign: 'center', position: 'relative' }}>
            <Stamp ch="吉日" style={{ position: 'absolute', top: 12, right: 16 }} />
            <Mono style={{ color: '#7a7050' }}>Hôm nay · ngày 5 / 7</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 64, lineHeight: 0.95, margin: '6px 0 2px', color: b.accentDeep, letterSpacing: '-0.03em' }}>23</div>
            <Mono style={{ color: '#5a4f30' }}>Quý Mão · Trực Định</Mono>
            <div style={{ display: 'inline-block', marginTop: 10, padding: '4px 14px', background: '#3d6b4a', color: '#ede7d3', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Hoàng Đạo · 89 / 100
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.55, color: '#3a3220', margin: '14px 0 4px' }}>
              Tài tinh vượng — hợp ký kết & gặp đối tác. Trước trưa thuận lợi nhất.
            </p>
            <Mono style={{ color: '#7a7050' }}>Giờ tốt · Thìn 7–9h · Tị 9–11h</Mono>
          </div>
        </Ticket>
      </div>

      {/* Tomorrow teaser ribbon */}
      <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,188,152,0.14)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Mono style={{ color: 'rgba(200,188,152,0.6)' }}>Mai · 24 / 10 · T6</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: '#c8bc98', marginTop: 1 }}>Còn 2 ngày để giữ liền 7</div>
        </div>
        <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 11, color: b.accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Xem ›</span>
      </div>

      <div style={{ marginTop: 14, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'rgba(200,188,152,0.55)', textAlign: 'center', lineHeight: 1.6 }}>
        Mở app mỗi sáng để giữ liền —<br />đủ 7 ngày sẽ được tặng 1 lá số chi tiết.
      </div>
    </div>
  );
}

// ─── 40 · Day-7 celebration ───
function HBStreak7() {
  const b = useB();
  return (
    <div style={{ ...HB_FOREST, padding: '0 20px' }}>
      <BackBar dark subtitle="Thói quen · ngày 7" title="Mừng bạn đã đến" onBack={() => {}} />
      <div style={{ paddingTop: 18 }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <span style={{ fontFamily: 'var(--display-2)', fontSize: 96, color: b.accent, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', animation: 'hb-float 3s ease-in-out infinite' }}>7</span>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Confetti chữ hán */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <span key={i} style={{ position: 'absolute', top: `${10 + i * 12}%`, left: `${i % 2 === 0 ? 8 : 78}%`, width: 8, height: 8, borderRadius: '50%', background: b.accent, opacity: 0.4, animation: `hb-float ${3 + i * 0.3}s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>

        <Ticket>
          <div style={{ padding: '28px 22px 22px', textAlign: 'center', position: 'relative' }}>
            <Stamp ch="圓滿" style={{ position: 'absolute', top: 14, right: 14, fontSize: 18 }} />

            <Mono style={{ color: '#7a7050' }}>Phiếu liền · 17 → 23 · 10</Mono>
            <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 36, lineHeight: 1, margin: '10px 0 4px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              Đủ 7 ngày
            </h1>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: '#5a4f30', marginBottom: 16 }}>
              Bạn đã giữ thói quen suốt một tuần.
            </div>

            {/* 7 dots fill */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '14px 0', borderTop: '1px dashed rgba(122,112,80,0.4)', borderBottom: '1px dashed rgba(122,112,80,0.4)' }}>
              {[...Array(7)].map((_, i) => (
                <span key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: b.accentDeep, color: '#ede7d3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display-2)', fontSize: 14, fontWeight: 700 }}>✓</span>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <Mono style={{ color: '#7a7050' }}>Phần thưởng</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: b.accentDeep, marginTop: 2 }}>
                +1 lá số chi tiết · miễn phí
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#5a4f30' }}>
                Trị giá 39 lượng — bao gồm 5 phương diện.
              </div>
            </div>
          </div>
        </Ticket>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={{ width: '100%', background: b.accent, color: '#18150e', border: 'none', padding: '14px 20px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
          Mở lá số chi tiết
        </button>
        <button style={{ width: '100%', background: 'transparent', color: '#ede7d3', border: '1px solid rgba(200,188,152,0.4)', padding: '14px 20px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
          Chia sẻ niềm vui
        </button>
      </div>
    </div>
  );
}

// ─── 41 · Streak broken (gentle restart) ───
function HBStreakBroken() {
  const b = useB();
  return (
    <div style={HB_FOREST}>
      <BackBar dark subtitle="Thói quen · liền đã ngắt" title="Bắt đầu lại" onBack={() => {}} />
      <div style={{ paddingTop: 4 }} />
      <HBStreakRibbon days={4} total={7} broken />

      <div style={{ marginTop: 12 }}>
        <Ticket>
          <div style={{ padding: '24px 22px 20px', textAlign: 'center', position: 'relative' }}>
            <span style={{ fontFamily: 'var(--display-2)', fontSize: 64, color: '#7a7050', fontWeight: 800, lineHeight: 1, opacity: 0.4, letterSpacing: '-0.04em' }}>—</span>
            <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, margin: '10px 0 4px', letterSpacing: '-0.005em' }}>
              Liền 4 đã ngắt
            </h2>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: '#5a4f30', lineHeight: 1.55, marginBottom: 14 }}>
              Cuộc đời nhiều việc — chuyện thường.<br />
              Bắt đầu lại từ hôm nay nhé.
            </p>

            <div style={{ padding: '12px 0', borderTop: '1px dashed rgba(122,112,80,0.4)', borderBottom: '1px dashed rgba(122,112,80,0.4)' }}>
              <Mono style={{ color: '#7a7050' }}>Liền dài nhất · 12 ngày</Mono>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: '#3a3220', marginTop: 4 }}>
                03 → 14 / 09 / 2025
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <button style={{ width: '100%', background: b.accent, color: '#18150e', border: 'none', padding: '14px 20px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                Bắt đầu liền mới · ngày 1 / 7
              </button>
            </div>
          </div>
        </Ticket>
      </div>

      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,188,152,0.14)' }}>
        <Mono style={{ color: 'rgba(200,188,152,0.7)' }}>Bật nhắc nhở</Mono>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 13, color: '#ede7d3' }}>Nhắc mở app mỗi 7h sáng</span>
          <div style={{ width: 36, height: 18, background: b.accent, borderRadius: 9, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: '#18150e' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 42 · Push notification cadence (3-up iOS stack) ───
function HBNotifCadence() {
  const b = useB();
  const notifs = [
    { time: '07:00', title: 'Hôm nay 23 / 10 · ngày tốt', body: 'Tài tinh vượng — hợp ký kết. Giờ tốt nhất Thìn 7–9h.', kind: 'morning', label: 'AM' },
    { time: '06:55', title: 'Sắp đến giờ Thìn', body: 'Còn 5 phút nữa là khung giờ tốt nhất hôm nay (7–9h).', kind: 'best-hour', label: '★' },
    { time: 'CN 8:00', title: 'Tóm tắt tuần tới', body: '24 → 30 / 10 · 3 ngày A · 2 ngày B. Xem chi tiết →', kind: 'weekly', label: 'TUẦN' },
  ];
  return (
    <div style={{ ...HB_FOREST, padding: '0 14px 24px' }}>
      <BackBar dark subtitle="Thông báo · 3 nhịp" title="iPhone · khoá màn" onBack={() => {}} />
      <div style={{ padding: '0 6px 8px' }}>
      </div>

      {/* Lock-screen mock */}
      <div style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)', padding: '20px 12px', borderRadius: 24, border: '1px solid rgba(200,188,152,0.12)' }}>
        {/* Time */}
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.95)', marginBottom: 18 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em' }}>THỨ 5 · 23 / 10</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 56, fontWeight: 200, lineHeight: 1, marginTop: 2 }}>06:55</div>
        </div>

        {/* Notifs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map((n, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '10px 12px', display: 'flex', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: b.accentDeep, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: b.accent, fontWeight: 700, letterSpacing: '0.08em' }}>{n.label}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>NLTT</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, opacity: 0.7 }}>{n.time}</span>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 13, fontWeight: 600, marginTop: 1, lineHeight: 1.3 }}>{n.title}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 12, opacity: 0.85, marginTop: 1, lineHeight: 1.4 }}>{n.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 8, fontFamily: 'var(--serif)', fontSize: 12, color: 'rgba(200,188,152,0.8)' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: b.accent, letterSpacing: '0.12em' }}>07:00</span>
          <span>Thông báo sáng — tóm tắt hôm nay (mỗi ngày)</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: b.accent, letterSpacing: '0.12em' }}>−5 PHÚT</span>
          <span>Báo trước giờ tốt nhất (chỉ ngày A & B)</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: b.accent, letterSpacing: '0.12em' }}>CN 8:00</span>
          <span>Tóm tắt tuần tới (mỗi tuần)</span>
        </div>
      </div>

      <div style={{ marginTop: 14, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: 'rgba(200,188,152,0.55)', textAlign: 'center', lineHeight: 1.6 }}>
        Có thể tắt từng loại trong Cài đặt · Thông báo.
      </div>
    </div>
  );
}

// ─── 43 · Streak history (30-day grid) ───
function HBStreakHistory() {
  const b = useB();
  // 30 cells; some completed, some missed
  const cells = [...Array(30)].map((_, i) => {
    const day = i + 1;
    const missed = [4, 8, 16, 22, 25].includes(day);
    const today = day === 23;
    const future = day > 23;
    return { day, missed, today, future };
  });
  return (
    <div style={HB_FOREST}>
      <BackBar dark subtitle="Lịch sử · tháng 10 / 2025" title="Thói quen của bạn" onBack={() => {}} />
      <div style={{ padding: '0 0 12px' }} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
        {[
          ['18', 'Đã mở', '#3d6b4a'],
          ['5', 'Bỏ lỡ', '#8b1a1a'],
          ['12', 'Liền dài nhất', b.accent],
        ].map(([n, l, c]) => (
          <div key={l} style={{ background: '#ede7d3', padding: '10px 12px' }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: c, lineHeight: 1 }}>{n}</div>
            <Mono style={{ color: '#7a7050' }}>{l}</Mono>
          </div>
        ))}
      </div>

      <Ticket>
        <div style={{ padding: '14px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map(c => (
              <div key={c.day} style={{ aspectRatio: '1 / 1', background: c.future ? 'rgba(122,112,80,0.08)' : c.today ? '#18150e' : c.missed ? 'rgba(139,26,26,0.2)' : '#3d6b4a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {c.today ? (
                  <span style={{ fontFamily: 'var(--display-2)', fontSize: 13, color: b.accent, fontWeight: 800 }}>{c.day}</span>
                ) : c.future ? (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(122,112,80,0.6)' }}>{c.day}</span>
                ) : c.missed ? (
                  <span style={{ fontFamily: 'var(--display-2)', fontSize: 14, color: '#8b1a1a', fontWeight: 700 }}>×</span>
                ) : (
                  <span style={{ fontFamily: 'var(--display-2)', fontSize: 11, color: '#ede7d3', fontWeight: 700 }}>✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Ticket>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-around', fontFamily: 'var(--mono)', fontSize: 9, color: '#c8bc98', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        <span>✓ · đã mở</span>
        <span style={{ color: '#e58a5c' }}>× · bỏ lỡ</span>
        <span style={{ color: 'rgba(200,188,152,0.5)' }}>· · sắp tới</span>
      </div>
    </div>
  );
}

// ─── Notes ───
function HBNotes() {
  return (
    <div style={{ padding: '40px 56px', background: '#f1ece1', height: '100%', fontFamily: 'var(--serif)', color: '#18150e', overflow: 'auto', position: 'relative' }}>
      <div style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a7c22', borderBottom: '1px solid #c5a55a', paddingBottom: 4 }}>
        Section 2e · Habit loop
      </div>
      <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 36, lineHeight: 1.05, margin: '14px 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
        The reason to come back tomorrow.
      </h1>
      <p style={{ fontSize: 15, color: '#3a3220', lineHeight: 1.65, maxWidth: 720 }}>
        D7 retention is the unstated north-star. Currently nothing in the app rewards returning. This row builds the habit shell:
        a streak ribbon on Hôm nay, three notification nudges that match how almanac-readers actually use the day,
        a celebration when liền hits 7 (rewarded with a free lá số chi tiết), a forgiving restart for breaks,
        and a 30-day history that doubles as a sense of "the months are passing — keep going".
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 28 }}>
        {[
          ['39 · Hôm nay + liền', 'Streak ribbon (連 chữ + 7 dots) sits above the Today ticket. "Còn 2 ngày để giữ liền 7" framing — keeps users coming back without nagging.'],
          ['40 · Đủ 7 ngày', 'Celebration moment: 圓滿 chop slam, 7 吉 dots, free lá số chi tiết as reward. Mirrors the AI-Reading tear-off vocabulary.'],
          ['41 · Liền ngắt', 'Gentle restart with a "longest streak" stat. Tone: 惜 (tiếc) + Vietnamese-aunt patience, no shame.'],
          ['42 · 3 nhịp thông báo', 'Lock-screen mock with morning summary (07:00) + best-hour pre-notice (−5 phút) + Sunday weekly digest. Tied to /thong-bao-quyen.'],
          ['43 · Lịch sử 30 ngày', '30-cell month grid — 吉 / × / · — plus stats. Same calendar as /lich-thang but answers a different question (your behavior, not the days\').'],
        ].map(([t, d]) => (
          <div key={t} style={{ borderTop: '2px solid #18150e', paddingTop: 12 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>{t}</div>
            <div style={{ fontSize: 13, color: '#3a3220', marginTop: 6, lineHeight: 1.55 }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(197,165,90,0.18)', borderLeft: '3px solid #c5a55a' }}>
        <Mono style={{ color: '#9a7c22' }}>Implementation note</Mono>
        <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6, color: '#3a3220' }}>
          Streak counter belongs server-side (resets at user's local 24:00, not UTC). Celebration trigger fires once on day-7 hit; subsequent 14, 21, 30-day milestones can reuse same template with different rewards (lá số chi tiết → vận tháng → vận năm).
        </p>
      </div>
    </div>
  );
}

// ─── Animations ───
if (!document.getElementById('hb-anims')) {
  const s = document.createElement('style');
  s.id = 'hb-anims';
  s.textContent = `
    @keyframes hb-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  `;
  document.head.appendChild(s);
}

Object.assign(window, { HBStreakHome, HBStreak7, HBStreakBroken, HBNotifCadence, HBStreakHistory, HBNotes, HBStreakRibbon });
