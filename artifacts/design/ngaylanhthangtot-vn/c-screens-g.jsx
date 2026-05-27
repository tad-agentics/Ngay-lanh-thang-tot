/* Direction C — screens part G. LLM luận giải — 3 components.
   1. Typed reveal (streaming AI answer to "tại sao điểm này")
   2. Sectioned card with source citations
   3. Lá số chi tiết — full chart view with AI commentary */
/* global React, useB, Logo, LogoMark, Mono, StatusBar, HomeIndicator,
   CT, PROFILE, CBackBar */
const { useState: cgUseState, useEffect: cgUseEffect } = React;

// ═══════════════════════════════════════════════════════════════════
// AI 1 · Typed reveal — user just tapped "Tại sao 76 điểm?" on Hôm nay
// ═══════════════════════════════════════════════════════════════════
function CAITyped() {
  // Mock typed text — render with caret
  const fullText = "Hôm nay ngày Mậu Tuất — Thổ. Mệnh bạn là Quý Thủy, Thổ khắc Thủy, lẽ ra phải xấu. Nhưng giờ Thìn buổi sáng có Mộc khí vượng — Mộc khắc Thổ, hoá giải được. Vì vậy buổi sáng tốt cho ký kết, nhưng sang chiều khi Mộc khí lui, Thổ vượng trở lại — không nên động";
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Luận giải · ngày 26.05" right={<Mono style={{ color: CT.muted, fontSize: 9 }}>AI</Mono>} />

      <div style={{ flex: 1, padding: '8px 24px 24px', overflow: 'auto' }}>
        {/* User question pinned at top */}
        <div style={{ padding: '12px 14px', background: 'rgba(154,124,34,0.06)', borderLeft: `2px solid ${CT.goldDeep}` }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Bạn hỏi</Mono>
          <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, color: CT.ink2, lineHeight: 1.5 }}>
            "Tại sao hôm nay chỉ được 76 điểm với mệnh của tôi?"
          </div>
        </div>

        {/* Streaming response */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: CT.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, overflow: 'hidden' }}>
            <img src="assets/logo-mark-reversed.svg" width="22" height="22" alt="" />
          </div>
          <div style={{ flex: 1 }}>
            <Mono style={{ color: CT.muted, fontSize: 9 }}>NLTT đang luận</Mono>
            <p style={{ marginTop: 6, fontFamily: 'var(--serif)', fontSize: 14, color: CT.ink, lineHeight: 1.65, margin: 0 }}>
              {fullText}<span style={{ display: 'inline-block', width: 7, height: 14, background: CT.ink, marginLeft: 2, verticalAlign: 'middle', animation: 'b-cursor-blink 1s steps(2) infinite' }} />
            </p>
            <style>{`@keyframes b-cursor-blink { 50% { opacity: 0; } }`}</style>
          </div>
        </div>

        {/* Source attribution forming */}
        <div style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${CT.hairline}`, fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted, lineHeight: 1.5 }}>
          Đang đối chiếu với: <span style={{ color: CT.ink2 }}>Hiệp Kỷ Biện Phương</span>, <span style={{ color: CT.ink2 }}>Ngọc Hạp Thông Thư</span>…
        </div>

        {/* Quick follow-up suggestions */}
        <div style={{ marginTop: 22 }}>
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Hỏi tiếp</Mono>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Giờ nào trong ngày tốt nhất?', 'Hôm nay có nên ký hợp đồng không?', 'So sánh với ngày mai'].map(q => (
              <div key={q} style={{ padding: '10px 14px', background: '#fff', border: `1px solid ${CT.hairline}`, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink2, cursor: 'pointer' }}>{q}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom input bar */}
      <div style={{ padding: '10px 20px 20px', background: CT.paper, borderTop: `1px solid ${CT.hairline}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', border: `1px solid ${CT.hairline}`, borderRadius: 999 }}>
          <input type="text" placeholder="Hỏi tiếp về ngày này..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink }} />
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: CT.forest, color: CT.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', cursor: 'pointer' }}>↑</span>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AI 2 · Sectioned card with source citations — full luận giải of today
// ═══════════════════════════════════════════════════════════════════
function CAISectioned() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Luận giải đầy đủ" right={<Mono style={{ color: CT.muted, fontSize: 9 }}>Có nguồn</Mono>} />

      <div style={{ flex: 1, padding: '8px 24px 24px', overflow: 'auto' }}>
        {/* Date pill */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: CT.ink, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>26.05.2026</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 12, color: CT.muted }}>· Thứ Ba · ngày Mậu Tuất</span>
        </div>

        {/* Sections with citations */}
        {[
          {
            title: 'Trực ngày',
            verdict: 'Định',
            body: 'Trực Định — vững vàng, định đoạt. Hợp ký kết, định ước, an cư. Tránh khởi sự lớn vì Định khó chuyển.',
            src: '[1]',
            score: '+24',
          },
          {
            title: 'Nhị thập bát tú',
            verdict: 'Sao Thiên Đức',
            body: 'Thiên Đức tinh đáo nhật — phúc đức tinh chiếu. Hộ trì việc thiện, đặc biệt hợp khai trương, cưới hỏi.',
            src: '[2]',
            score: '+20',
          },
          {
            title: 'Can chi · tương sinh với lá số bạn',
            verdict: 'Mậu Tuất → Quý Thủy',
            body: 'Mậu Thổ khắc Quý Thủy — về cơ bản kỵ. Nhưng trong tứ trụ bạn có trụ Nhật Quý Tỵ, Tỵ là Hỏa sinh Thổ — quan hệ phức tạp, không phải xung mạnh.',
            src: '[3]',
            score: '+18',
          },
          {
            title: 'Giờ vàng trong ngày',
            verdict: 'Thìn 7–9h · Mùi 13–15h',
            body: 'Thìn là Mộc-Thổ, Mùi là Thổ. Buổi sáng Mộc khí át Thổ → hợp Quý Thủy của bạn. Đáng tránh giờ Tỵ và Ngọ.',
            src: '[4]',
            score: '+14',
          },
        ].map((s, i) => (
          <div key={i} style={{ marginTop: 18, paddingTop: 16, borderTop: i === 0 ? `1px solid ${CT.hairline}` : `1px solid ${CT.hairline2}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Mono style={{ color: CT.muted, fontSize: 9 }}>{s.title}</Mono>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: CT.goldDeep, fontVariantNumeric: 'tabular-nums' }}>{s.score}</span>
            </div>
            <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: CT.ink, letterSpacing: '-0.005em' }}>{s.verdict}</div>
            <p style={{ marginTop: 6, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink2, lineHeight: 1.6 }}>
              {s.body} <span style={{ color: CT.goldDeep, fontFamily: 'var(--mono)', fontSize: 10, cursor: 'pointer' }}>{s.src}</span>
            </p>
          </div>
        ))}

        {/* Total */}
        <div style={{ marginTop: 22, padding: '14px 0', borderTop: `2px solid ${CT.ink}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Tổng điểm</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 32, color: CT.goldDeep, lineHeight: 1, letterSpacing: '-0.015em' }}>76</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 13, color: CT.muted }}>/100</span>
          </div>
        </div>

        {/* Sources */}
        <div style={{ marginTop: 22 }}>
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Nguồn đối chiếu</Mono>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['[1]', 'Hiệp Kỷ Biện Phương — quyển 4, mục Trực Định'],
              ['[2]', 'Ngọc Hạp Thông Thư — phần Thần sát · Thiên Đức'],
              ['[3]', 'Tứ trụ Hồ Điểu — tương sinh tương khắc Thổ-Thủy'],
              ['[4]', 'Lịch Vạn Niên 2026 — bảng giờ vàng'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', gap: 8, fontFamily: 'var(--serif)', fontSize: 12, color: CT.ink2, lineHeight: 1.45 }}>
                <span style={{ color: CT.goldDeep, fontFamily: 'var(--mono)', fontSize: 10, minWidth: 24 }}>{n}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AI 3 · Lá số chi tiết — full chart + AI commentary
// ═══════════════════════════════════════════════════════════════════
function CLaSoFull() {
  const pillars = [
    { l: 'Niên', vn: 'Canh Ngọ', ng: 'Kim', age: '36 tuổi · giáp', hide: false },
    { l: 'Nguyệt', vn: 'Quý Mùi', ng: 'Thủy', age: 'tháng sinh', hide: false },
    { l: 'Nhật', vn: 'Quý Tỵ', ng: 'Thủy', age: 'NHẬT CHỦ', hide: true },
    { l: 'Thời', vn: 'Ất Mão', ng: 'Mộc', age: '5–7h sáng', hide: false },
  ];
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Lá số tứ trụ" />

      <div style={{ flex: 1, padding: '4px 24px 28px', overflow: 'auto' }}>
        {/* Identity line */}
        <div style={{ fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted, marginTop: 6 }}>
          {PROFILE.name} · Nữ · sinh 20.05.1990 · giờ Mão
        </div>

        {/* Mệnh headline */}
        <div style={{ marginTop: 14 }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Mệnh</Mono>
          <h1 style={{ marginTop: 6, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 32, color: CT.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.015em' }}>
            Quý Thủy · <span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>Trường Lưu Thủy</span>
          </h1>
          <p style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 13, color: CT.ink2, lineHeight: 1.6 }}>
            "Nước sông dài — hợp người làm việc bền bỉ, dẻo dai. Sự nghiệp thường tỏ rõ sau tuổi 35, không thuộc dạng phát nhanh."
          </p>
        </div>

        {/* 4 pillars */}
        <div style={{ marginTop: 24 }}>
          <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 8 }}>Bốn trụ</Mono>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {pillars.map((p, i) => (
              <div key={i} style={{ padding: '10px 6px', textAlign: 'center', background: p.hide ? 'rgba(154,124,34,0.1)' : 'transparent', border: `1px solid ${p.hide ? CT.goldDeep : CT.hairline2}` }}>
                <Mono style={{ color: CT.muted, fontSize: 8 }}>{p.l}</Mono>
                <div style={{ marginTop: 6, fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, color: p.hide ? CT.goldDeep : CT.ink, letterSpacing: '-0.005em', textTransform: 'uppercase' }}>{p.vn}</div>
                <Mono style={{ color: CT.muted, fontSize: 7.5, marginTop: 6, display: 'block' }}>{p.ng}</Mono>
              </div>
            ))}
          </div>
        </div>

        {/* Ngũ hành */}
        <div style={{ marginTop: 22 }}>
          <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 10 }}>Ngũ hành · sức mạnh trong lá số</Mono>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
            {[['Mộc', 25, '#7a9a80'], ['Hỏa', 10, '#c5402a'], ['Thổ', 18, CT.goldDeep], ['Kim', 22, '#c8c5a0'], ['Thủy', 25, CT.forest]].map(([n, v, c]) => (
              <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: CT.ink, fontWeight: 600, marginBottom: 3 }}>{v}%</div>
                <div style={{ width: '70%', height: `${v * 2.4}%`, background: c, opacity: 0.85 }} />
                <Mono style={{ color: CT.ink2, marginTop: 4, fontSize: 9 }}>{n}</Mono>
              </div>
            ))}
          </div>
        </div>

        {/* Dụng / kỵ */}
        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: '12px 12px', background: 'rgba(122,154,128,0.1)', border: '1px solid rgba(122,154,128,0.3)' }}>
            <Mono style={{ color: '#5e7d5e', fontSize: 9 }}>Dụng thần</Mono>
            <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: CT.ink, letterSpacing: '-0.005em' }}>Kim · Thủy</div>
            <div style={{ marginTop: 3, fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.ink2 }}>Mầu trắng, xám, đen</div>
          </div>
          <div style={{ padding: '12px 12px', background: 'rgba(163,32,31,0.06)', border: '1px solid rgba(163,32,31,0.25)' }}>
            <Mono style={{ color: CT.red, fontSize: 9 }}>Kỵ thần</Mono>
            <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: CT.ink, letterSpacing: '-0.005em' }}>Thổ · Hỏa</div>
            <div style={{ marginTop: 3, fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.ink2 }}>Mầu vàng, nâu, đỏ</div>
          </div>
        </div>

        {/* AI commentary */}
        <div style={{ marginTop: 24, padding: '14px 14px', background: 'rgba(154,124,34,0.06)', borderLeft: `2px solid ${CT.goldDeep}` }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>NLTT luận</Mono>
          <p style={{ marginTop: 6, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: CT.ink, lineHeight: 1.6 }}>
            "Nhật chủ Quý Thủy nhược, cần Kim sinh Thủy giúp đỡ. Tứ trụ có Mộc và Hỏa hơi thừa — đặc biệt từ Ngọ và Tỵ. Vận tốt nhất sẽ vào những năm Kim và Thủy: <strong style={{ color: CT.ink, fontWeight: 600 }}>Bính Thân (2026), Đinh Dậu (2027), Mậu Tuất (2028)</strong>."
          </p>
          <button style={{ marginTop: 14, padding: '11px 16px', background: CT.forest, color: CT.cream, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Đọc luận giải Bát tự đầy đủ →
          </button>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AI 4 · Luận giải Bát tự năm — consolidated reading
//      Replaces standalone Phong thuỷ + Tiểu Vận screens.
//      Covers: mệnh overview · tính cách · vận năm · phong thuỷ · quý nhân
// ═══════════════════════════════════════════════════════════════════
function CBaziReadingFull() {
  return (
    <div style={{ width: 390, height: 800, background: CT.paper, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <CBackBar title="Luận giải Bát tự · 2026" right={<Mono style={{ color: CT.muted, fontSize: 9 }}>AI · có nguồn</Mono>} />

      <div style={{ flex: 1, padding: '4px 24px 28px', overflow: 'auto' }}>
        {/* Access banner — free with year plan, 299k standalone */}
        <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(122,154,128,0.12)', borderLeft: `2px solid ${CT.green}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 12, color: CT.ink2, lineHeight: 1.45 }}>
            <strong style={{ color: CT.ink, fontWeight: 600 }}>Đã mở</strong> · miễn phí với Lịch Đinh Mùi 2027 (gói năm)
          </div>
          <Mono style={{ color: CT.muted, fontSize: 9 }}>Trị giá 299k</Mono>
        </div>

        {/* Identity strip */}
        <div style={{ marginTop: 16, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.muted, lineHeight: 1.5 }}>
          {PROFILE.name} · sinh 20.05.1990 · giờ Mão · {PROFILE.tuoi}
        </div>

        {/* ───── 01 · Mệnh tổng quan ───── */}
        <section style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 6, borderBottom: `1px solid ${CT.ink}` }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.goldDeep, letterSpacing: '0.18em' }}>01</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Mệnh tổng quan</span>
          </div>
          <h2 style={{ marginTop: 14, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: CT.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.015em' }}>
            Quý Thủy · <span style={{ color: CT.goldDeep, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>Trường Lưu Thủy</span>
          </h2>
          <p style={{ marginTop: 8, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, color: CT.ink2, lineHeight: 1.6 }}>
            "Nước sông dài — hợp người làm việc bền bỉ, dẻo dai. Sự nghiệp thường tỏ rõ sau tuổi 35, không thuộc dạng phát nhanh."
          </p>

          {/* Tứ trụ compact */}
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {[['Niên', 'Canh Ngọ', 'Kim'], ['Nguyệt', 'Quý Mùi', 'Thủy'], ['Nhật', 'Quý Tỵ', 'Thủy', true], ['Thời', 'Ất Mão', 'Mộc']].map(([l, v, ng, hi], i) => (
              <div key={i} style={{ padding: '8px 4px', textAlign: 'center', background: hi ? 'rgba(154,124,34,0.08)' : 'transparent', border: `1px solid ${hi ? CT.goldDeep : CT.hairline2}` }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 9.5, color: CT.muted }}>{l}</div>
                <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: hi ? CT.goldDeep : CT.ink, letterSpacing: '-0.005em' }}>{v}</div>
                <div style={{ marginTop: 3, fontFamily: 'var(--mono)', fontSize: 8, color: CT.muted, letterSpacing: '0.04em' }}>{ng}</div>
              </div>
            ))}
          </div>

          {/* Ngũ hành mini bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, marginBottom: 6 }}>Ngũ hành trong lá số</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56 }}>
              {[['Mộc', 25, '#7a9a80'], ['Hỏa', 10, '#c5402a'], ['Thổ', 18, CT.goldDeep], ['Kim', 22, '#c8c5a0'], ['Thủy', 25, CT.forest]].map(([n, v, c]) => (
                <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: CT.ink, fontWeight: 600, marginBottom: 3 }}>{v}%</div>
                  <div style={{ width: '70%', height: `${v * 2}%`, background: c, opacity: 0.85 }} />
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: CT.ink2, marginTop: 4, letterSpacing: '0.06em' }}>{n}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dụng / Kỵ */}
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px 12px', background: 'rgba(122,154,128,0.08)', borderLeft: `2px solid ${CT.green}` }}>
              <Mono style={{ color: CT.green, fontSize: 9 }}>Dụng thần</Mono>
              <div style={{ marginTop: 3, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink }}>Kim · Thủy</div>
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(163,32,31,0.05)', borderLeft: `2px solid ${CT.red}` }}>
              <Mono style={{ color: CT.red, fontSize: 9 }}>Kỵ thần</Mono>
              <div style={{ marginTop: 3, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: CT.ink }}>Thổ · Hỏa</div>
            </div>
          </div>
        </section>

        {/* ───── 02 · Tính cách & cá tính ───── */}
        <section style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 6, borderBottom: `1px solid ${CT.ink}` }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.goldDeep, letterSpacing: '0.18em' }}>02</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Tính cách · cá tính</span>
          </div>

          <p style={{ marginTop: 14, fontFamily: 'var(--serif)', fontSize: 13.5, color: CT.ink, lineHeight: 1.65 }}>
            Nhật chủ <strong style={{ fontWeight: 600 }}>Quý Thủy</strong> kết hợp trụ giờ <strong style={{ fontWeight: 600 }}>Ất Mão</strong> — Mộc khí buổi sáng nâng đỡ Thủy nhược. Cấu trúc này tạo nên người <em style={{ color: CT.goldDeep }}>thâm trầm, giàu trực giác</em>, suy nghĩ thường đi trước hành động.
          </p>

          <div style={{ marginTop: 16 }}>
            {[
              { t: 'Điểm mạnh', body: 'Trí tuệ phân tích sắc bén, đặc biệt với những việc cần tỉ mỉ. Khả năng kiên trì cao — đeo bám mục tiêu dài hạn không nản. Bạn bè và đồng nghiệp tin cậy.' },
              { t: 'Cá tính nổi bật', body: 'Bề ngoài điềm tĩnh, bên trong sâu sắc. Khó bộc lộ cảm xúc — người khác có thể hiểu nhầm là lạnh lùng. Cảm thông tự nhiên với người yếu thế.' },
              { t: 'Điểm cần lưu ý', body: 'Hơi cầu toàn — dễ tự gây áp lực. Khi mệt sẽ thu mình thay vì tìm hỗ trợ. Sức khoẻ Thận-Bàng quang (theo Thủy) cần được giữ.' },
              { t: 'Tình cảm & quan hệ', body: 'Yêu sâu nhưng chậm bộc lộ. Hợp người có Hoả mạnh hoặc Kim — bổ sung phần thiếu của lá số. Cần đối phương kiên nhẫn lắng nghe.' },
            ].map((p, i) => (
              <div key={i} style={{ paddingTop: 12, paddingBottom: 12, borderTop: i ? `1px solid ${CT.hairline2}` : 'none' }}>
                <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>{p.t}</Mono>
                <p style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2, lineHeight: 1.55 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───── 03 · Vận năm Bính Ngọ 2026 ───── */}
        <section style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 6, borderBottom: `1px solid ${CT.ink}` }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.goldDeep, letterSpacing: '0.18em' }}>03</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Vận năm Bính Ngọ</span>
          </div>

          <div style={{ marginTop: 14, padding: '14px 16px', background: '#fff', border: `1px solid ${CT.goldDeep}` }}>
            <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Đánh giá năm</Mono>
            <div style={{ marginTop: 4, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              Năm tốt · củng cố
            </div>
            <p style={{ marginTop: 8, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: CT.ink2, lineHeight: 1.55 }}>
              "Bính Ngọ — Hỏa vượng. Bạn mệnh Thủy, năm này nên nuôi dưỡng, củng cố — chưa phải lúc phát rộng. Sang Đinh Mùi (2027) mới là thời cơ lớn."
            </p>
          </div>

          {/* 4 life areas */}
          <div style={{ marginTop: 14 }}>
            {[
              { t: 'Tài lộc',    v: 'Trung bình ↑', d: 'Thu nhập ổn, tránh đầu tư mạo hiểm. Quý 3 (T7–T9) tốt nhất cho ký kết.' },
              { t: 'Sự nghiệp',  v: 'Tiến triển',   d: 'Cơ hội thăng tiến cuối năm. Người trẻ học hành thuận lợi. Quý nhân ở Bắc.' },
              { t: 'Tình duyên', v: 'Ổn định',      d: 'Độc thân — quý nhân quanh tháng 10. Có đôi — tránh tranh cãi tháng 6 âm.' },
              { t: 'Sức khoẻ',  v: 'Cẩn trọng',    d: 'Tâm–thận yếu, giảm stress. Khám sức khoẻ đầu năm. Tránh thực phẩm cay nóng.' },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${CT.hairline2}` : 'none', alignItems: 'baseline' }}>
                <div style={{ minWidth: 78 }}>
                  <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12.5, color: CT.ink, letterSpacing: '-0.005em', textTransform: 'uppercase' }}>{s.t}</div>
                  <Mono style={{ color: CT.goldDeep, fontSize: 8.5, marginTop: 3 }}>{s.v}</Mono>
                </div>
                <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2, lineHeight: 1.5 }}>{s.d}</div>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(163,32,31,0.05)', borderLeft: `2px solid ${CT.red}` }}>
            <Mono style={{ color: CT.red, fontSize: 9 }}>Cảnh báo</Mono>
            <div style={{ marginTop: 5, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2, lineHeight: 1.55 }}>
              <strong style={{ color: CT.ink, fontWeight: 600 }}>Tam Tai năm cuối</strong> — Thân Tý Thìn vào Ngọ là năm thứ 3. Hạn nhẹ, cẩn thận tháng 7 âm + các chuyến đi xa.
            </div>
          </div>

          {/* Year graph — 12 months trend */}
          <div style={{ marginTop: 14 }}>
            <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 6 }}>Đường vận 12 tháng âm</Mono>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 56 }}>
              {[55, 62, 70, 68, 76, 48, 42, 65, 78, 80, 72, 68].map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${v}%`, background: v >= 70 ? CT.green : v >= 55 ? CT.goldDeep : v >= 45 ? CT.muted : CT.red, opacity: 0.85 }} />
                  <Mono style={{ color: CT.muted, fontSize: 8, marginTop: 3 }}>{i + 1}</Mono>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── 04 · Phong thuỷ năm ───── */}
        <section style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 6, borderBottom: `1px solid ${CT.ink}` }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.goldDeep, letterSpacing: '0.18em' }}>04</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Phong thuỷ Bính Ngọ</span>
          </div>

          {/* Hướng */}
          <div style={{ marginTop: 14 }}>
            <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 6 }}>Hướng tốt cho bạn</Mono>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { name: 'Đông Nam', sub: 'Sinh Khí — tài lộc' },
                { name: 'Bắc',      sub: 'Diên Niên — sức khoẻ' },
                { name: 'Đông',     sub: 'Thiên Y — quý nhân' },
                { name: 'Nam',      sub: 'Phục Vị — bình ổn' },
              ].map((d, i) => (
                <div key={d.name} style={{ padding: '10px 12px', background: '#fff', border: `1px solid ${i === 0 ? CT.goldDeep : CT.hairline}` }}>
                  <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: i === 0 ? CT.goldDeep : CT.ink, letterSpacing: '-0.005em', textTransform: 'uppercase' }}>{d.name}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted, marginTop: 3 }}>{d.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted, lineHeight: 1.5 }}>
              Tránh: <strong style={{ color: CT.red, fontWeight: 600 }}>Tây Bắc</strong> (Tuyệt Mệnh), <strong style={{ color: CT.red, fontWeight: 600 }}>Tây Nam</strong> (Hoạ Hại)
            </div>
          </div>

          {/* Mầu sắc */}
          <div style={{ marginTop: 18 }}>
            <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 8 }}>Mầu sắc hợp</Mono>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { c: '#e8e6df', n: 'Trắng' },
                { c: '#8a8c8c', n: 'Xám' },
                { c: '#1d2538', n: 'Xanh đậm' },
                { c: '#1d3129', n: 'Xanh rêu' },
              ].map(s => (
                <div key={s.n} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', background: s.c, border: `1px solid ${CT.hairline}` }} />
                  <div style={{ marginTop: 5, fontFamily: 'var(--serif)', fontSize: 10.5, color: CT.ink2 }}>{s.n}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontFamily: 'var(--serif)', fontSize: 11.5, color: CT.muted }}>
              Tránh: <strong style={{ color: CT.red, fontWeight: 600 }}>vàng đậm, nâu, đỏ chói</strong> (Thổ Hỏa khắc mệnh)
            </div>
          </div>

          {/* Sao bay năm */}
          <div style={{ marginTop: 18 }}>
            <Mono style={{ color: CT.muted, fontSize: 9, marginBottom: 8 }}>Sao bay 2026 trong nhà</Mono>
            <div style={{ padding: '10px 12px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                {[
                  ['Tây Nam',  '2 Bệnh',  CT.red],
                  ['Đông',     '7 Phá',   CT.red],
                  ['Đông Nam', '9 Hỷ',    CT.goldDeep],
                  ['Bắc',      '6 Tài',   CT.goldDeep],
                  ['Trung',    '5 Tử',    CT.red, true],
                  ['Nam',      '1 Bạch',  CT.goldDeep],
                  ['Đông Bắc', '4 Văn',   CT.goldDeep],
                  ['Tây',      '3 Thị',   CT.muted],
                  ['Tây Bắc',  '8 Tài',   CT.goldDeep],
                ].map(([dir, s, col, hi], i) => (
                  <div key={i} style={{ padding: '6px 4px', textAlign: 'center', background: hi ? 'rgba(154,124,34,0.06)' : 'transparent', border: `1px solid ${CT.hairline2}` }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: CT.muted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{dir}</div>
                    <div style={{ marginTop: 3, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, color: col, letterSpacing: '-0.005em' }}>{s}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: CT.muted, lineHeight: 1.4 }}>
                Trung cung — sao 5 Tử đáo. Tránh đào xới, sửa chữa hướng giữa nhà trong năm Bính Ngọ.
              </div>
            </div>
          </div>
        </section>

        {/* ───── 05 · Quý nhân · lưu ý ───── */}
        <section style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 6, borderBottom: `1px solid ${CT.ink}` }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: CT.goldDeep, letterSpacing: '0.18em' }}>05</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: CT.ink, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>Quý nhân · lưu ý</span>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px 12px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
              <Mono style={{ color: CT.green, fontSize: 9 }}>Tuổi hợp</Mono>
              <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: CT.ink, letterSpacing: '-0.005em' }}>Thân · Tý · Thìn</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted, marginTop: 3 }}>tam hợp Thủy</div>
            </div>
            <div style={{ padding: '10px 12px', background: '#fff', border: `1px solid ${CT.hairline}` }}>
              <Mono style={{ color: CT.red, fontSize: 9 }}>Tuổi xung</Mono>
              <div style={{ marginTop: 4, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, color: CT.ink, letterSpacing: '-0.005em' }}>Tỵ · Hợi</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 11, color: CT.muted, marginTop: 3 }}>tránh đối tác</div>
            </div>
          </div>

          <p style={{ marginTop: 14, fontFamily: 'var(--serif)', fontSize: 12.5, color: CT.ink2, lineHeight: 1.6 }}>
            <strong style={{ color: CT.ink, fontWeight: 600 }}>Đại vận năm tới</strong> — Đinh Mùi 2027 mở đại vận Kim 10 năm, Kim sinh Thủy hỗ trợ mệnh. Đây là thời cơ phát triển sự nghiệp lớn nhất trong thập kỷ.
          </p>
        </section>

        {/* AI follow-up */}
        <div style={{ marginTop: 32, padding: '14px 14px', background: 'rgba(154,124,34,0.06)', borderLeft: `2px solid ${CT.goldDeep}` }}>
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Hỏi AI thêm</Mono>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Năm nay có nên đầu tư bất động sản không?',
              'Tháng 7 âm cần kiêng những việc gì?',
              'Sau Đinh Mùi 2027, đại vận tiếp theo ra sao?',
            ].map((q, i) => (
              <div key={i} style={{ padding: '8px 12px', background: '#fff', border: `1px solid ${CT.hairline}`, fontFamily: 'var(--serif)', fontSize: 12, color: CT.ink2, cursor: 'pointer' }}>
                {q}
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div style={{ marginTop: 22, fontFamily: 'var(--mono)', fontSize: 9, color: CT.muted, lineHeight: 1.6, letterSpacing: '0.04em' }}>
          Nguồn đối chiếu: Hiệp Kỷ Biện Phương · Ngọc Hạp Thông Thư · Tử Bình Chân Thuyên · Tam Mệnh Thông Hội
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { CAITyped, CAISectioned, CLaSoFull, CBaziReadingFull });
