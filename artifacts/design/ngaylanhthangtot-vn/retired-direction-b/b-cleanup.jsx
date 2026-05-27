/* Row 2f · Trust / cleanup — before/after diffs for the §7 hot-spots, plus methodology + locked-state explainers.
   Concrete component-level fixes that don't change routing. */
/* global React, Phone, Ticket, Kanji, Mono, Stamp, useB */

// ─── Mini phone halves ───
function CUDiff({ left, right, leftLabel = 'Hiện tại', rightLabel = 'Đề xuất' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b1a1a' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#8b1a1a', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{leftLabel}</span>
        </div>
        {left}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3d6b4a' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#3d6b4a', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{rightLabel}</span>
        </div>
        {right}
      </div>
    </div>
  );
}

const CU_DARK = { background: '#1d3129', minHeight: 360, padding: '14px 14px', color: '#ede7d3', position: 'relative' };
const CU_PAPER = { background: '#ede7d3', minHeight: 360, padding: '14px 14px', color: '#18150e', position: 'relative' };

// ─── 44 · Payment success diff ───
function CUPaySuccess() {
  const b = useB();
  return (
    <div style={{ padding: '24px 20px', background: '#f1ece1', minHeight: '100%' }}>
      <Mono style={{ color: '#9a7c22' }}>§7.5 · /mua-luong/thanh-cong</Mono>
      <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, margin: '6px 0 14px', textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
        Webhook leak → user-first copy
      </h2>

      <CUDiff
        left={
          <div style={CU_DARK}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9a7c22' }}>// raw status from API</div>
            <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 10, color: '#c8bc98', lineHeight: 1.6 }}>
              Trạng thái: <span style={{ color: '#3d8a4f' }}>"PAID"</span><br />
              Webhook: <span style={{ color: '#3d8a4f' }}>received</span><br />
              order_code: <span style={{ color: '#e58a5c' }}>"NLTT-A1B2C3"</span><br />
              sku: <span style={{ color: '#e58a5c' }}>"goi_6thang"</span><br />
              credits_added: <span style={{ color: '#e58a5c' }}>600</span>
            </div>
            <div style={{ marginTop: 14, padding: 8, background: 'rgba(0,0,0,0.4)', fontFamily: 'var(--mono)', fontSize: 9, color: '#c8bc98' }}>
              ✓ Lượng đã được cộng. Vui lòng quay lại trang chủ.
            </div>
            <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050' }}>
              [polling: 2/10 · 1.4s]
            </div>
          </div>
        }
        right={
          <div style={CU_PAPER}>
            <div style={{ position: 'absolute', top: 10, right: 10, fontFamily: 'var(--hanzi)', fontSize: 22, color: b.accentDeep, fontWeight: 700, opacity: 0.5 }}>完</div>
            <Mono style={{ color: '#7a7050' }}>NLTT-A1B2C3 · 23/10 14:32</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 18, marginTop: 6, textTransform: 'uppercase' }}>Đã nhận thanh toán</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#5a4f30', marginTop: 2 }}>
              Gói 6 tháng · 600 lượng
            </div>
            <div style={{ marginTop: 14, padding: '10px 0', borderTop: '1px dashed rgba(122,112,80,0.4)', borderBottom: '1px dashed rgba(122,112,80,0.4)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <div>
                <Mono style={{ color: '#7a7050' }}>Trước</Mono>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: '#7a7050' }}>15</div>
              </div>
              <span style={{ color: b.accent, fontFamily: 'var(--display-2)', fontWeight: 800 }}>→</span>
              <div>
                <Mono style={{ color: b.accentDeep }}>Mới</Mono>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, color: b.accentDeep }}>615</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontFamily: 'var(--serif)', fontSize: 11, color: '#3a3220' }}>
              Có hiệu lực đến <strong>23/04/2026</strong>.
            </div>
          </div>
        }
      />

      <ul style={{ marginTop: 18, fontFamily: 'var(--serif)', fontSize: 13, color: '#3a3220', lineHeight: 1.7, paddingLeft: 18 }}>
        <li>Bỏ chữ "Webhook" / "polling" / status code thô.</li>
        <li>Hiển thị số dư <strong>trước → sau</strong> — câu trả lời người dùng thực sự muốn.</li>
        <li>Order code & SKU vẫn còn (cần cho hỗ trợ) nhưng đặt phụ.</li>
        <li>Stamp 完 thay vì checkmark generic.</li>
      </ul>
    </div>
  );
}

// ─── 45 · API doc leak diff (Hôm nay) ───
function CUApiDoc() {
  const b = useB();
  return (
    <div style={{ padding: '24px 20px', background: '#f1ece1', minHeight: '100%' }}>
      <Mono style={{ color: '#9a7c22' }}>§7.8 · /app/hom-nay</Mono>
      <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, margin: '6px 0 14px', textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
        API doc → Lời khuyên hôm nay
      </h2>

      <CUDiff
        left={
          <div style={CU_DARK}>
            <Mono style={{ color: '#7a7050' }}>23 / 10 · Quý Mão</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, color: '#ede7d3', marginTop: 4 }}>Hôm nay</div>
            <div style={{ marginTop: 14, padding: 10, background: 'rgba(0,0,0,0.4)', borderLeft: '3px solid #9a7c22' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9a7c22', letterSpacing: '0.1em' }}>API · TRẢ VỀ</div>
              <pre style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#c8bc98', lineHeight: 1.5, margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{`{
  "date": "2025-10-23",
  "can_chi": "QUY_MAO",
  "truc": "DINH",
  "hoang_dao": true,
  "score": 89,
  "best_hours": ["THIN", "TI"],
  "intents": { ... 26 keys ... }
}`}</pre>
            </div>
            <div style={{ marginTop: 10, fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050' }}>
              cache: today-reading-cache.ts<br />
              endpoint: /api/v2/today
            </div>
          </div>
        }
        right={
          <div style={CU_PAPER}>
            <Mono style={{ color: '#7a7050' }}>23 / 10 · Quý Mão</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, marginTop: 4, textTransform: 'uppercase' }}>Hôm nay</div>
            <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', background: '#3d6b4a', color: '#ede7d3', fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Hoàng Đạo · 89/100
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed rgba(122,112,80,0.3)' }}>
              <Mono style={{ color: '#7a7050' }}>Giờ tốt</Mono>
              <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, marginTop: 2 }}>Thìn 7–9h · Tị 9–11h</div>
            </div>
            <div style={{ marginTop: 10 }}>
              <Mono style={{ color: '#7a7050' }}>Hợp việc</Mono>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>Khai trương · Cưới hỏi · Ký hợp đồng</div>
            </div>
          </div>
        }
      />

      <ul style={{ marginTop: 18, fontFamily: 'var(--serif)', fontSize: 13, color: '#3a3220', lineHeight: 1.7, paddingLeft: 18 }}>
        <li>Bỏ JSON dump, endpoint, cache reference.</li>
        <li>Score → chip Hoàng Đạo có ngữ cảnh (89/100).</li>
        <li>Best hours → tên giờ + khung phiên thay vì array of strings.</li>
        <li>Intent map → 3 việc nổi bật, phần còn lại có "Xem 23 việc khác".</li>
      </ul>
    </div>
  );
}

// ─── 46 · NO_DATES_FOUND diff ───
function CUEmptyState() {
  const b = useB();
  return (
    <div style={{ padding: '24px 20px', background: '#f1ece1', minHeight: '100%' }}>
      <Mono style={{ color: '#9a7c22' }}>§7.9 · /chon-ngay/ket-qua · empty</Mono>
      <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, margin: '6px 0 14px', textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
        JSON dump → Không tìm được ngày
      </h2>

      <CUDiff
        left={
          <div style={CU_DARK}>
            <Mono style={{ color: '#8b1a1a' }}>ERROR · NO_DATES_FOUND</Mono>
            <div style={{ marginTop: 8, padding: 10, background: 'rgba(0,0,0,0.4)' }}>
              <pre style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#c8bc98', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "error": "NO_DATES_FOUND",
  "code": 422,
  "filters": {
    "intent": "khai_truong",
    "range": ["2025-10-23",
              "2025-11-23"],
    "min_grade": "A",
    "exclude_haedao": true
  },
  "matched": 0
}`}</pre>
            </div>
            <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 9, color: '#7a7050' }}>
              [retry available]
            </div>
          </div>
        }
        right={
          <div style={CU_PAPER}>
            <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
              <span style={{ fontFamily: 'var(--hanzi)', fontSize: 48, color: '#7a7050', fontWeight: 700, opacity: 0.5 }}>無</span>
            </div>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, textAlign: 'center', textTransform: 'uppercase' }}>
              Không tìm được ngày
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#5a4f30', textAlign: 'center', marginTop: 4, lineHeight: 1.5 }}>
              Trong khoảng đã chọn không có ngày phù hợp việc Khai trương theo mệnh của bạn.
            </div>
            <div style={{ marginTop: 14, padding: '10px 0', borderTop: '1px dashed rgba(122,112,80,0.3)' }}>
              <Mono style={{ color: '#7a7050' }}>Thử</Mono>
              <ul style={{ fontFamily: 'var(--serif)', fontSize: 11, marginTop: 4, paddingLeft: 14, lineHeight: 1.6 }}>
                <li>Mở rộng khoảng → 2 tháng</li>
                <li>Hạ chuẩn xuống <strong>B</strong></li>
                <li>Bao gồm Hắc Đạo có giờ tốt</li>
              </ul>
            </div>
          </div>
        }
      />

      <ul style={{ marginTop: 18, fontFamily: 'var(--serif)', fontSize: 13, color: '#3a3220', lineHeight: 1.7, paddingLeft: 18 }}>
        <li>無 (vô) → ngôn ngữ thay vì error code.</li>
        <li>Diễn giải vì sao trống — bộ lọc + mệnh người dùng.</li>
        <li>Đề xuất 3 hành động cụ thể, không chỉ "Thử lại".</li>
      </ul>
    </div>
  );
}

// ─── 47 · Methodology card (collapsible) ───
function CUMethodology() {
  const b = useB();
  return (
    <div style={{ padding: '24px 20px', background: '#f1ece1', minHeight: '100%' }}>
      <Mono style={{ color: '#9a7c22' }}>Mới · cần thêm vào /chon-ngay/ket-qua</Mono>
      <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, margin: '6px 0 14px', textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
        Cách chúng tôi chọn ngày
      </h2>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: '#3a3220', lineHeight: 1.65, marginBottom: 18 }}>
        Một thẻ collapsible đặt dưới kết quả tìm ngày — xây niềm tin bằng việc giải thích quy trình. Đây là điều thầy bốc không nói, lịch giấy không có.
      </p>

      <div style={{ background: '#ede7d3', padding: '16px 18px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12, right: 14, fontFamily: 'var(--hanzi)', fontSize: 24, color: b.accentDeep, fontWeight: 700, opacity: 0.4 }}>法</div>
        <Mono style={{ color: '#7a7050' }}>Phương pháp · 4 bước</Mono>
        <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 16, marginTop: 4, textTransform: 'uppercase' }}>Cách chúng tôi chọn ngày cho bạn</div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['1', 'Đối chiếu Bát Tự', 'Lấy can chi 4 trụ (năm/tháng/ngày/giờ) từ lá số của bạn — xác định ngũ hành nhật chủ và đại vận hiện tại.'],
            ['2', 'Kiểm Trực · Hoàng Đạo', '12 trực + 28 sao + Hoàng/Hắc đạo. Loại sớm những ngày kỵ với việc bạn chọn.'],
            ['3', 'Tính điểm phù hợp', 'Mỗi ngày được chấm theo công thức: tương sinh nhật chủ × hợp việc × giờ tốt sẵn có. Điểm 0–100.'],
            ['4', 'Sắp xếp & gợi ý', 'Top 5 ngày được luận giải bằng AI dựa trên lá số riêng — không phải bản dịch chung.'],
          ].map(([n, h, d]) => (
            <div key={n} style={{ display: 'flex', gap: 12 }}>
              <div style={{ flexShrink: 0, width: 26, height: 26, background: b.accentDeep, color: '#ede7d3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 12 }}>{n}</div>
              <div>
                <div style={{ fontFamily: 'var(--display-2)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{h}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: '#3a3220', marginTop: 2, lineHeight: 1.5 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: '10px 0 0', borderTop: '1px dashed rgba(122,112,80,0.3)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: '#5a4f30' }}>
          Dữ liệu: Hiệp Kỷ Biện Phương Thư · Ngọc Hạp Thông Thư · phương pháp Trạch Cát truyền thống.
        </div>
      </div>

      <p style={{ marginTop: 14, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: '#7a7050', lineHeight: 1.6 }}>
        Hiển thị mặc định <strong>thu gọn</strong>; user mở khi muốn hiểu. Không đập vào mặt — nhưng có sẵn khi cần.
      </p>
    </div>
  );
}

// ─── 48 · Locked-state explainer ───
function CULocked() {
  const b = useB();
  return (
    <div style={{ padding: '24px 20px', background: '#f1ece1', minHeight: '100%' }}>
      <Mono style={{ color: '#9a7c22' }}>Mới · /la-so · /cai-dat</Mono>
      <h2 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 22, margin: '6px 0 14px', textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
        Ngày sinh không thể đổi
      </h2>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: '#3a3220', lineHeight: 1.65, marginBottom: 18 }}>
        Lá số dựa trên ngày-giờ sinh — đổi sau là phá. Hiện app báo bằng error toast khi user thử sửa. Thay bằng locked-state explainer nhìn-trước-khi-bấm.
      </p>

      <div style={{ background: '#ede7d3', padding: '16px 18px', position: 'relative', borderLeft: `3px solid ${b.accentDeep}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontFamily: 'var(--hanzi)', fontSize: 28, color: b.accentDeep, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>鎖</span>
          <div style={{ flex: 1 }}>
            <Mono style={{ color: '#7a7050' }}>Khoá · Bát Tự</Mono>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
              Ngày sinh & giờ sinh không thể thay đổi
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: '#3a3220', marginTop: 6, lineHeight: 1.55 }}>
              Lá số được lập một lần dựa trên thời điểm bạn chào đời.
              Thay đổi sau khi tạo sẽ phá vỡ kết quả phân tích — toàn bộ vận trình, đại vận, tiểu vận đều phải tính lại.
            </div>

            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(122,112,80,0.1)' }}>
              <Mono style={{ color: '#7a7050' }}>Trường hợp đặc biệt</Mono>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 11, marginTop: 4, lineHeight: 1.5, color: '#3a3220' }}>
                Nếu bạn nhập sai ngày sinh ban đầu — hãy liên hệ qua email hỗ trợ. Chúng tôi sẽ reset trong vòng 24 giờ.
              </div>
            </div>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 14, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: '#7a7050', lineHeight: 1.6 }}>
        Cùng pattern dùng được cho: hồ sơ gia đình (tên thành viên), mã giới thiệu (đã apply), v.v.
      </p>
    </div>
  );
}

// ─── Notes ───
function CUNotes() {
  return (
    <div style={{ padding: '40px 56px', background: '#f1ece1', height: '100%', fontFamily: 'var(--serif)', color: '#18150e', overflow: 'auto', position: 'relative' }}>
      <div style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a7c22', borderBottom: '1px solid #c5a55a', paddingBottom: 4 }}>
        Section 2f · Trust / cleanup
      </div>
      <h1 style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 36, lineHeight: 1.05, margin: '14px 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
        Thirty-minute fixes that compound into trust.
      </h1>
      <p style={{ fontSize: 15, color: '#3a3220', lineHeight: 1.65, maxWidth: 720 }}>
        These are component-level diffs — they don't change routing or copy strategy. Each one removes a moment where the user can see internal plumbing (webhook received, JSON error, API endpoint, sessionStorage cache) — moments that quietly say "this is a beta someone wired up", and add design where today there's silence (methodology, locked-state).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 28 }}>
        {[
          ['44 · Thanh công', 'Webhook + status code thay bằng số dư trước → sau. Order code & SKU vẫn còn cho support, đặt phụ.'],
          ['45 · API doc leak', 'Bỏ JSON dump khỏi /hom-nay. Score → chip Hoàng Đạo, intents → 3 việc nổi bật.'],
          ['46 · NO_DATES_FOUND', '無 chữ hán + lý giải bộ lọc + 3 hành động khắc phục cụ thể (mở rộng khoảng / hạ A→B / bao gồm Hắc Đạo).'],
          ['47 · Methodology', '"Cách chúng tôi chọn ngày" — 4 bước collapsible. Niềm tin xây bằng minh bạch quy trình, không bằng câu chữ marketing.'],
          ['48 · Locked-state', '鎖 explainer thay error toast khi user thử sửa ngày sinh. Có cửa thoát: liên hệ email để reset.'],
        ].map(([t, d]) => (
          <div key={t} style={{ borderTop: '2px solid #18150e', paddingTop: 12 }}>
            <div style={{ fontFamily: 'var(--display-2)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>{t}</div>
            <div style={{ fontSize: 13, color: '#3a3220', marginTop: 6, lineHeight: 1.55 }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(197,165,90,0.18)', borderLeft: '3px solid #c5a55a' }}>
        <Mono style={{ color: '#9a7c22' }}>Sequencing</Mono>
        <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6, color: '#3a3220' }}>
          Ship cleanup row first (Sprint 1). Each diff is a 30-minute change to one component, no routing impact, no DB migration. The compound effect on trust pays for the larger flow restructure later.
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { CUPaySuccess, CUApiDoc, CUEmptyState, CUMethodology, CULocked, CUNotes });
