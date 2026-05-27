/* B-flow3 — API-aligned secondary surfaces */
/* global React, useB, Ticket, Kanji, Mono, Logo, Stamp, StatusBar, HomeIndicator, BottomNav, BackBar */

const F = '#1d3129', C = '#ede7d3', M = '#7a9a80', D = '#c8bc98';
const F_ROW = (children, key) => children;

// ───────────────────────────────────────────────────
// shared chrome
function Header({ title, sub }) {
  // Unified: delegate to shared BackBar so all detail screens (light + dark) match.
  const Bar = (typeof window !== 'undefined' && window.BackBar) || BackBar;
  return <Bar dark subtitle={sub} title={title} onBack={() => {}} />;
}

// ═══════════════════════════════════════════════════
// 1 · HỢP TUỔI — input
// ═══════════════════════════════════════════════════
function HopTuoiInput() {
  const b = useB();
  const rel = [
    ['PHU_THE', '婚', 'Phu Thê'],
    ['DOI_TAC', '盟', 'Đối Tác'],
    ['SEP_NHAN_VIEN', '官', 'Sếp · Nhân viên'],
    ['DONG_NGHIEP', '同', 'Đồng nghiệp'],
    ['BAN_BE', '友', 'Bạn bè'],
    ['PHU_TU', '父', 'Cha mẹ · Con'],
    ['ANH_CHI_EM', '兄', 'Anh chị em'],
    ['THAY_TRO', '師', 'Thầy · Trò'],
  ];
  return (
    <div style={{ width: 390, height: 800, background: F, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Kanji ch="合" size={460} style={{ position: 'absolute', top: 60, right: -120 }} />
      <StatusBar dark />
      <Header sub="Hai lá số · một mối duyên" title="Hợp tuổi" />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'stretch' }}>
          {[['Người 1', '15/03/1984', 'Giờ Thìn', 'Nam'], ['Người 2', '20/08/1990', 'Giờ Tỵ', 'Nữ']].map(([t, d, h, g], i) => (
            <React.Fragment key={i}>
              {i === 1 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 28 }}>·</span></div>}
              <div style={{ padding: 14, border: `1px solid ${b.accent}`, background: 'rgba(197,165,90,0.05)' }}>
                <Mono style={{ color: M, display: 'block' }}>{t}</Mono>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, color: C, fontSize: 18, marginTop: 4 }}>{d}</div>
                <Mono style={{ color: D, marginTop: 4, display: 'block' }}>{h} · {g}</Mono>
              </div>
              {i === 0 && null}
            </React.Fragment>
          ))}
        </div>

        <Mono style={{ color: b.accent, display: 'block', marginTop: 18, marginBottom: 8 }}>Loại quan hệ · 8 phương</Mono>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
          {rel.map(([k, hz, lbl], i) => {
            const sel = i === 0;
            return (
              <div key={k} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, border: sel ? `1px solid ${b.accent}` : '1px solid rgba(197,165,90,0.2)', background: sel ? 'rgba(197,165,90,0.08)' : 'transparent' }}>
                <span style={{ fontFamily: 'var(--hanzi)', color: sel ? b.accent : M, fontSize: 18, fontWeight: 700 }}>{hz}</span>
                <span style={{ color: sel ? C : D, fontFamily: 'var(--serif)', fontSize: 12 }}>{lbl}</span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 18, padding: 12, borderLeft: `2px solid ${b.accent}`, fontSize: 11, color: D, fontFamily: 'var(--serif)', lineHeight: 1.6 }}>
          Dùng <span style={{ color: b.accent }}>Phu Thê</span> cho mục đích kết hôn — phân tích định tính theo cặp.
        </div>
      </div>
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(197,165,90,0.2)' }}>
        <button style={{ width: '100%', padding: 16, background: b.accent, color: F, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Luận đoán →</button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 2 · HỢP TUỔI — kết quả (v2)
// ═══════════════════════════════════════════════════
function HopTuoiResult() {
  const b = useB();
  const crit = [
    ['Ngũ Hành Nạp Âm', 'positive', 'Kim · Thổ tương sinh — nền tảng vững.'],
    ['Lục Hợp', 'neutral', 'Không có Lục Hợp — không thêm điểm.'],
    ['Nhật Chủ tương tác', 'positive', 'Canh Kim sinh Đinh Hỏa — bổ trợ.'],
    ['Địa Chi xung', 'negative', 'Tỵ – Hợi xung nhẹ ở trụ giờ.'],
    ['Tam Hợp', 'positive', 'Tỵ Dậu Sửu — có một thành phần.'],
  ];
  const ic = { positive: '✓', neutral: '〰', negative: '⚠' };
  const cl = { positive: b.accent, neutral: M, negative: '#d88080' };
  return (
    <div style={{ width: 390, height: 800, background: F, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <Header sub="Phu Thê · v2" title="Tương hợp · cấp 2" />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <Ticket holes={false} stub stubLabel="·1984·1990·" style={{ marginBottom: 16 }}>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: '#7a7050', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Phán định</div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 36, color: '#1d3129', lineHeight: 0.95, marginTop: 4, textTransform: 'uppercase' }}>Tương hợp</div>
                <Mono style={{ color: '#9a7c22', marginTop: 6, display: 'block' }}>Cấp 2 · Tương Sinh · Grade B</Mono>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 56, color: '#9a7c22', lineHeight: 1 }}>78</div>
                <Mono style={{ color: '#7a7050' }}>/100</Mono>
              </div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(122,112,80,0.3)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--hanzi)', color: '#1d3129', fontSize: 22, fontWeight: 700 }}>庚</div>
                <Mono style={{ color: '#7a7050' }}>Canh Kim · Hải Trung</Mono>
              </div>
              <span style={{ fontFamily: 'var(--hanzi)', color: '#9a7c22', fontSize: 18 }}>合</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--hanzi)', color: '#1d3129', fontSize: 22, fontWeight: 700 }}>丁</div>
                <Mono style={{ color: '#7a7050' }}>Đinh Hỏa · Lộ Bàng</Mono>
              </div>
            </div>
          </div>
        </Ticket>

        <Mono style={{ color: b.accent, display: 'block', marginBottom: 8 }}>Tiêu chí · 5 mặt</Mono>
        <div style={{ border: '1px solid rgba(197,165,90,0.22)' }}>
          {crit.map(([n, s, t], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderTop: i ? '1px solid rgba(197,165,90,0.16)' : 'none' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', border: `1.2px solid ${cl[s]}`, color: cl[s], fontFamily: 'var(--mono)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ic[s]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: C, fontSize: 13 }}>{n}</div>
                <div style={{ fontSize: 12, color: D, fontFamily: 'var(--serif)', marginTop: 2, lineHeight: 1.45 }}>{t}</div>
              </div>
            </div>
          ))}
        </div>

        <Mono style={{ color: b.accent, display: 'block', marginTop: 18, marginBottom: 6 }}>Lời luận</Mono>
        <div style={{ fontSize: 13, color: C, fontFamily: 'var(--serif)', lineHeight: 1.6, fontStyle: 'italic' }}>
          "Hai người có nền tảng ngũ hành thuận lợi — Kim sinh Thổ. Người nam tính cương được người nữ làm dịu. Hôn nhân có quý nhân phù trợ trong vận giáp Thân."
        </div>

        <Mono style={{ color: b.accent, display: 'block', marginTop: 18, marginBottom: 6 }}>Lời khuyên</Mono>
        <div style={{ fontSize: 12, color: D, fontFamily: 'var(--serif)', lineHeight: 1.6, padding: '10px 12px', borderLeft: `2px solid ${b.accent}` }}>
          Nên chọn ngày cưới vào tháng có hành Thổ hoặc Kim · tránh Hỏa khí cực thịnh trong nhà · màu chủ đạo lễ: vàng đất, trắng kem.
        </div>

        <button style={{ width: '100%', marginTop: 18, padding: 14, background: 'transparent', color: b.accent, border: `1px solid ${b.accent}`, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>→ Tìm ngày cưới hợp đôi</button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 3 · PHONG THỦY — la bàn + phi tinh
// ═══════════════════════════════════════════════════
function Compass() {
  const b = useB();
  const dirs = [
    ['Bắc', 'B', 0, false, 'Hỏa'],
    ['Đông Bắc', 'ĐB', 45, true, 'Thổ'],
    ['Đông', 'Đ', 90, false, 'Mộc'],
    ['Đông Nam', 'ĐN', 135, false, 'Mộc'],
    ['Nam', 'N', 180, false, 'Hỏa'],
    ['Tây Nam', 'TN', 225, true, 'Thổ'],
    ['Tây', 'T', 270, false, 'Kim'],
    ['Tây Bắc', 'TB', 315, false, 'Kim'],
  ];
  const sz = 220, r = 88;
  return (
    <div style={{ width: sz, height: sz, position: 'relative', margin: '0 auto' }}>
      {/* outer ring */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${b.accent}`, opacity: 0.6 }} />
      <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '1px dashed rgba(197,165,90,0.25)' }} />
      {/* axes */}
      {[0, 45, 90, 135].map((deg) => (
        <div key={deg} style={{ position: 'absolute', top: '50%', left: '50%', width: sz - 12, height: 1, background: 'rgba(197,165,90,0.12)', transform: `translate(-50%,-50%) rotate(${deg}deg)` }} />
      ))}
      {/* center */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 60, height: 60, borderRadius: '50%', background: '#243a30', border: `1px solid ${b.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 22, fontWeight: 700 }}>金</span>
        <Mono style={{ color: M, fontSize: 7 }}>Mệnh Kim</Mono>
      </div>
      {/* points */}
      {dirs.map(([n, sh, deg, good, h]) => {
        const rad = (deg - 90) * Math.PI / 180;
        const x = sz / 2 + r * Math.cos(rad);
        const y = sz / 2 + r * Math.sin(rad);
        const bad = ['Nam'].includes(n);
        const yearGood = ['Đông Nam', 'Bắc'].includes(n);
        const color = good ? b.accent : bad ? '#d88080' : yearGood ? '#7a9a80' : M;
        return (
          <div key={n} style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: good ? 'rgba(197,165,90,0.15)' : bad ? 'rgba(216,128,128,0.12)' : 'transparent', border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 11, color }}>{sh}</div>
            <Mono style={{ color, fontSize: 8, marginTop: 2, display: 'block' }}>{n}</Mono>
          </div>
        );
      })}
    </div>
  );
}

function PhongThuy() {
  const b = useB();
  const tabs = ['Nhà ở', 'Văn phòng', 'Cửa hàng', 'Phòng khách'];
  const phitinh = [
    ['ĐN', 4, 'Tứ Lục', 'Mộc', 'tốt', 'Văn xương'],
    ['N', 9, 'Cửu Tử', 'Hỏa', 'tốt', 'Hỉ khánh'],
    ['TN', 2, 'Nhị Hắc', 'Thổ', 'xấu', 'Bệnh phù'],
    ['Đ', 3, 'Tam Bích', 'Mộc', 'xấu', 'Thị phi'],
    ['—', 5, 'Ngũ Hoàng', 'Thổ', 'xấu', 'Tai sát'],
    ['T', 7, 'Thất Xích', 'Kim', 'xấu', 'Phá tài'],
    ['ĐB', 8, 'Bát Bạch', 'Thổ', 'tốt', 'Tài lộc'],
    ['B', 1, 'Nhất Bạch', 'Thủy', 'tốt', 'Quan lộc'],
    ['TB', 6, 'Lục Bạch', 'Kim', 'trung', 'Quyền uy'],
  ];
  const cBg = { 'tốt': 'rgba(122,154,128,0.18)', 'xấu': 'rgba(216,128,128,0.12)', 'trung': 'rgba(237,231,211,0.05)' };
  const cFg = { 'tốt': '#9bbfa3', 'xấu': '#d88080', 'trung': M };
  return (
    <div style={{ width: 390, height: 800, background: F, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <Header sub="Hướng · sắc · số · vật phẩm" title="Phong thủy" />
      <div style={{ display: 'flex', gap: 4, padding: '0 16px 12px' }}>
        {tabs.map((t, i) => (
          <div key={t} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderBottom: i === 0 ? `2px solid ${b.accent}` : '2px solid transparent', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: i === 0 ? b.accent : M }}>{t}</div>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <Compass />

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 6, fontFamily: 'var(--mono)', fontSize: 9, color: M, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: b.accent, marginRight: 4 }} />Tốt mệnh</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#7a9a80', marginRight: 4 }} />Tốt năm</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#d88080', marginRight: 4 }} />Kỵ</span>
        </div>

        {/* Colors + numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          <div style={{ padding: 12, border: '1px solid rgba(197,165,90,0.25)' }}>
            <Mono style={{ color: b.accent, display: 'block', marginBottom: 6 }}>May mắn</Mono>
            <div style={{ display: 'flex', gap: 5 }}>
              {[['#c7a86a', 'Vàng đất'], ['#7a5a3a', 'Nâu'], ['#ede7d3', 'Trắng']].map(([c, n]) => (
                <div key={n} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ width: '100%', height: 28, background: c, border: '1px solid rgba(197,165,90,0.3)' }} />
                  <Mono style={{ color: D, fontSize: 8, marginTop: 3, display: 'block' }}>{n}</Mono>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {[2, 5, 8].map((n) => (
                <span key={n} style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${b.accent}`, fontFamily: 'var(--display-2)', fontWeight: 800, color: b.accent, fontSize: 13 }}>{n}</span>
              ))}
            </div>
          </div>
          <div style={{ padding: 12, border: '1px solid rgba(216,128,128,0.3)' }}>
            <Mono style={{ color: '#d88080', display: 'block', marginBottom: 6 }}>Nên tránh</Mono>
            <div style={{ display: 'flex', gap: 5 }}>
              {[['#a83a3a', 'Đỏ'], ['#d97a3a', 'Cam']].map(([c, n]) => (
                <div key={n} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ width: '100%', height: 28, background: c, border: '1px solid rgba(216,128,128,0.3)' }} />
                  <Mono style={{ color: D, fontSize: 8, marginTop: 3, display: 'block' }}>{n}</Mono>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {[7, 9].map((n) => (
                <span key={n} style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(216,128,128,0.5)', fontFamily: 'var(--display-2)', fontWeight: 800, color: '#d88080', fontSize: 13, textDecoration: 'line-through' }}>{n}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Phi Tinh 9 cung */}
        <Mono style={{ color: b.accent, display: 'block', marginTop: 18, marginBottom: 8 }}>Phi tinh · Bính Ngọ 2026 · Cửu Cung</Mono>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, border: '1px solid rgba(197,165,90,0.2)' }}>
          {phitinh.map(([dir, num, name, h, nat, mean]) => (
            <div key={num} style={{ padding: 8, background: cBg[nat], minHeight: 70 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: cFg[nat] }}>{num}</span>
                <Mono style={{ color: M, fontSize: 8 }}>{dir}</Mono>
              </div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 10, color: C, marginTop: 2 }}>{name}</div>
              <Mono style={{ color: D, fontSize: 8, marginTop: 1, display: 'block', lineHeight: 1.3 }}>{mean}</Mono>
            </div>
          ))}
        </div>

        {/* Items */}
        <Mono style={{ color: b.accent, display: 'block', marginTop: 18, marginBottom: 8 }}>Vật phẩm gợi ý</Mono>
        {[
          ['Tượng trâu đồng', 'Phía Đông Bắc', 'Bổ Dụng Thần Thổ', '土'],
          ['Đá thạch anh vàng', 'Bàn làm việc', 'Tài lộc · ổn định', '石'],
          ['Cây kim ngân', 'Cửa chính', 'Lưu thông Kim khí', '木'],
        ].map(([n, p, r, hz], i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px dashed rgba(197,165,90,0.15)' : 'none' }}>
            <div style={{ width: 36, height: 36, border: `1px solid ${b.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 18, fontWeight: 700 }}>{hz}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: C, fontSize: 13 }}>{n}</div>
              <Mono style={{ color: M, marginTop: 2, display: 'block' }}>Đặt: {p}</Mono>
              <Mono style={{ color: D, fontSize: 9, marginTop: 1, display: 'block', textTransform: 'none', letterSpacing: 0 }}>{r}</Mono>
            </div>
          </div>
        ))}
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 4 · TIỂU VẬN — vận tháng widget
// ═══════════════════════════════════════════════════
function TieuVan() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: F, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Kanji ch="運" size={520} style={{ position: 'absolute', top: 80, left: -140 }} />
      <StatusBar dark />
      <Header sub="Vận tháng · Tiểu Vận" title="Tháng 5 · Bính Ngọ 2026" />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', position: 'relative' }}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Mono style={{ color: b.accent }}>Trụ Tháng · Niên</Mono>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'baseline', marginTop: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 64, fontWeight: 700, lineHeight: 1 }}>壬</div>
              <Mono style={{ color: M, marginTop: 4, display: 'block' }}>Nhâm · Thiên Can</Mono>
            </div>
            <div style={{ fontFamily: 'var(--hanzi)', color: D, fontSize: 22, opacity: 0.4 }}>·</div>
            <div>
              <div style={{ fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 64, fontWeight: 700, lineHeight: 1 }}>申</div>
              <Mono style={{ color: M, marginTop: 4, display: 'block' }}>Thân · Địa Chi</Mono>
            </div>
          </div>
          <div style={{ display: 'inline-block', marginTop: 14, padding: '5px 14px', border: `1px solid ${b.accent}`, fontFamily: 'var(--mono)', fontSize: 10, color: b.accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Nạp Âm · Kim Bạch Kim</div>
        </div>

        {/* Element relation */}
        <div style={{ padding: 16, background: 'rgba(197,165,90,0.08)', border: `1px solid ${b.accent}`, marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 30, fontWeight: 700 }}>金</div>
              <Mono style={{ color: M }}>Mệnh</Mono>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Mono style={{ color: b.accent, fontSize: 11, letterSpacing: '0.14em' }}>Tương Sinh</Mono>
              <div style={{ marginTop: 4, fontFamily: 'var(--mono)', color: '#9bbfa3', fontSize: 16 }}>→</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 30, fontWeight: 700 }}>金</div>
              <Mono style={{ color: M }}>Tháng</Mono>
            </div>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(197,165,90,0.25)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Thuận lợi', 'Tài vận tốt', 'Quý nhân'].map((t) => (
              <span key={t} style={{ padding: '3px 10px', border: `1px solid ${b.accent}`, fontFamily: 'var(--mono)', fontSize: 9, color: b.accent, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{t}</span>
            ))}
          </div>
        </div>

        <Mono style={{ color: b.accent, display: 'block', marginTop: 18, marginBottom: 6 }}>Lời luận</Mono>
        <div style={{ fontSize: 13, color: C, fontFamily: 'var(--serif)', lineHeight: 1.65, fontStyle: 'italic' }}>
          "Tháng Nhâm Thân — Kim sinh Kim, năng lượng bổ trợ tốt cho mệnh Kim. Là tháng nên đẩy mạnh việc tài chính, ký kết. Tránh thị phi từ Tam Bích phương Đông."
        </div>

        {/* mini calendar tease */}
        <Mono style={{ color: b.accent, display: 'block', marginTop: 18, marginBottom: 8 }}>Phân bố ngày trong tháng</Mono>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {Array.from({ length: 31 }).map((_, i) => {
            const v = (i * 13 + 7) % 100;
            const tier = v >= 70 ? 'tot' : v >= 40 ? 'tb' : 'xau';
            const c = tier === 'tot' ? b.accent : tier === 'xau' ? '#8b1a1a' : 'rgba(237,231,211,0.15)';
            return <div key={i} style={{ aspectRatio: '1', background: c, opacity: tier === 'tb' ? 0.4 : 0.85, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 8, color: tier === 'tot' ? F : C }}>{i + 1}</div>;
          })}
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 5 · CHUYỂN LỊCH — utility
// ═══════════════════════════════════════════════════
function ConvertLich() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: F, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <Header sub="Tiện ích" title="Chuyển âm · dương" />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', border: '1px solid rgba(197,165,90,0.25)', marginBottom: 18 }}>
          {['Dương → Âm', 'Âm → Dương'].map((t, i) => (
            <div key={t} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', background: i === 0 ? b.accent : 'transparent', color: i === 0 ? F : M, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t}</div>
          ))}
        </div>

        <div style={{ padding: 16, background: 'rgba(237,231,211,0.04)', border: `1px solid ${b.accent}` }}>
          <Mono style={{ color: M, display: 'block' }}>Ngày dương</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 38, color: C, lineHeight: 1, marginTop: 6, letterSpacing: '-0.02em' }}>12 / 05 / 2026</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {[['12', 'Ngày'], ['05', 'Tháng'], ['2026', 'Năm']].map(([v, l]) => (
              <div key={l} style={{ flex: 1, padding: '8px 10px', background: F, border: '1px solid rgba(197,165,90,0.18)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: C, fontSize: 16 }}>{v}</div>
                <Mono style={{ color: M, fontSize: 8 }}>{l}</Mono>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 22, color: b.accent }}>↓</span>
        </div>

        <Ticket holes={false} stub stubLabel="·Bính Ngọ·">
          <div style={{ padding: '18px 18px' }}>
            <Mono style={{ color: '#7a7050' }}>Lịch Âm</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 38, color: '#1d3129', lineHeight: 0.95, marginTop: 6 }}>25 tháng Tư</div>
            <div style={{ fontFamily: 'var(--serif)', color: '#3a3220', fontSize: 14, marginTop: 4, fontStyle: 'italic' }}>Ngày 25 tháng Tư năm Bính Ngọ</div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(122,112,80,0.3)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <Mono style={{ color: '#7a7050' }}>Can chi ngày</Mono>
                <div style={{ fontFamily: 'var(--hanzi)', color: '#1d3129', fontSize: 18, fontWeight: 700, marginTop: 2 }}>壬戌 · Nhâm Tuất</div>
              </div>
              <div>
                <Mono style={{ color: '#7a7050' }}>Trực · Sao</Mono>
                <div style={{ color: '#1d3129', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, marginTop: 4 }}>Thành · Kim Quỹ</div>
              </div>
            </div>
          </div>
        </Ticket>

        <Mono style={{ color: M, display: 'block', textAlign: 'center', marginTop: 18 }}>Năm Bính Ngọ — không nhuận</Mono>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 6 · HỒ SƠ GIA ĐÌNH — saved profiles
// ═══════════════════════════════════════════════════
function ProfilesList() {
  const b = useB();
  const profiles = [
    ['Tôi', 'Nguyễn Thị Minh', '20/05/1990', 'Quý Thuỷ · Trường Lưu', '癸', true],
    ['Chồng', 'Trần Văn Hùng', '20/08/1980', 'Đinh Hỏa · Lộ Bàng', '丁', false],
    ['Con trai', 'Trần Quang Anh', '11/11/2012', 'Bính Hỏa · Tích Lịch', '丙', false],
    ['Mẹ', 'Lê Thị Lan', '03/07/1958', 'Mậu Tuất · Bình Địa', '戊', false],
  ];
  return (
    <div style={{ width: 390, height: 800, background: F, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <StatusBar dark />
      <Header sub="Lưu một lần · dùng mãi" title="Hồ sơ gia đình" />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <Mono style={{ color: b.accent, display: 'block', marginBottom: 8 }}>4 hồ sơ đã lưu</Mono>
        {profiles.map(([rel, name, dob, menh, hz, me], i) => (
          <div key={i} style={{ marginBottom: 8, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', border: me ? `1px solid ${b.accent}` : '1px solid rgba(197,165,90,0.18)', background: me ? 'rgba(197,165,90,0.06)' : 'transparent' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#243a30', border: `1px solid ${b.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 22, fontWeight: 700 }}>{hz}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: C, fontSize: 14 }}>{name}</div>
                {me && <span style={{ padding: '1px 6px', background: b.accent, color: F, fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tôi</span>}
              </div>
              <Mono style={{ color: M, marginTop: 2, display: 'block' }}>{rel} · {dob}</Mono>
              <div style={{ fontSize: 11, color: D, fontFamily: 'var(--serif)', marginTop: 2 }}>{menh}</div>
            </div>
            <span style={{ color: M, fontFamily: 'var(--mono)' }}>›</span>
          </div>
        ))}

        <button style={{ width: '100%', marginTop: 8, padding: 14, background: 'transparent', color: b.accent, border: `1px dashed ${b.accent}`, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>+ Thêm hồ sơ</button>

        <Mono style={{ color: M, display: 'block', marginTop: 18, marginBottom: 8 }}>Hành động nhanh</Mono>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Hợp tuổi', '合', 'Chọn 2 hồ sơ'], ['Cùng tìm ngày', '尋', 'Chọn nhiều người']].map(([t, hz, sub]) => (
            <div key={t} style={{ padding: 14, border: '1px solid rgba(197,165,90,0.2)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--hanzi)', color: b.accent, fontSize: 22, fontWeight: 700 }}>{hz}</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: C, fontSize: 12, marginTop: 4, textTransform: 'uppercase' }}>{t}</div>
              <Mono style={{ color: M, fontSize: 8, marginTop: 2, display: 'block' }}>{sub}</Mono>
            </div>
          ))}
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 8 · ERROR STATES — NO_DATES_FOUND, RANGE_TOO_LARGE
// ═══════════════════════════════════════════════════
function ErrorNoDates() {
  const b = useB();
  return (
    <div style={{ width: 390, height: 800, background: F, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Kanji ch="無" size={520} style={{ position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)', opacity: 0.5 }} />
      <StatusBar dark />
      <Header sub="Không tìm được ngày" title="Khoảng đã chọn quá hẹp" />
      <div style={{ flex: 1, padding: '20px 24px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
          <Ticket holes={false} transform="rotate(-2deg)" style={{ width: 280, opacity: 0.5 }}>
            <div style={{ padding: '40px 24px', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 64, color: 'rgba(122,112,80,0.4)' }}>—</div>
              <Mono style={{ color: '#7a7050', marginTop: 6 }}>0 / 31 ngày qua được lọc</Mono>
            </div>
          </Ticket>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: C, marginTop: 24, textTransform: 'uppercase' }}>Không có ngày phù hợp</div>
          <div style={{ fontSize: 13, color: D, fontFamily: 'var(--serif)', lineHeight: 1.6, maxWidth: 280, marginTop: 8 }}>
            Trong khoảng <strong style={{ color: C }}>01–31/05/2026</strong> không có ngày nào qua đủ Layer 1 + Layer 2 cho mục đích <strong style={{ color: b.accent }}>Khai trương</strong>.
          </div>
        </div>
        <div style={{ padding: 14, border: '1px solid rgba(197,165,90,0.25)', marginBottom: 12 }}>
          <Mono style={{ color: b.accent, display: 'block', marginBottom: 8 }}>Gợi ý</Mono>
          {['Mở rộng khoảng → 90 ngày', 'Đổi mục đích sang Ký kết hợp đồng', 'Bỏ chế độ "tránh sao Tam Nương"'].map((s) => (
            <div key={s} style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
              <span style={{ color: b.accent, fontFamily: 'var(--mono)' }}>·</span>
              <span style={{ flex: 1, color: D, fontFamily: 'var(--serif)', fontSize: 12 }}>{s}</span>
              <span style={{ color: M, fontFamily: 'var(--mono)' }}>›</span>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: 14, background: b.accent, color: F, border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mở rộng khoảng → 31/07</button>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════
Object.assign(window, {
  HopTuoiInput, HopTuoiResult, PhongThuy, TieuVan, ConvertLich,
  ProfilesList, ErrorNoDates
});
