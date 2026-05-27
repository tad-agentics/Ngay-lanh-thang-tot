/* AI Reading System — Direction B addition.
   The LLM "luận giải" experience treated as a designed product, not a paragraph.
   Globals: React, Phone, Ticket, Kanji, Mono, Stamp, useB. */
/* global React, Phone, Ticket, Kanji, Mono, Stamp, useB */

const { useState: useStateAR, useEffect: useEffectAR, useRef: useRefAR } = React;

// ─── shared bits ───
const FOREST_BG = { background: 'radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)', minHeight: '100%', padding: '0 20px 32px', position: 'relative', overflow: 'hidden' };
const READING_LUAN = "Mậu Tuất nhật gặp Nhật Chủ Tân Kim — tương sinh hài hòa. Tài tinh hiển lộ trên trụ giờ; Đại Vận Quý Sửu hậu thuẫn dòng tài. Hành sự trước trưa tất thuận; quá Mùi nên thủ cẩn, tránh hứa hẹn quá tay.";
const READING_KHUYEN = ["Ký kết hợp đồng buổi sáng — giờ Thìn (7–9h)", "Gặp đối tác mới, đặc biệt người tuổi Hợi", "Mặc tông đất hoặc vàng nhạt — tăng Thổ"];
const READING_TRANH = ["Vay mượn hoặc cho vay trong hôm nay", "Quyết định lớn sau 13h — giờ Mùi xung", "Mặc đỏ tươi — Hỏa khắc Kim mạnh"];
const CITATIONS = ["Nhật Chủ Tân Kim", "Đại Vận Quý Sửu", "Trụ ngày Mậu Tuất", "Dụng thần Thổ"];

const ARStyles = () => (
  <style>{`
    @keyframes ar-blink { 50% { opacity: 0; } }
    @keyframes ar-pulse-dot { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.4); opacity: 1; } }
    @keyframes ar-glyph-fade { 0% { opacity: 0; transform: scale(0.8) translateY(8px); } 30%, 70% { opacity: 0.95; transform: scale(1) translateY(0); } 100% { opacity: 0; transform: scale(1.05) translateY(-6px); } }
    @keyframes ar-watermark-fade { 0%, 100% { opacity: 0.07; } 50% { opacity: 0.14; } }
    @keyframes ar-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
    @keyframes ar-stream-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  `}</style>
);

// ─── Top bar shared by all phone artboards ───
function ARTopBar({ title = 'AI · Luận giải', sub }) {
  const b = useB();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0 18px' }}>
      <button aria-label="Quay lại" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(237,231,211,0.06)', border: '1px solid rgba(197,165,90,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: b.accent, cursor: 'pointer', flexShrink: 0, padding: 0 }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: b.accent, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{title}</div>
        {sub && <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: '#c8bc98', marginTop: 2, lineHeight: 1.15 }}>{sub}</div>}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(200,188,152,0.6)', letterSpacing: '0.2em' }}>NLTT</div>
    </div>
  );
}

// ─── AR-01 · 4-phase loading ───
function AILoading4Phase() {
  const phases = [
    { label: 'Đang đọc Bát Tự…', sub: 'Mệnh · 4 trụ · ngũ hành' },
    { label: 'Đối chiếu Đại Vận…', sub: 'Vận lớn 10 năm hiện tại' },
    { label: 'Soi can chi của ngày…', sub: 'Mậu Tuất · Trực Định' },
    { label: 'Đang luận giải…', sub: 'Hợp với mệnh của bạn' },
  ];
  const [i, setI] = useStateAR(0);
  useEffectAR(() => {
    const id = setInterval(() => setI(x => (x + 1) % phases.length), 1600);
    return () => clearInterval(id);
  }, []);
  const b = useB();
  return (
    <div style={FOREST_BG}>
      <ARStyles />
      <div style={{ paddingTop: 50 }} />
      <ARTopBar title="AI · Đang luận giải" sub="Phiếu của bạn đang được xét" />

      <Ticket>
        <div style={{ padding: '38px 26px 32px', textAlign: 'center', position: 'relative' }}>
          {/* Cycling glyph */}
          <div style={{ height: 200, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div key={i} style={{ animation: 'ar-glyph-fade 1.6s ease-in-out forwards', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: b.accentDeep, letterSpacing: '0.16em', opacity: 0.7 }}>{String(i + 1).padStart(2, '0')} / {phases.length}</div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {phases.map((_, j) => (
                  <div key={j} style={{ width: j === i ? 32 : 8, height: 4, background: j <= i ? b.accent : 'rgba(154,124,34,0.18)', transition: 'all 0.4s ease' }} />
                ))}
              </div>
            </div>
            {/* concentric guide rings */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed rgba(154,124,34,0.25)', margin: 'auto', width: 180, height: 180 }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(154,124,34,0.12)', margin: 'auto', width: 220, height: 220 }} />
          </div>

          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#7a7050', letterSpacing: '0.24em', textTransform: 'uppercase', marginTop: 18 }}>
            Phase {i + 1} / 4
          </div>
          <div key={`l-${i}`} style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 22, color: '#18150e', marginTop: 6, animation: 'ar-stream-in 0.5s ease-out' }}>
            {phases[i].label}
          </div>
          <div key={`s-${i}`} style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: '#5a4f30', marginTop: 4, animation: 'ar-stream-in 0.6s ease-out' }}>
            {phases[i].sub}
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 28 }}>
            {phases.map((_, k) => (
              <span key={k} style={{ width: 8, height: 8, borderRadius: '50%', background: k <= i ? b.accentDeep : 'rgba(122,112,80,0.25)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      </Ticket>

      <div style={{ marginTop: 18, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,188,152,0.18)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.accent, animation: 'ar-pulse-dot 1.4s ease-in-out infinite' }} />
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: '#c8bc98' }}>Trung bình 4–6 giây — đừng tắt máy.</span>
      </div>
    </div>
  );
}

// ─── AR-02 · Typed reveal + chữ hán watermark ───
function AITypedReveal() {
  const full = READING_LUAN;
  const [n, setN] = useStateAR(0);
  useEffectAR(() => {
    if (n >= full.length) {
      const t = setTimeout(() => setN(0), 2200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN(n + 1), 28);
    return () => clearTimeout(t);
  }, [n]);
  const b = useB();
  return (
    <div style={FOREST_BG}>
      <ARStyles />
      <div style={{ paddingTop: 50 }} />
      <ARTopBar title="AI · Luận giải hôm nay" sub="Đang viết — đừng cuộn vội" />

      <Ticket>
        <div style={{ padding: '24px 22px 26px', position: 'relative', minHeight: 380, overflow: 'hidden' }}>
          {/* Big chữ hán watermark, soft fade */}
          <span aria-hidden style={{ position: 'absolute', right: -20, bottom: -40, fontFamily: 'var(--hanzi)', fontWeight: 700, fontSize: 280, lineHeight: 1, color: b.accentDeep, opacity: 0.08, animation: 'ar-watermark-fade 4s ease-in-out infinite', pointerEvents: 'none', userSelect: 'none' }}>論</span>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, position: 'relative' }}>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Luận giải</span>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#7a7050' }}>· Mậu Tuất · 23 / 10</span>
          </div>

          <div style={{ marginTop: 16, fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.7, color: '#18150e', minHeight: 200, position: 'relative' }}>
            {full.slice(0, n)}
            <span style={{ display: 'inline-block', width: 8, height: 18, marginLeft: 2, marginBottom: -3, background: b.accentDeep, animation: 'ar-blink 1s steps(1) infinite' }} />
          </div>

          {/* Streaming indicator */}
          <div style={{ position: 'absolute', bottom: 14, left: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#9a7c22', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Đang viết</span>
            <span style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map(k => <span key={k} style={{ width: 4, height: 4, borderRadius: '50%', background: '#9a7c22', animation: `ar-pulse-dot 1.4s ease-in-out ${k * 0.2}s infinite` }} />)}
            </span>
          </div>
        </div>
      </Ticket>

      <div style={{ marginTop: 14, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'rgba(200,188,152,0.7)', textAlign: 'center', lineHeight: 1.5 }}>
        Đọc xong sẽ lưu để xem lại — không tốn thêm lượng.
      </div>
    </div>
  );
}

// ─── Sectioned card body (used by AR-03 + others) ───
function SectionedReading({ luan = READING_LUAN, khuyen = READING_KHUYEN, tranh = READING_TRANH, citations = CITATIONS, showCitations = true, depth = 'Đầy đủ' }) {
  const b = useB();
  return (
    <div style={{ padding: '20px 22px 18px' }}>
      {/* Depth badge top right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Mono style={{ color: '#7a7050' }}>Mậu Tuất · 23 · 10</Mono>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: depth === 'Đầy đủ' ? '#9a7c22' : '#7a7050', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '2px 8px', border: `1px solid ${depth === 'Đầy đủ' ? b.accent : 'rgba(122,112,80,0.4)'}`, borderRadius: 999 }}>
          {depth}
        </span>
      </div>

      {/* 論 Luận */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Luận</span>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: '#7a7050' }}>· nội dung</span>
        </div>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.65, color: '#18150e', margin: '8px 0 0' }}>{luan}</p>
      </div>

      {/* 勸 Khuyên */}
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed rgba(122,112,80,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 4, height: 18, background: '#3d6b4a', marginRight: 4, transform: 'translateY(3px)' }} />
          <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#3d6b4a' }}>Nên làm</span>
        </div>
        <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
          {khuyen.map((k, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.55, color: '#18150e', padding: '4px 0' }}>
              <span style={{ color: '#3d6b4a', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span>{k}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 忌 Tránh */}
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed rgba(122,112,80,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 4, height: 18, background: '#8b1a1a', marginRight: 4, transform: 'translateY(3px)' }} />
          <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#8b1a1a' }}>Tránh làm</span>
        </div>
        <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
          {tranh.map((k, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.55, color: '#18150e', padding: '4px 0' }}>
              <span style={{ color: '#8b1a1a', fontWeight: 700, flexShrink: 0 }}>✕</span>
              <span>{k}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Citations */}
      {showCitations && (
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(122,112,80,0.2)' }}>
          <Mono style={{ color: '#7a7050' }}>Dựa trên</Mono>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {citations.map((c, i) => (
              <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: b.accentDeep, letterSpacing: '0.04em', padding: '3px 8px', border: `1px solid ${b.accent}`, borderRadius: 2, background: 'rgba(197,165,90,0.08)' }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AR-03 · Sectioned card with citations ───
function AISectionedCard() {
  return (
    <div style={FOREST_BG}>
      <ARStyles />
      <div style={{ paddingTop: 50 }} />
      <ARTopBar title="AI · Luận giải" sub="Cấu trúc · Luận / Khuyên / Tránh" />
      <Ticket>
        <SectionedReading />
      </Ticket>
      <div style={{ marginTop: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'rgba(200,188,152,0.7)' }}>
        Mỗi đoạn có thể chia sẻ riêng · 論 → ảnh đầy đủ · 勸 → việc cần làm · 忌 → việc kỵ
      </div>
    </div>
  );
}

// ─── AR-04 · Voice toggle (Cổ điển / Hiện đại / Thực tế) ───
function AIVoiceToggle() {
  const voices = {
    classical: {
      label: 'Cổ điển',
      sub: 'Văn ngữ — như sách Tử Vi xưa',
      luan: 'Mậu Tuất nhật, Tân Kim Nhật chủ tương sinh hài hòa. Tài tinh hiển lộ. Hành sự trước ngọ tất thuận; quá Mùi nên thủ cẩn, kỵ khinh suất.',
      khuyen: ['Lập khế ước, ký giao kèo trước trưa', 'Hội kiến quý nhân tuổi Hợi', 'Phục sắc đất, hoàng nhạt — tăng Thổ'],
      tranh: ['Vay mượn ngân lượng — kỵ', 'Đại sự sau giờ Mùi — tránh', 'Phục sắc đỏ thẫm — Hỏa khắc Kim'],
    },
    modern: {
      label: 'Hiện đại',
      sub: 'Nhịp đời thường — như bạn nói chuyện',
      luan: 'Hôm nay là ngày tốt cho deal-making. Năng lượng đất + kim hợp với mệnh bạn — chuyện liên quan đến tiền hoặc đối tác đều đang được hậu thuẫn. Chốt sớm, đừng kéo qua chiều.',
      khuyen: ['Ký hợp đồng buổi sáng — giờ Thìn (7–9h)', 'Gặp đối tác mới, ưu tiên người tuổi Hợi', 'Mặc tông đất hoặc vàng nhạt'],
      tranh: ['Vay mượn hôm nay — không nên', 'Quyết định lớn sau 13h — giờ Mùi xung', 'Mặc đỏ tươi — Hỏa khắc Kim'],
    },
    pragmatic: {
      label: 'Thực tế',
      sub: 'Ngắn gọn — chỉ điều cần làm',
      luan: 'Tốt cho ký hợp đồng và gặp đối tác. Ưu tiên buổi sáng. Không vay mượn. Tránh đỏ.',
      khuyen: ['Ký HĐ trước 11h', 'Gặp người tuổi Hợi', 'Mặc nâu / vàng nhạt'],
      tranh: ['Không vay mượn', 'Không quyết sau 13h', 'Không mặc đỏ'],
    },
  };
  const [v, setV] = useStateAR('modern');
  const cur = voices[v];
  const b = useB();
  return (
    <div style={FOREST_BG}>
      <ARStyles />
      <div style={{ paddingTop: 50 }} />
      <ARTopBar title="AI · Giọng đọc" sub="Cùng nội dung · ba giọng đọc" />

      {/* Segmented control */}
      <div style={{ display: 'flex', gap: 0, padding: 4, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(200,188,152,0.18)', borderRadius: 999, marginBottom: 14 }}>
        {Object.keys(voices).map(k => (
          <button key={k} onClick={() => setV(k)} style={{
            flex: 1, border: 'none', padding: '8px 4px', borderRadius: 999, cursor: 'pointer',
            background: v === k ? b.accent : 'transparent',
            color: v === k ? '#18150e' : '#c8bc98',
            fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
            transition: 'all 0.2s',
          }}>{voices[k].label}</button>
        ))}
      </div>

      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'rgba(200,188,152,0.7)', textAlign: 'center', marginBottom: 14 }}>
        {cur.sub}
      </div>

      <Ticket>
        <SectionedReading luan={cur.luan} khuyen={cur.khuyen} tranh={cur.tranh} showCitations={false} />
      </Ticket>

      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,188,152,0.14)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'rgba(200,188,152,0.75)', textAlign: 'center' }}>
        Đặt làm mặc định trong Cài đặt → Giọng đọc.
      </div>
    </div>
  );
}

// ─── AR-05 · Locked + bulk unlock states ───
function AILocked() {
  const b = useB();
  return (
    <div style={FOREST_BG}>
      <ARStyles />
      <div style={{ paddingTop: 50 }} />
      <ARTopBar title="AI · Cần mở khóa" sub="Hai mức · hôm nay · từng ngày kết quả" />

      {/* Locked today reading */}
      <Ticket>
        <div style={{ padding: '20px 22px', position: 'relative', minHeight: 220 }}>
          <Mono style={{ color: '#7a7050' }}>Hôm nay · Mậu Tuất · 23 / 10</Mono>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase' }}>Luận giải hôm nay</span>
          </div>

          {/* Blurred / masked preview */}
          <div style={{ marginTop: 12, position: 'relative' }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.65, color: '#18150e', filter: 'blur(4px)', userSelect: 'none', margin: 0 }}>
              Mậu Tuất nhật gặp Nhật Chủ Tân Kim — tương sinh hài hòa. Tài tinh hiển lộ trên trụ giờ; Đại Vận Quý Sửu hậu thuẫn dòng tài. Hành sự trước trưa…
            </p>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(237,231,211,0) 0%, rgba(237,231,211,0.85) 80%)', pointerEvents: 'none' }} />
          </div>

          <div style={{ marginTop: 14, padding: '14px 14px', background: 'rgba(197,165,90,0.1)', border: `1px solid ${b.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <Mono style={{ color: b.accentDeep }}>Mở khóa</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, marginTop: 2 }}>1 lượng</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: '#5a4f30', marginTop: 1 }}>Đọc nhiêu lần · cả ngày</div>
            </div>
            <button style={{ background: '#18150e', color: '#ede7d3', border: 'none', padding: '12px 20px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
              Mở khóa
            </button>
          </div>
        </div>
      </Ticket>

      {/* Bulk reasons unlock */}
      <div style={{ marginTop: 18 }}>
        <Ticket>
          <div style={{ padding: '20px 22px' }}>
            <Mono style={{ color: '#7a7050' }}>Kết quả · Khai trương · 5 ngày</Mono>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase' }}>Lý do từng ngày</span>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.55, color: '#3a3220', margin: '8px 0 0' }}>
              Đã thấy điểm số và giờ tốt mỗi ngày. Mở khóa để biết <em>vì sao</em> ngày này cao điểm — giải thích từng ngày dựa trên trụ ngày, dụng thần và đại vận của bạn.
            </p>

            {/* Day rows preview */}
            <div style={{ marginTop: 14, borderTop: '1px dashed rgba(122,112,80,0.4)', paddingTop: 12 }}>
              {['28 / 10 · A', '02 / 11 · A', '07 / 11 · B', '14 / 11 · B', '21 / 11 · C'].map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 4 ? '1px dotted rgba(122,112,80,0.2)' : 'none' }}>
                  <Mono style={{ color: '#3a3220' }}>{d}</Mono>
                  <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#7a7050' }}>+ 4 lượng để đọc</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, padding: '12px 14px', background: '#18150e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, color: '#ede7d3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mở khóa cả 5 ngày</span>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: 'rgba(237,231,211,0.7)', marginTop: 2 }}>4 × 5 = 20 lượng · giảm 4 lượng so với mở từng ngày</div>
              </div>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: b.accent }}>20</span>
            </div>
          </div>
        </Ticket>
      </div>
    </div>
  );
}

// ─── AR-06 · Section retry + depth indicators ───
function AIRetryDepth() {
  const b = useB();
  const sections = [
    { id: 'tinhcach', label: 'Tính cách', preview: 'Nhật Chủ Tân Kim — sắc bén, kiên định, đôi lúc lạnh lùng. Khi Thổ vượng…', state: 'open', depth: 'Đầy đủ' },
    { id: 'sunghiep', label: 'Sự nghiệp', preview: 'Tài tinh xuất hiện ở trụ giờ — phù hợp công việc cần…', state: 'collapsed', depth: 'Đầy đủ' },
    { id: 'taivan', label: 'Tài vận', preview: 'Dòng tài qua Thổ — Mậu Kỷ là chính tài, Bính Đinh là…', state: 'collapsed', depth: 'Đầy đủ' },
    { id: 'suckhoe', label: 'Sức khỏe', preview: '', state: 'error', depth: null },
    { id: 'tinh', label: 'Tình duyên', preview: 'Hợp người mệnh Thổ và Thủy — tránh người Hỏa quá vượng…', state: 'collapsed', depth: 'Tóm lược' },
  ];
  return (
    <div style={FOREST_BG}>
      <ARStyles />
      <div style={{ paddingTop: 50 }} />
      <ARTopBar title="Lá số chi tiết · 5 mục" sub="Mỗi mục là một luận giải riêng" />

      {/* Tổng hợp pinned at top */}
      <div style={{ marginBottom: 12 }}>
        <Ticket>
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(197,165,90,0.08), rgba(197,165,90,0))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>Tổng hợp</span>
              </div>
              <Mono style={{ color: b.accentDeep }}>Đầy đủ</Mono>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.6, color: '#18150e', margin: '6px 0 0' }}>
              Mệnh Tân Kim · Đại Vận Quý Sửu — giai đoạn 32–42 tuổi là vận tài lớn nhất đời. Ưu tiên tích lũy và quan hệ người Thổ.
            </p>
          </div>
        </Ticket>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map((s, idx) => (
          <div key={s.id} style={{ background: '#ede7d3', position: 'relative' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderLeft: s.state === 'error' ? '3px solid #8b1a1a' : `3px solid ${s.state === 'open' ? b.accent : 'transparent'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: s.state === 'error' ? '#8b1a1a' : b.accentDeep, fontWeight: 700, letterSpacing: '0.08em', minWidth: 22 }}>{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#18150e' }}>{s.label}</div>
                  {s.depth && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: s.depth === 'Đầy đủ' ? b.accentDeep : '#7a7050', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{s.depth}</span>}
                  {s.state === 'error' && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#8b1a1a', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Lỗi tải</span>}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: '#7a7050' }}>{s.state === 'open' ? '–' : '+'}</span>
            </div>

            {/* Body if open */}
            {s.state === 'open' && (
              <div style={{ padding: '0 16px 14px 39px' }}>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.6, color: '#3a3220', margin: 0 }}>{s.preview}</p>
              </div>
            )}
            {s.state === 'collapsed' && s.preview && (
              <div style={{ padding: '0 16px 12px 39px' }}>
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, lineHeight: 1.5, color: '#7a7050', margin: 0 }}>{s.preview}</p>
              </div>
            )}
            {s.state === 'error' && (
              <div style={{ padding: '4px 16px 14px 39px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#8b1a1a' }}>Mạng chậm hoặc bot quá tải. Các mục khác vẫn dùng được.</span>
                <button style={{ background: '#8b1a1a', color: '#ede7d3', border: 'none', padding: '6px 12px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', flexShrink: 0 }}>Thử lại</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'rgba(200,188,152,0.65)', textAlign: 'center' }}>
        Từng mục lưu riêng — đọc lại không tốn thêm lượng.
      </div>
    </div>
  );
}

// ─── AR-07 · Pin + share-just-the-reading ───
function AIPinShare() {
  const b = useB();
  return (
    <div style={FOREST_BG}>
      <ARStyles />
      <div style={{ paddingTop: 50 }} />
      <ARTopBar title="AI · Ghim · Chia sẻ" sub="Hai chế độ giữ một bản đọc" />

      {/* Pinned reading */}
      <Ticket>
        <div style={{ padding: '18px 22px', position: 'relative' }}>
          {/* Pin badge */}
          <div style={{ position: 'absolute', top: -8, right: 14, background: '#8b1a1a', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--hanzi)', fontSize: 12, color: '#ede7d3', fontWeight: 700 }}>留</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#ede7d3', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Đã ghim</span>
          </div>

          <Mono style={{ color: '#7a7050' }}>Mậu Tuất · 23 / 10 · Ghim 14:32</Mono>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--hanzi)', fontSize: 22, color: b.accentDeep, fontWeight: 700 }}>論</span>
            <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase' }}>Luận hôm nay</span>
          </div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.65, color: '#18150e', margin: '8px 0 0' }}>
            {READING_LUAN}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 6, fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            <span>Lưu trong Sổ · 12 mục</span>
          </div>
        </div>
      </Ticket>

      {/* Share-just-reading variant */}
      <div style={{ marginTop: 16 }}>
        <Mono style={{ color: 'rgba(200,188,152,0.7)' }}>Khi chia sẻ — chỉ đoạn luận giải</Mono>

        <div style={{ marginTop: 8, background: '#f1ece1', padding: '20px 20px 18px', position: 'relative', boxShadow: '0 12px 28px rgba(0,0,0,0.4)' }}>
          {/* Decorative top border */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${b.accent}, ${b.accentDeep}, ${b.accent})` }} />

          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#9a7c22', letterSpacing: '0.22em', textTransform: 'uppercase' }}>nltt · phiếu luận</div>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, marginTop: 4, color: '#18150e' }}>Mậu Tuất nhật</div>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#7a7050' }}>23 / 10 · Trực Định · Hoàng Đạo</div>

          <p style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.65, color: '#18150e', margin: '14px 0 0' }}>
            "Hôm nay là ngày tốt cho deal-making. Năng lượng đất + kim hợp với mệnh bạn — chuyện liên quan đến tiền hoặc đối tác đều đang được hậu thuẫn."
          </p>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed rgba(122,112,80,0.4)', paddingTop: 10 }}>
            <div>
              <Mono style={{ color: '#7a7050' }}>nltt.vn / x / k7m9p</Mono>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 10, color: '#7a7050', marginTop: 2 }}>Lập lá số riêng — miễn phí</div>
            </div>
            <Stamp ch="留念" style={{ fontSize: 16 }} />
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, background: '#18150e', color: '#ede7d3', border: 'none', padding: '10px 12px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Sao chép link</button>
          <button style={{ flex: 1, background: b.accent, color: '#18150e', border: 'none', padding: '10px 12px', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Lưu ảnh</button>
        </div>
      </div>
    </div>
  );
}

// ─── AR-08 · Lá số chi tiết — full 5-aspect drill-down ───
function LaSoChiTietFull() {
  const b = useB();
  const sections = [
    { label: 'Tính cách', score: 'Mạnh', preview: 'Tân Kim — sắc bén, kiên định, ưa hoàn hảo. Hợp công việc đòi hỏi sự chính xác và tinh tế.' },
    { label: 'Sự nghiệp', score: 'Tốt', preview: 'Tài tinh ở trụ giờ — phù hợp khởi nghiệp hoặc nghề tự do. Đại Vận Quý Sửu hậu thuẫn dòng tài 32–42 tuổi.' },
    { label: 'Tài vận', score: 'Mạnh', preview: 'Mậu Kỷ là chính tài. Năm Bính Ngọ và Đinh Mùi cần tiết chế chi tiêu — Hỏa khắc Kim mạnh.' },
    { label: 'Sức khỏe', score: 'Bình', preview: 'Phế và đường hô hấp là điểm yếu. Tránh khí lạnh kéo dài và hút thuốc.' },
    { label: 'Tình duyên', score: 'Tốt', preview: 'Hợp người mệnh Thổ và Thủy. Người tuổi Tỵ và Hợi là quý nhân tình cảm.' },
  ];
  return (
    <div style={FOREST_BG}>
      <ARStyles />
      <div style={{ paddingTop: 50 }} />
      <ARTopBar title="Lá số tứ trụ · Chi tiết" sub="5 mặt + tổng hợp" />

      {/* Header summary card */}
      <Ticket>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Mono style={{ color: '#7a7050' }}>Nhật chủ</Mono>
            <Mono style={{ color: b.accentDeep }}>15 · 03 · 1992 · giờ Mão</Mono>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--hanzi)', fontSize: 36, color: b.accentDeep, fontWeight: 700 }}>辛</span>
            <div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22 }}>Tân Kim</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#5a4f30' }}>Dụng thần Thổ · Kỵ Hỏa</div>
            </div>
          </div>
        </div>
      </Ticket>

      {/* Tổng hợp */}
      <div style={{ marginTop: 12 }}>
        <Ticket>
          <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, rgba(197,165,90,0.08), rgba(197,165,90,0))' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--hanzi)', fontSize: 20, color: b.accentDeep, fontWeight: 700 }}>總</span>
              <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>Tổng hợp</span>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.6, color: '#18150e', margin: '6px 0 0' }}>
              Tân Kim Nhật chủ thân nhược, dụng Thổ sinh Kim. Đại Vận Quý Sửu (32–42) là vận tài lớn nhất — ưu tiên tích lũy và quan hệ người mệnh Thổ.
            </p>
          </div>
        </Ticket>
      </div>

      {/* 5 sections — collapsed list */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sections.map((s, i) => (
          <div key={i} style={{ background: '#ede7d3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderLeft: i === 1 ? `3px solid ${b.accent}` : '3px solid transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: b.accentDeep, fontWeight: 700, letterSpacing: '0.08em', minWidth: 22 }}>{String(i + 1).padStart(2, '0')}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#18150e' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: '#5a4f30', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240, marginTop: 1 }}>{s.preview}</div>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: s.score === 'Mạnh' ? '#3d6b4a' : s.score === 'Tốt' ? b.accentDeep : '#7a7050', letterSpacing: '0.16em', textTransform: 'uppercase', flexShrink: 0, marginLeft: 8 }}>{s.score}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,188,152,0.14)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#c8bc98' }}>Đọc đầy đủ từng mục</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: b.accent, letterSpacing: '0.18em', textTransform: 'uppercase' }}>2 lượng / mục</span>
      </div>
    </div>
  );
}

// ─── Notes card for the row ───
function AIReadingNotes() {
  return (
    <div style={{ padding: '40px 56px', background: '#f1ece1', height: '100%', fontFamily: 'var(--serif)', color: '#18150e', overflow: 'auto', position: 'relative' }}>
      <div style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a7c22', borderBottom: '1px solid #c5a55a', paddingBottom: 4 }}>
        Section 4 · LLM Luận Giải System
      </div>
      <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 38, lineHeight: 1.05, margin: '14px 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
        AI is the product.<br />Treat it like one.
      </h1>
      <p style={{ fontSize: 15, color: '#3a3220', lineHeight: 1.65, maxWidth: 720 }}>
        9 surfaces in the existing app render an AI luận giải. Today they share one <code>&lt;AiReadingBlock&gt;</code> that's a paragraph + spinner. This row redesigns that block as 8 distinct moments — loading, streaming, structuring, citing, voicing, locking, retrying, sharing.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 28 }}>
        {[
          ['AR-01 · Loading 4 phases', 'Replace the spinner with a 命 → 大 → 日 → 論 sequence + monospace status. Make the wait the show.'],
          ['AR-02 · Typed reveal', 'Word-by-word render with chữ hán watermark. Same psychology as ChatGPT streaming, dressed in almanac language.'],
          ['AR-03 · Sectioned card', '論 Luận / 勸 Khuyên / 忌 Tránh — three sub-cards instead of one paragraph. Scannable. Croppable for share.'],
          ['AR-04 · Voice toggle', 'Cổ điển / Hiện đại / Thực tế — same content, three tones. Gives users a reason to come back.'],
          ['AR-05 · Locked + bulk', '1 lượng for today · 4 lượng × N for bulk reasons (with discount). Replaces today\'s blunt unlock.'],
          ['AR-06 · Section retry', 'Per-section error in lá số chi-tiet — retry one slice without blanking the screen. Depth badges (Đầy đủ / Tóm lược).'],
          ['AR-07 · Pin + share', 'Pin a reading to read again offline. Share-just-reading (text card) variant of /x/:token — lighter than the day card.'],
          ['AR-08 · Chi-tiet 5 mục', 'Lá số drill-down — Tính cách / Sự nghiệp / Tài vận / Sức khỏe / Tình duyên + tổng hợp. The flow gap from §6 of your doc.'],
        ].map(([t, d]) => (
          <div key={t} style={{ borderTop: '2px solid #18150e', paddingTop: 12 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 15, textTransform: 'uppercase' }}>{t}</div>
            <div style={{ fontSize: 13, color: '#3a3220', marginTop: 6, lineHeight: 1.55 }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(139,26,26,0.07)', borderLeft: '3px solid #8b1a1a' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#8b1a1a', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Implementation note</div>
        <div style={{ fontSize: 13, color: '#3a3220', marginTop: 6, lineHeight: 1.55 }}>
          Most of this is a <code>&lt;AiReadingBlock&gt;</code> rewrite + a prompt-side change to return <code>{`{ luan, khuyen[], tranh[], citations[] }`}</code> instead of one string. Today / chi-tiet / vận tháng / hợp tuổi / phong thủy all benefit from the same rewrite.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AILoading4Phase, AITypedReveal, AISectionedCard, AIVoiceToggle,
  AILocked, AIRetryDepth, AIPinShare, LaSoChiTietFull, AIReadingNotes,
});
