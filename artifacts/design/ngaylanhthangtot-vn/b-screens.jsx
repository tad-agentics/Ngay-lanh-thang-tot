/* B-system PWA screens. Globals: OnboardingA/B/C, LaSoCenterfold, ShareCard, NotificationDemo, SettingsScreen, EmptyResult, LoadingResult, TicketVariant1/2/3, ResultMotion, HomeMotion */
/* global React, useB, Ticket, Kanji, Mono, Logo, Stamp, StatusBar, HomeIndicator, ScoreCounter */
const { useState, useEffect } = React;

// shared phrasings — depend on tone
function copy(tone) {
  if (tone === 'modern') {
    return {
      heroKicker: 'Lịch xem ngày · 2026',
      todayLabel: 'Hôm nay tốt cho bạn',
      should: 'Nên làm',
      avoid: 'Tránh',
      verdict: (s) => s >= 80 ? 'Ngày tốt' : s >= 65 ? 'Ngày khá' : s >= 45 ? 'Bình thường' : 'Không nên',
      ticketLabel: 'Phiếu xem ngày',
      saveCalendar: 'Lưu vào lịch',
      sendFamily: 'Gửi cho cả nhà',
    };
  }
  return {
    heroKicker: 'Niên giám điện tử · Bính Ngọ 2026',
    todayLabel: 'Nhật khóa hôm nay',
    should: 'Nghi',
    avoid: 'Kỵ',
    verdict: (s) => s >= 80 ? 'Đại cát' : s >= 65 ? 'Cát' : s >= 45 ? 'Bình' : 'Hung',
    ticketLabel: 'Phiếu trạch nhật',
    saveCalendar: 'Niêm vào lịch',
    sendFamily: 'Gửi cả nhà',
  };
}

// ═══════════════════════════════════════════════════════════
// Onboarding — 3 steps, each its own screen
// ═══════════════════════════════════════════════════════════
function OnboardingA() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark />
      <Kanji ch="始" size={500} style={{ position: 'absolute', top: 40, right: -160 }} />
      <div style={{ padding: '24px 28px 0' }}><Logo dark size={32} /></div>
      <div style={{ flex: 1, padding: '36px 28px 0', position: 'relative' }}>
        <Mono style={{ color: b.accent }}>Bước 1 / 3 · Mở quẻ</Mono>
        <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 56, color: '#ede7d3', lineHeight: 0.95, margin: '14px 0 16px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Nói cho tôi<br /><span style={{ color: b.accent }}>bạn là ai</span>
        </h1>
        <p style={{ color: '#7a9a80', fontSize: 16, lineHeight: 1.6, fontFamily: 'var(--serif)', maxWidth: 320 }}>
          Lá số tứ trụ cần ngày, tháng, năm và giờ sinh. Sai một giờ — sai cả luận đoán. Cứ thong thả.
        </p>
        <div style={{ marginTop: 32, display: 'grid', gap: 12 }}>
          {[['Họ tên', 'Để hiển thị trên phiếu'], ['Ngày sinh', 'Theo dương lịch hoặc âm lịch'], ['Giờ sinh', 'Quan trọng nhất — hỏi người lớn']].map(([t, h]) => (
            <div key={t} style={{ padding: '14px 16px', background: 'rgba(237,231,211,0.06)', border: '1px solid rgba(197,165,90,0.25)' }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: '#ede7d3', fontSize: 15 }}>{t}</div>
              <Mono style={{ color: '#7a9a80', marginTop: 2 }}>{h}</Mono>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '20px 28px 8px' }}>
        <button style={{ width: '100%', padding: 16, background: b.accent, color: '#1d3129', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bắt đầu →</button>
        <Mono style={{ display: 'block', textAlign: 'center', color: '#7a9a80', marginTop: 12, fontSize: 9 }}>Mã hóa AES-256 · không bán dữ liệu</Mono>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

function OnboardingB() {
  const b = useB();
  const [hour, setHour] = useState(3);
  const hours = [['Tý', '23–1h'], ['Sửu', '1–3h'], ['Dần', '3–5h'], ['Mão', '5–7h'], ['Thìn', '7–9h'], ['Tỵ', '9–11h'], ['Ngọ', '11–13h'], ['Mùi', '13–15h'], ['Thân', '15–17h'], ['Dậu', '17–19h'], ['Tuất', '19–21h'], ['Hợi', '21–23h']];
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark />
      <Kanji ch="時" size={420} style={{ position: 'absolute', top: 60, left: -120 }} />
      <div style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 18 }}>←</span>
        <Mono style={{ color: '#7a9a80' }}>2 / 3</Mono>
      </div>
      <div style={{ flex: 1, padding: '20px 28px 0', position: 'relative' }}>
        <Mono style={{ color: b.accent }}>Giờ sinh — 12 canh giờ</Mono>
        <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 44, color: '#ede7d3', lineHeight: 1, margin: '14px 0 12px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Bạn sinh<br />vào canh nào?
        </h1>
        <p style={{ color: '#7a9a80', fontSize: 14, lineHeight: 1.5, fontFamily: 'var(--serif)' }}>
          Không nhớ chính xác? Chọn khoảng — chúng tôi đối chiếu với mệnh sau.
        </p>
        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {hours.map(([n, h], i) => {
            const sel = i === hour;
            return (
              <div key={n} style={{ padding: '12px 6px', textAlign: 'center', background: sel ? b.accent : 'transparent', border: `1px solid ${sel ? b.accent : 'rgba(197,165,90,0.3)'}` }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: sel ? '#1d3129' : '#ede7d3', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1, marginBottom: 2 }}>{n}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: sel ? '#1d3129' : '#7a9a80', marginTop: 1 }}>{h}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, padding: '10px 12px', borderLeft: `2px solid ${b.accent}`, background: 'rgba(197,165,90,0.06)' }}>
          <Mono style={{ color: b.accent }}>Đã chọn · Mão</Mono>
          <div style={{ fontSize: 13, color: '#ede7d3', marginTop: 2, fontFamily: 'var(--serif)' }}>5h–7h sáng · trụ giờ <strong style={{ color: b.accent, fontFamily: 'var(--display-2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Ất Mão · Mộc</strong></div>
        </div>
      </div>
      <div style={{ padding: '16px 28px 8px' }}>
        <button style={{ width: '100%', padding: 16, background: b.accent, color: '#1d3129', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tiếp →</button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

function OnboardingC() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark />
      <Kanji ch="成" size={520} style={{ position: 'absolute', bottom: -130, right: -120 }} />
      <div style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 18 }}>←</span>
        <Mono style={{ color: '#7a9a80' }}>3 / 3</Mono>
      </div>
      <div style={{ flex: 1, padding: '20px 22px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Mono style={{ color: b.accent, alignSelf: 'flex-start' }}>Lá số đã sẵn sàng</Mono>
        <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 32, color: '#ede7d3', lineHeight: 1.05, margin: '8px 0 18px', alignSelf: 'flex-start', textTransform: 'uppercase' }}>
          Đây là phiếu đầu tiên<br />của bạn — miễn phí.
        </h1>
        <Ticket holes holeColor="#1d3129" transform="rotate(-2deg)" style={{ width: 300 }} stub stubLabel="Phiếu chào mừng">
          <div style={{ padding: '14px 18px 6px' }}>
            <Mono style={{ color: '#9a7c22' }}>Hôm nay · 09 / 05</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 64, color: '#1d3129', lineHeight: 0.9, marginTop: 6 }}>78</div>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: '#9a7c22', textTransform: 'uppercase', marginTop: 2, fontSize: 16 }}>Ngày tốt</div>
            <p style={{ fontSize: 13, color: '#3a3220', fontFamily: 'var(--serif)', fontStyle: 'italic', margin: '8px 0 12px' }}>"Quý Thủy gặp Mộc — phát biểu, ký kết được lòng"</p>
          </div>
        </Ticket>
        <button style={{ width: '100%', padding: 16, background: b.accent, color: '#1d3129', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 24 }}>Mở phiếu của tôi →</button>
        <Mono style={{ color: '#7a9a80', marginTop: 10 }}>20 lượng tặng — đủ 26 việc</Mono>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Lá số centrefold (full tứ trụ page)
// ═══════════════════════════════════════════════════════════
function LaSoCenterfold() {
  const b = useB();
  const pillars = [
    ['Niên', '庚午', 'Canh Ngọ', 'Kim'],
    ['Nguyệt', '癸未', 'Quý Mùi', 'Thủy'],
    ['Nhật', '癸巳', 'Quý Tỵ', 'Thủy', true],
    ['Thời', '乙卯', 'Ất Mão', 'Mộc'],
  ];
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <Kanji ch="命" size={460} style={{ position: 'absolute', top: 200, left: '50%', transform: 'translateX(-50%)', opacity: 0.7 }} />
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 16 }}>←</span>
        <div style={{ flex: 1 }}>
          <Mono style={{ color: b.accent }}>Lá số tứ trụ</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: '#ede7d3' }}>Nguyễn Thị Minh · Nữ</div>
        </div>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 14 }}>↗</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 14px', position: 'relative' }}>
        {/* Centrefold meta */}
        <div style={{ textAlign: 'center', padding: '10px 0 16px', borderBottom: '1px solid rgba(197,165,90,0.2)' }}>
          <Mono style={{ color: '#7a9a80' }}>Sinh 20 / 05 / 1990 · giờ Mão</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: b.accent, fontSize: 22, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mệnh Thủy · Quý Tỵ</div>
          <div style={{ fontSize: 12, color: '#7a9a80', marginTop: 2, fontStyle: 'italic', fontFamily: 'var(--serif)' }}>"Trường Lưu Thủy — nước sông dài, hợp người làm việc bền"</div>
        </div>

        {/* 4 pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 14 }}>
          {pillars.map(([label, hz, vn, ng, hi], i) => (
            <div key={i} style={{ padding: '10px 6px', textAlign: 'center', background: hi ? 'rgba(197,165,90,0.12)' : 'transparent', border: `1px solid ${hi ? b.accent : 'rgba(197,165,90,0.25)'}` }}>
              <Mono style={{ color: '#7a9a80', fontSize: 9 }}>{label}</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: hi ? b.accent : '#ede7d3', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1, margin: '6px 0 4px' }}>{vn}</div>
              <Mono style={{ color: hi ? b.accent : '#7a9a80', fontSize: 9, marginTop: 2, display: 'block' }}>{ng}</Mono>
            </div>
          ))}
        </div>

        {/* Five elements ring */}
        <div style={{ marginTop: 18, padding: '14px 0', borderTop: '1px dashed rgba(197,165,90,0.25)', borderBottom: '1px dashed rgba(197,165,90,0.25)' }}>
          <Mono style={{ color: b.accent, display: 'block', marginBottom: 10 }}>Ngũ hành — sức mạnh trong lá số</Mono>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {[['Mộc', 25, '#7a9a80'], ['Hỏa', 10, '#c5402a'], ['Thổ', 18, '#9a7c22'], ['Kim', 22, '#c8c5a0'], ['Thủy', 25, b.accent]].map(([n, v, c]) => (
              <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#ede7d3', fontWeight: 600, marginBottom: 4 }}>{v}%</div>
                <div style={{ width: '70%', height: `${v * 2}%`, background: c, opacity: 0.8 }} />
                <Mono style={{ color: '#ede7d3', marginTop: 4 }}>{n}</Mono>
              </div>
            ))}
          </div>
        </div>

        {/* Dụng / kỵ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <div style={{ borderTop: `2px solid ${b.accent}`, padding: '10px 12px', background: 'rgba(197,165,90,0.06)' }}>
            <Mono style={{ color: b.accent }}>Dụng thần</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: '#ede7d3', textTransform: 'uppercase', marginTop: 2 }}>Mộc · Hỏa</div>
            <div style={{ fontSize: 11, color: '#7a9a80', marginTop: 2, fontFamily: 'var(--serif)' }}>Tăng vượng cho hành Thủy của bạn</div>
          </div>
          <div style={{ borderTop: '2px solid #8b1a1a', padding: '10px 12px', background: 'rgba(139,26,26,0.08)' }}>
            <Mono style={{ color: '#d88080' }}>Kỵ thần</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: '#ede7d3', textTransform: 'uppercase', marginTop: 2 }}>Thổ · Kim</div>
            <div style={{ fontSize: 11, color: '#7a9a80', marginTop: 2, fontFamily: 'var(--serif)' }}>Tránh trong việc đại sự</div>
          </div>
        </div>

        {/* Vận hạn */}
        <div style={{ marginTop: 16 }}>
          <Mono style={{ color: b.accent }}>Đại vận — 10 năm tới</Mono>
          <div style={{ marginTop: 8 }}>
            {[['2024–2033', 'Bính Thân', 'Hỏa Kim — chuyển nghề, hợp đầu tư', true], ['2034–2043', 'Đinh Dậu', 'Hỏa Kim — củng cố, tích lũy', false]].map(([y, t, n, hi]) => (
              <div key={y} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px dashed rgba(197,165,90,0.18)' }}>
                <Mono style={{ color: hi ? b.accent : '#7a9a80', minWidth: 80 }}>{y}</Mono>
                <div style={{ flex: 1 }}>
                  <span style={{ color: hi ? b.accent : '#ede7d3', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.02em', marginRight: 8, textTransform: 'uppercase' }}>{['Bính Thân', 'Đinh Dậu'][hi ? 0 : 1]}</span>
                  <span style={{ color: '#c8bc98', fontFamily: 'var(--serif)', fontSize: 12 }}>{t}</span>
                  <div style={{ fontSize: 11, color: '#7a9a80', marginTop: 1, fontFamily: 'var(--serif)' }}>{n}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Share card preview (Zalo / Messenger)
// ═══════════════════════════════════════════════════════════
function ShareCard() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 16 }}>×</span>
        <div style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: '#ede7d3' }}>Gửi cho cả nhà</div>
      </div>
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
        <Mono style={{ color: b.accent }}>Xem trước · Phiếu chia sẻ</Mono>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
          <Ticket holes={false} transform="rotate(1.5deg)" style={{ width: 320 }} stub stubLabel="Cắt theo đường này">
            <div style={{ padding: '16px 20px 10px', textAlign: 'center', position: 'relative' }}>
              <Stamp ch="吉日" style={{ position: 'absolute', top: 10, right: 12, animation: 'b-stamp-in 1.4s ease-out' }} />
              <Mono style={{ color: '#9a7c22' }}>Khai trương cửa hàng · Anh Minh</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: '#1d3129', marginTop: 8, textTransform: 'uppercase' }}>Thứ Tư</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 84, color: '#1d3129', lineHeight: 0.85, letterSpacing: '-0.04em', margin: '4px 0' }}>17 / 06</div>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: '#1d3129', color: b.accent, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>92 / 100 · Đại cát</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, color: '#9a7c22', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 12 }}>Mộc · Giáp Dần</div>
              <p style={{ fontSize: 13, color: '#3a3220', fontStyle: 'italic', fontFamily: 'var(--serif)', margin: '8px 0 4px' }}>"Thiên Đức · Nguyệt Đức cùng đến — đại cát cho khai trương"</p>
              <Mono style={{ color: '#7a7050' }}>Giờ đẹp: Tỵ 9–11h</Mono>
            </div>
          </Ticket>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
          {['Zalo', 'Mess', 'Lưu', 'Sao chép'].map((t) => (
            <div key={t} style={{ padding: '12px 0', textAlign: 'center', border: '1px solid rgba(197,165,90,0.3)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: b.accent }}>↗</div>
              <Mono style={{ color: '#ede7d3', fontSize: 9 }}>{t}</Mono>
            </div>
          ))}
        </div>
        <button style={{ padding: 14, background: b.accent, color: '#1d3129', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gửi qua Zalo →</button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Notification — daily phiếu push
// ═══════════════════════════════════════════════════════════
function NotificationDemo() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: 'linear-gradient(180deg, #2a3d54 0%, #1a2638 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '50px 0 14px', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, opacity: 0.6, letterSpacing: '0.05em' }}>Thứ Bảy, 09 tháng 5</div>
        <div style={{ fontFamily: 'system-ui', fontSize: 92, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 6 }}>9:41</div>
      </div>
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Today's phiếu push */}
        <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)', borderRadius: 16, padding: '12px 14px', display: 'flex', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1d3129', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="assets/logo-mark.svg" width="22" height="22" alt="" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600 }}>Ngày Lành Tháng Tốt</span>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#666' }}>vừa xong</span>
            </div>
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 600, color: '#000', marginTop: 2 }}>Hôm nay điểm 78 — ngày tốt cho bạn</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 13, color: '#444', marginTop: 1, lineHeight: 1.35 }}>Hợp ký kết · cầu tài · họp mặt. Giờ đẹp: Tỵ 9–11h.</div>
          </div>
        </div>

        {/* Reminder push */}
        <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px)', borderRadius: 16, padding: '12px 14px', display: 'flex', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#8b1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--display-2)', color: '#ede7d3', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>!</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600 }}>Ngày Lành Tháng Tốt</span>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#666' }}>2 giờ trước</span>
            </div>
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 600, color: '#000', marginTop: 2 }}>Khai trương — 7 ngày nữa</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 13, color: '#444', marginTop: 1, lineHeight: 1.35 }}>T4 17/06 · Tỵ 9–11h. Đã lưu vào lịch.</div>
          </div>
        </div>

        {/* Settings tease */}
        <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: 16, padding: '12px 14px', display: 'flex', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#9a7c22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--display-2)', color: '#ede7d3', fontWeight: 800, fontSize: 14, lineHeight: 1 }}>▦</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600 }}>Ngày Lành Tháng Tốt</span>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#666' }}>hôm qua</span>
            </div>
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 600, color: '#000', marginTop: 2 }}>Tuần tới: 3 ngày tốt cho cưới hỏi</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 13, color: '#444', marginTop: 1, lineHeight: 1.35 }}>Mở app để xem chi tiết →</div>
          </div>
        </div>

        <div style={{ padding: '14px 8px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255,255,255,0.15)', borderRadius: 999, color: '#fff', fontFamily: 'system-ui', fontSize: 12, fontWeight: 500 }}>Cấu hình thông báo →</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Settings
// ═══════════════════════════════════════════════════════════
function SettingsScreen() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <div style={{ padding: '4px 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 16 }}>←</span>
        <div style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: '#ede7d3' }}>Cài đặt</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <Mono style={{ color: b.accent, display: 'block', marginBottom: 10 }}>Lá số của tôi</Mono>
        <div style={{ padding: 14, background: 'rgba(237,231,211,0.06)', border: `1px solid ${b.accent}`, marginBottom: 18 }}>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: '#ede7d3', fontSize: 16 }}>Nguyễn Thị Minh</div>
          <Mono style={{ color: '#7a9a80', display: 'block', marginTop: 2 }}>20/05/1990 · giờ Mão · Nữ</Mono>
          <div style={{ marginTop: 8, fontFamily: 'var(--display-2)', color: b.accent, fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quý Thủy · mệnh Thủy</div>
        </div>

        {[
          ['Thông báo', [
            ['Phiếu hôm nay', '7:00 sáng', true],
            ['Nhắc trước việc đã lưu', '7 ngày trước', true],
            ['Cảnh báo Tam Tai', 'Tự động', false],
          ]],
          ['Hiển thị', [
            ['Lịch âm song song', 'Bật', true],
            ['Tiếng Việt cổ điển', 'Phiếu trạch nhật, nghi/kỵ', false],
          ]],
          ['Lượng & gói', [
            ['Số dư', '20 lượng', null],
            ['Gói hiện tại', 'Miễn phí', null],
            ['Tự động nạp', 'Khi còn ≤ 5', false],
          ]],
        ].map(([title, items], i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <Mono style={{ color: b.accent, display: 'block', marginBottom: 8 }}>{title}</Mono>
            <div style={{ border: '1px solid rgba(197,165,90,0.22)' }}>
              {items.map(([label, val, on], j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 14px', borderTop: j ? '1px solid rgba(197,165,90,0.18)' : 'none' }}>
                  <div>
                    <div style={{ color: '#ede7d3', fontFamily: 'var(--serif)', fontSize: 14 }}>{label}</div>
                    <Mono style={{ color: '#7a9a80', display: 'block', marginTop: 2 }}>{val}</Mono>
                  </div>
                  {on != null && (
                    <div style={{ width: 38, height: 22, borderRadius: 999, background: on ? b.accent : 'rgba(237,231,211,0.15)', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: on ? '#1d3129' : '#ede7d3', transition: 'all 0.2s' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ padding: '14px 0', textAlign: 'center', borderTop: '1px solid rgba(197,165,90,0.2)' }}>
          <Mono style={{ color: '#7a9a80', display: 'block' }}>Đăng xuất · Xóa tài khoản</Mono>
          <Mono style={{ color: '#7a9a80', fontSize: 9, marginTop: 6, display: 'block' }}>v1.4.2 · ngaylanhthangtot.vn</Mono>
        </div>
      </div>
      {window.BottomNav ? <window.BottomNav active="me" /> : null}
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Empty / Loading states
// ═══════════════════════════════════════════════════════════
function EmptyResult() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Kanji ch="空" size={500} style={{ position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)', opacity: 0.5 }} />
      <StatusBar dark />
      <div style={{ padding: '4px 16px 14px', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: b.accent, fontFamily: 'var(--mono)', fontSize: 16 }}>←</span>
        <div style={{ marginLeft: 12, flex: 1, color: '#ede7d3', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16 }}>Việc của bạn</div>
      </div>
      <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
        <div style={{ width: 280, position: 'relative' }}>
          <Ticket holes={false} transform="rotate(-3deg)" style={{ width: '100%', opacity: 0.4 }}>
            <div style={{ padding: '40px 20px', minHeight: 200 }}>
              <div style={{ height: 12, width: '60%', background: 'rgba(122,112,80,0.2)', margin: '0 auto 14px' }} />
              <div style={{ height: 50, width: '70%', background: 'rgba(122,112,80,0.18)', margin: '0 auto 14px' }} />
              <div style={{ height: 8, background: 'rgba(122,112,80,0.15)', margin: '0 auto 6px' }} />
              <div style={{ height: 8, width: '80%', background: 'rgba(122,112,80,0.15)', margin: '0 auto' }} />
            </div>
          </Ticket>
        </div>
        <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, color: '#ede7d3', fontSize: 26, marginTop: 30, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
          Chưa có việc nào<br />trong sổ
        </h2>
        <p style={{ color: '#7a9a80', fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--serif)', maxWidth: 280, marginTop: 10 }}>
          Khai trương, cưới hỏi, ký kết — cứ thêm vào, hệ thống sẽ tìm ngày hợp mệnh trong khoảng bạn cần.
        </p>
        <button style={{ marginTop: 20, padding: '14px 28px', background: b.accent, color: '#1d3129', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>+ Thêm việc đầu tiên</button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

function LoadingResult() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <Kanji ch="算" size={500} style={{ position: 'absolute', top: 80, right: -120, animation: 'b-drift 22s ease-in-out infinite' }} />
      <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: 130, height: 130 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${b.accent}`, opacity: 0.4 }} />
          <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: `1px dashed ${b.accent}`, opacity: 0.6, animation: 'spin 8s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 56, fontWeight: 700, animation: 'b-flutter 1.4s ease-in-out infinite' }}>算</div>
        </div>
        <Mono style={{ color: b.accent, marginTop: 26 }}>Đang luận đoán</Mono>
        <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, color: '#ede7d3', fontSize: 22, marginTop: 8, textTransform: 'uppercase' }}>
          Đối chiếu lá số<br />với 90 ngày tới
        </h2>
        <div style={{ marginTop: 20, display: 'grid', gap: 6, width: '100%', maxWidth: 240 }}>
          {[
            ['Ngọc Hạp · Thông Thư', true],
            ['Tam Sát · Tuế Phá', true],
            ['Cát thần · 26 việc', false],
          ].map(([t, done], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${b.accent}`, background: done ? b.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#1d3129' }}>{done ? '✓' : ''}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: done ? '#ede7d3' : '#7a9a80', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 3 Ticket variants — visual exploration
// ═══════════════════════════════════════════════════════════
function TicketVariant({ title, description, perforation, kanjiOpacity = 0.2, accent = '#c5a55a', stamp = false, frame = 'plain' }) {
  return (
    <div style={{ width: 320, padding: '20px 16px 36px', background: '#1d3129', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ alignSelf: 'flex-start', marginBottom: 14 }}>
        <Mono style={{ color: accent }}>{title}</Mono>
        <div style={{ fontSize: 13, color: '#7a9a80', maxWidth: 280, marginTop: 4, fontFamily: 'var(--serif)', lineHeight: 1.4 }}>{description}</div>
      </div>
      <BCtxOverride perforation={perforation} kanjiDensity={kanjiOpacity} accent={accent}>
        <div style={{ width: 280, position: 'relative', padding: frame === 'frame' ? 8 : 0, border: frame === 'frame' ? `1px solid ${accent}` : 'none' }}>
          <Ticket holes={frame !== 'frame'} holeColor="#1d3129" stub stubLabel="·NLTT·">
            <div style={{ padding: '16px 18px 8px', textAlign: 'center', position: 'relative' }}>
              {stamp && <Stamp ch="吉日" style={{ position: 'absolute', top: 8, right: 12 }} />}
              <Mono style={{ color: accent }}>Thứ Tư · 17/06</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 76, color: '#1d3129', lineHeight: 0.85, letterSpacing: '-0.04em', marginTop: 6 }}>92</div>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: '#1d3129', color: accent, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>Đại cát · Khai trương</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, color: accent, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 12 }}>Mộc · Giáp Dần</div>
            </div>
          </Ticket>
        </div>
      </BCtxOverride>
    </div>
  );
}

function BCtxOverride({ perforation, kanjiDensity, accent, children }) {
  // simple inline override using BProvider via render-prop avoidance
  const v = { perforation: perforation || 'classic', kanjiDensity: kanjiDensity ?? 0.18, accent: accent || '#c5a55a', accentDeep: accent || '#9a7c22', tone: 'classical' };
  return <window.BCtx.Provider value={v}>{children}</window.BCtx.Provider>;
}

function TicketVariants() {
  return (
    <div style={{ width: 1100, height: 600, background: '#243a30', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 30, position: 'relative', overflow: 'hidden' }}>
      <Kanji ch="籤" size={700} style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', opacity: 0.6 }} />
      <div style={{ position: 'relative', display: 'flex', gap: 20 }}>
        <TicketVariant title="V1 · Classic perf" description="Dashed line + pin holes. The current default — feels like a temple raffle ticket." perforation="classic" kanjiOpacity={0.2} accent="#c5a55a" stamp />
        <TicketVariant title="V2 · Sharp zigzag" description="Tighter zigzag perforation, denser kanji watermark, no holes — feels more like a bank draft." perforation="sharp" kanjiOpacity={0.32} accent="#c5a55a" frame="frame" />
        <TicketVariant title="V3 · Vermillion stamp" description="Wave perforation, deeper red chop, gold reduced to highlight only — most ceremonial." perforation="wave" kanjiOpacity={0.18} accent="#9a7c22" stamp />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Motion samples
// ═══════════════════════════════════════════════════════════
function ResultMotion() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setK((k) => k + 1), 4500);
    return () => clearInterval(i);
  }, []);
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <div style={{ padding: '4px 16px 14px' }}><Mono style={{ color: b.accent }}>Motion · score count + stamp</Mono></div>
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
        <div key={k}>
          <Ticket holes transform="rotate(-1deg)" style={{ width: 280 }} stub stubLabel="Phiếu lưu — đối chiếu">
            <div style={{ padding: '16px 18px 6px', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, right: 12, animation: 'b-stamp-in 1.4s 0.6s ease-out backwards' }}>
                <Stamp ch="吉日" />
              </div>
              <Mono style={{ color: '#9a7c22' }}>Thứ Tư · 17/06</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 96, color: '#1d3129', lineHeight: 0.85, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                <CountUp to={92} />
              </div>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: '#1d3129', color: b.accent, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Đại cát</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, color: '#9a7c22', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 10 }}>Mộc · Giáp Dần</div>
            </div>
          </Ticket>
        </div>
        <div style={{ marginTop: 18, padding: '8px 14px', border: `1px dashed ${b.accent}`, color: b.accent, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loops every 4.5s</div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

function CountUp({ to = 92 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start = null;
    const dur = 1400;
    const step = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(Math.round(eased * to));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{v}</span>;
}

function HomeMotion() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Kanji ch="日" size={420} style={{ position: 'absolute', top: 80, right: -120, opacity: 0.18, animation: 'b-drift 18s ease-in-out infinite' }} />
      <Kanji ch="月" size={300} style={{ position: 'absolute', bottom: 80, left: -90, opacity: 0.14, animation: 'b-drift 26s ease-in-out infinite reverse' }} />
      <StatusBar dark />
      <div style={{ padding: '4px 16px 14px' }}><Mono style={{ color: b.accent }}>Motion · drifting kanji watermark</Mono></div>
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
        <Mono style={{ color: b.accent }}>Niên giám · 09 tháng 5</Mono>
        <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 110, color: b.accent, lineHeight: 0.85, letterSpacing: '-0.04em', margin: '6px 0 0' }}>78</div>
        <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: '#ede7d3', fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Ngày tốt</div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

function TearMotion() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setK((k) => k + 1), 3500);
    return () => clearInterval(i);
  }, []);
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: '#1d3129', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <div style={{ padding: '4px 16px 14px' }}><Mono style={{ color: b.accent }}>Motion · tear-off on save</Mono></div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '20px 0 0', overflow: 'hidden' }}>
        <div key={k} style={{ animation: 'b-tear 3s ease-in 1s forwards', width: 280 }}>
          <Ticket holes transform="rotate(-1deg)" style={{ width: '100%' }} stub stubLabel="Phiếu lưu">
            <div style={{ padding: '16px 18px 6px', textAlign: 'center' }}>
              <Mono style={{ color: '#9a7c22' }}>Thứ Tư · 17/06</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 80, color: '#1d3129', lineHeight: 0.85, marginTop: 4 }}>92</div>
              <div style={{ display: 'inline-block', padding: '4px 12px', background: '#1d3129', color: b.accent, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>Đã lưu vào lịch ✓</div>
            </div>
          </Ticket>
        </div>
        <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center', color: '#7a9a80', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loops every 3.5s</div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

Object.assign(window, { OnboardingA, OnboardingB, OnboardingC, LaSoCenterfold, ShareCard, NotificationDemo, SettingsScreen, EmptyResult, LoadingResult, TicketVariants, ResultMotion, HomeMotion, TearMotion, CountUp });
