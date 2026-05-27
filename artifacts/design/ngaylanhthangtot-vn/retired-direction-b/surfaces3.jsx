/* global React, Mono, Kanji, StatusBar, HomeIndicator */

// ═══════════════════════════════════════════════════════════════════════
// CHỌN NGÀY RESULT — DIRECTION A : Refined editorial
// ═══════════════════════════════════════════════════════════════════════
function PickResultA() {
  const W = 390, H = 800;
  return (
    <div style={{ width: W, height: H, background: 'var(--bg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'var(--serif)' }} className="nltt-paper">
      <StatusBar />
      {/* Sticky context header */}
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--ink)' }}>←</div>
        <div style={{ flex: 1 }}>
          <Mono style={{ color: 'var(--ink-mute)' }}>Việc của bạn</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Khai trương cửa hàng</div>
        </div>
        <div style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border)' }}>
          <Mono style={{ color: 'var(--ink)' }}>T6 → T8</Mono>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }} className="clean-scroll">
        {/* Top recommendation — hero card */}
        <div style={{ margin: '0 16px 18px', background: 'var(--paper)', border: '1px solid var(--border)', borderTop: '3px solid var(--gold)', position: 'relative', overflow: 'hidden' }}>
          <Kanji ch="吉" size={140} style={{ position: 'absolute', right: -14, top: -20, color: 'transparent', WebkitTextStroke: '1px rgba(197,165,90,0.16)' }} />
          <div style={{ padding: '14px 16px 16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Mono style={{ color: 'var(--gold-deep)' }}>Tuyệt nhất · Đứng đầu</Mono>
              <Mono style={{ color: 'var(--ink-mute)' }}>1 / 7 ngày tốt</Mono>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 8 }}>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thứ Tư</div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 56, color: 'var(--ink)', lineHeight: 0.9 }}>17/06</div>
              </div>
              <div style={{ flex: 1, paddingBottom: 6, textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 48, color: 'var(--gold-deep)', lineHeight: 0.9 }}>92</div>
                <Mono style={{ color: 'var(--ink-mute)' }}>điểm hợp mệnh</Mono>
              </div>
            </div>

            {/* WHY — clear, no jargon */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
              <Mono style={{ color: 'var(--gold-deep)' }}>Vì sao</Mono>
              <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.65 }}>
                <li>Thiên Đức · Nguyệt Đức cùng tới — đại cát cho khai trương.</li>
                <li>Trụ ngày <strong>Mộc</strong> bù Hỏa cho mệnh Thủy của bạn.</li>
                <li>Không phạm Tam Sát, Tuế Phá tuổi Canh Ngọ.</li>
              </ul>
            </div>

            {/* Best hours */}
            <div style={{ marginTop: 14 }}>
              <Mono style={{ color: 'var(--ink-mute)' }}>Giờ đẹp trong ngày</Mono>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
                {[['Tỵ', '9–11h', true], ['Mùi', '13–15h', false], ['Dậu', '17–19h', false]].map(([n, h, best]) => (
                  <div key={n} style={{ padding: '8px 4px', background: best ? 'var(--ink)' : 'transparent', border: `1px solid ${best ? 'var(--ink)' : 'var(--border)'}`, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, color: best ? 'var(--gold)' : 'var(--ink)', textTransform: 'uppercase' }}>{n}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: best ? 'var(--cream-dim)' : 'var(--ink-mute)', marginTop: 2 }}>{h}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={{ flex: 1, padding: 12, background: 'var(--forest)', color: 'var(--gold)', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Lưu vào lịch</button>
              <button style={{ padding: '12px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: 14, cursor: 'pointer' }}>↗</button>
            </div>
          </div>
        </div>

        {/* Other candidates — compact list */}
        <div style={{ padding: '0 16px' }}>
          <Mono style={{ color: 'var(--ink-mute)', display: 'block', marginBottom: 8 }}>Khác trong khoảng</Mono>
          {[
            ['T2 22/06', 88, 'Mão · 5–7h', 'Mộc trợ Hỏa, không phạm trực'],
            ['T6 26/06', 84, 'Tỵ · 9–11h', 'Hợp ngày Tam hợp Tỵ Dậu Sửu'],
            ['CN 12/07', 80, 'Mùi · 13–15h', 'Sao Thiên Hỷ, vừa hết Tam Tai'],
            ['T4 22/07', 76, 'Dậu · 17–19h', 'Nguyệt Đức trợ, kỵ giờ Tý'],
          ].map(([d, s, h, why], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ minWidth: 78 }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{d}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>{h}</div>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4 }}>{why}</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 24, color: 'var(--gold-deep)' }}>{s}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)', marginTop: 14 }}>
          <Mono style={{ color: 'var(--ink-mute)' }}>3 ngày kỵ — đã loại</Mono>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)' }}>20/06, 04/07, 18/07 — phạm Tam Sát, không gợi ý</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CHỌN NGÀY RESULT — DIRECTION B : Almanac (forest, ticket-feel)
// ═══════════════════════════════════════════════════════════════════════
function PickResultB() {
  const W = 390, H = 800;
  return (
    <div style={{ width: W, height: H, background: 'var(--forest)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }} className="grain">
      <StatusBar dark />
      <div style={{ padding: '4px 16px 14px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--gold)' }}>←</div>
        <div style={{ flex: 1 }}>
          <Mono style={{ color: 'var(--gold)' }}>Việc của bạn</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: 'var(--cream)' }}>Khai trương cửa hàng</div>
        </div>
        <div style={{ padding: '4px 8px', border: '1px solid rgba(197,165,90,0.4)' }}>
          <Mono style={{ color: 'var(--gold)' }}>T6 → T8</Mono>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 18px' }} className="clean-scroll">
        {/* Hero "ticket" */}
        <div style={{ position: 'relative', background: 'var(--cream)', boxShadow: '0 18px 36px rgba(0,0,0,0.5)' }}>
          <div style={{ height: 10, background: 'repeating-linear-gradient(90deg, var(--cream) 0 6px, transparent 6px 10px)', borderBottom: '1px dashed rgba(122,112,80,0.4)' }} />
          <div style={{ position: 'absolute', top: 36, left: -7, width: 14, height: 14, borderRadius: '50%', background: 'var(--forest)' }} />
          <div style={{ position: 'absolute', top: 36, right: -7, width: 14, height: 14, borderRadius: '50%', background: 'var(--forest)' }} />

          <div style={{ padding: '16px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Mono style={{ color: 'var(--gold-deep)' }}>Đại cát · 92 / 100</Mono>
            <Mono style={{ color: 'var(--ink-mute)' }}>Phiếu 01 / 07</Mono>
          </div>

          <div style={{ padding: '4px 18px 14px', display: 'flex', alignItems: 'flex-end', gap: 16, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, right: 18, fontFamily: 'var(--hanzi)', color: 'var(--danger)', fontSize: 26, fontWeight: 700, writingMode: 'vertical-rl', letterSpacing: 4 }}>大吉</div>
            <div>
              <Mono style={{ color: 'var(--ink-mute)' }}>Thứ Tư</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 900, fontSize: 76, color: 'var(--ink)', lineHeight: 0.85, letterSpacing: '-0.04em' }}>17</div>
              <Mono style={{ color: 'var(--ink-mute)' }}>tháng 6 / 2026</Mono>
            </div>
            <div style={{ flex: 1, paddingBottom: 10 }}>
              <div style={{ fontFamily: 'var(--hanzi)', fontWeight: 700, fontSize: 28, color: 'var(--forest)', lineHeight: 1 }}>甲寅</div>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', textTransform: 'uppercase', marginTop: 2 }}>Giáp Dần</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>Mộc · Trực Khai</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(122,112,80,0.3)', borderBottom: '1px solid rgba(122,112,80,0.3)', padding: '12px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[['Tỵ', '9–11h', true], ['Mùi', '13–15h', false], ['Dậu', '17–19h', false]].map(([n, h, best]) => (
              <div key={n} style={{ padding: 8, background: best ? 'var(--forest)' : 'transparent', textAlign: 'center', border: best ? 'none' : '1px solid rgba(122,112,80,0.3)' }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, color: best ? 'var(--gold)' : 'var(--ink)' }}>{n}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: best ? 'var(--cream-dim)' : 'var(--ink-mute)' }}>{h}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px 18px 16px' }}>
            <Mono style={{ color: 'var(--gold-deep)' }}>Cát Thần</Mono>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, fontFamily: 'var(--serif)', marginTop: 6 }}>
              Thiên Đức · Nguyệt Đức · Thiên Tài. Trụ ngày Mộc bù Hỏa cho mệnh Thủy của bạn — không phạm Tam Sát tuổi Canh Ngọ.
            </div>
          </div>

          <div style={{ height: 10, background: 'repeating-linear-gradient(90deg, var(--cream) 0 6px, transparent 6px 10px)', borderTop: '1px dashed rgba(122,112,80,0.4)' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button style={{ flex: 1, padding: 13, background: 'var(--gold)', color: 'var(--forest)', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Lưu vào lịch</button>
          <button style={{ flex: 1, padding: 13, background: 'transparent', border: '1px solid rgba(197,165,90,0.4)', color: 'var(--gold)', fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gửi cho cả nhà</button>
        </div>

        {/* alternates */}
        <Mono style={{ color: 'var(--gold)', display: 'block', marginTop: 22, marginBottom: 8 }}>6 phiếu khác</Mono>
        {[
          ['22/06', 88, 'T2', 'Mão'],
          ['26/06', 84, 'T6', 'Tỵ'],
          ['12/07', 80, 'CN', 'Mùi'],
          ['22/07', 76, 'T4', 'Dậu'],
        ].map(([d, s, day, h], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(197,165,90,0.18)', gap: 12 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--gold)', minWidth: 28 }}>{day}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, color: 'var(--cream)', fontSize: 16 }}>{d}</div>
              <Mono style={{ color: 'var(--green-mute)' }}>Giờ {h}</Mono>
            </div>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, color: 'var(--gold)', fontSize: 26 }}>{s}</div>
          </div>
        ))}
      </div>
      <HomeIndicator dark />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MUA LƯỢNG — DIRECTION A : Refined editorial
// ═══════════════════════════════════════════════════════════════════════
function BuyA() {
  const W = 390, H = 800;
  return (
    <div style={{ width: W, height: H, background: 'var(--bg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'var(--serif)' }} className="nltt-paper">
      <StatusBar />
      <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, fontFamily: 'var(--mono)', fontSize: 16 }}>←</div>
        <div style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16 }}>Nạp lượng & gói</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }} className="clean-scroll">
        {/* Wallet */}
        <div style={{ padding: '14px 16px', background: 'var(--paper)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div>
            <Mono style={{ color: 'var(--ink-mute)' }}>Số dư hiện tại</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 28, color: 'var(--ink)' }}>20 lượng</div>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <Mono style={{ color: 'var(--ink-mute)' }}>Trung bình tuần</Mono>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>~6 lượng</div>
            <Mono style={{ color: 'var(--gold-deep)' }}>Đủ ~3 tuần</Mono>
          </div>
        </div>

        {/* Plan toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border)', padding: 3, marginBottom: 14 }}>
          <div style={{ flex: 1, padding: 10, textAlign: 'center', background: 'var(--ink)', color: 'var(--gold)', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gói tháng</div>
          <div style={{ flex: 1, padding: 10, textAlign: 'center', color: 'var(--ink)', fontFamily: 'var(--display-2)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mua lẻ</div>
        </div>

        {/* Plan card — featured */}
        <div style={{ background: 'var(--forest)', position: 'relative', padding: 20, marginBottom: 12, overflow: 'hidden' }} className="grain">
          <Kanji ch="月" size={130} style={{ position: 'absolute', right: -10, top: -10, color: 'transparent', WebkitTextStroke: '1px rgba(197,165,90,0.16)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Mono style={{ color: 'var(--gold)' }}>Phổ biến · 78% chọn</Mono>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 24, color: 'var(--cream)', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: 6 }}>Tháng An Cư</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 28, color: 'var(--gold)' }}>89k</div>
                <Mono style={{ color: 'var(--green-mute)' }}>/ tháng</Mono>
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(197,165,90,0.25)' }}>
              {[
                ['100 lượng / tháng', 'Đủ 26 kiểu việc'],
                ['Lá số tứ trụ chi tiết', 'In, gửi cho cả nhà'],
                ['Cảnh báo Tam Tai · Tuế Phá', 'Nhắc trước 7 ngày'],
              ].map(([t, h], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
                  <span style={{ color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: 14 }}>✓</span>
                  <div>
                    <div style={{ color: 'var(--cream)', fontSize: 14 }}>{t}</div>
                    <Mono style={{ color: 'var(--green-mute)' }}>{h}</Mono>
                  </div>
                </div>
              ))}
            </div>
            <button style={{ width: '100%', marginTop: 14, padding: 14, background: 'var(--gold)', color: 'var(--forest)', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Đăng ký tháng An Cư →</button>
            <Mono style={{ display: 'block', textAlign: 'center', color: 'var(--green-mute)', marginTop: 10 }}>Hủy bất cứ lúc nào · Tự động nạp</Mono>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border)', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Năm Phú Quý</div>
            <Mono style={{ color: 'var(--ink-mute)' }}>1.500 lượng · giảm 30%</Mono>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>749k</div>
            <Mono style={{ color: 'var(--ink-mute)', textDecoration: 'line-through' }}>1.068k</Mono>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MUA LƯỢNG — DIRECTION B : Almanac
// ═══════════════════════════════════════════════════════════════════════
function BuyB() {
  const W = 390, H = 800;
  return (
    <div style={{ width: W, height: H, background: 'var(--forest)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }} className="grain">
      <Kanji ch="財" size={420} style={{ position: 'absolute', top: 60, right: -110, color: 'transparent', WebkitTextStroke: '1px rgba(197,165,90,0.06)' }} />
      <StatusBar dark />
      <div style={{ padding: '4px 16px 14px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <div style={{ width: 36, height: 36, fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--gold)' }}>←</div>
        <div style={{ flex: 1, fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 16, color: 'var(--cream)' }}>Nạp lượng &amp; gói</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', position: 'relative' }} className="clean-scroll">
        {/* Wallet — almanac */}
        <div style={{ padding: '20px 0 16px', textAlign: 'center', borderBottom: '1px solid rgba(197,165,90,0.25)', marginBottom: 18 }}>
          <Mono style={{ color: 'var(--gold)' }}>Trong túi của bạn</Mono>
          <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 80, color: 'var(--gold)', lineHeight: 0.9, letterSpacing: '-0.04em', marginTop: 4 }}>20</div>
          <Mono style={{ color: 'var(--cream-dim)' }}>lượng · đủ cho ~3 tuần dùng</Mono>
        </div>

        <Mono style={{ color: 'var(--gold)', display: 'block', marginBottom: 8 }}>Chọn gói</Mono>

        {[
          ['goi_6thang',  'Gói 6 tháng',  600, '299k', '/ 6 tháng — giảm 25%', 'Phổ biến · 64%', true],
          ['goi_12thang', 'Gói 12 tháng', 1500, '549k', '/ 12 tháng — giảm 38%', 'Tiết kiệm nhất', false],
          ['le',          'Lẻ — gói nhỏ', 50,  '49k',  'một lần',              'Dùng thử',        false],
        ].map(([sku, t, l, p, per, tag, hi]) => (
          <div key={sku} data-sku={sku} style={{ marginBottom: 10, padding: '14px 16px', border: hi ? '1px solid var(--gold)' : '1px solid rgba(197,165,90,0.25)', background: hi ? 'rgba(197,165,90,0.08)' : 'transparent', position: 'relative' }}>
            {hi && <div style={{ position: 'absolute', top: -1, right: 10, padding: '3px 10px', background: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--forest)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{tag}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 18, color: 'var(--cream)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{t}</div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 32, color: 'var(--gold)', lineHeight: 1, marginTop: 4 }}>{l}<span style={{ fontSize: 13, color: 'var(--green-mute)', fontWeight: 500, marginLeft: 6 }}>lượng</span></div>
                {!hi && <Mono style={{ color: 'var(--green-mute)', marginTop: 4, display: 'block' }}>{tag}</Mono>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: 'var(--cream)' }}>{p}</div>
                <Mono style={{ color: 'var(--green-mute)' }}>{per}</Mono>
              </div>
            </div>
          </div>
        ))}

        <button style={{ width: '100%', marginTop: 12, padding: 16, background: 'var(--gold)', color: 'var(--forest)', border: 'none', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tiếp — thanh toán qua PayOS →</button>
        <Mono style={{ display: 'block', textAlign: 'center', color: 'var(--green-mute)', marginTop: 12 }}>Quét VietQR · hóa đơn VAT điện tử</Mono>
      </div>
      <HomeIndicator dark />
    </div>
  );
}

window.PickResultA = PickResultA;
window.PickResultB = PickResultB;
window.BuyA = BuyA;
window.BuyB = BuyB;
