/**
 * Tiết Khí (24 solar terms) — 2025-2040 pre-computed lookup.
 * 384 rows ≈ 12 KB gzipped. Zero maintenance until 2040.
 * Dates are in Vietnam timezone (UTC+7).
 *
 * Solar term index follows the Chinese astronomical order starting at Tiểu Hàn (index 0).
 * Ecliptic longitude: Tiểu Hàn=285°, Đại Hàn=300°, Lập Xuân=315°, …
 */

export interface SolarTerm {
  /** ISO date string YYYY-MM-DD (Vietnam date) */
  iso: string;
  /** Vietnamese name */
  name: string;
  /** Chinese character */
  hanzi: string;
  /** 0-based index in the year's solar term sequence (0=Tiểu Hàn, 23=Đông Chí) */
  index: number;
  /** Ecliptic longitude in degrees (Sun's position) */
  longitude: number;
}

/** The 24 solar terms in order starting from Tiểu Hàn */
export const SOLAR_TERM_META: Omit<SolarTerm, "iso">[] = [
  { name: "Tiểu Hàn",    hanzi: "小寒", index: 0,  longitude: 285 },
  { name: "Đại Hàn",     hanzi: "大寒", index: 1,  longitude: 300 },
  { name: "Lập Xuân",    hanzi: "立春", index: 2,  longitude: 315 },
  { name: "Vũ Thủy",     hanzi: "雨水", index: 3,  longitude: 330 },
  { name: "Kinh Trập",   hanzi: "驚蟄", index: 4,  longitude: 345 },
  { name: "Xuân Phân",   hanzi: "春分", index: 5,  longitude: 0   },
  { name: "Thanh Minh",  hanzi: "清明", index: 6,  longitude: 15  },
  { name: "Cốc Vũ",      hanzi: "穀雨", index: 7,  longitude: 30  },
  { name: "Lập Hạ",      hanzi: "立夏", index: 8,  longitude: 45  },
  { name: "Tiểu Mãn",    hanzi: "小滿", index: 9,  longitude: 60  },
  { name: "Mang Chủng",  hanzi: "芒種", index: 10, longitude: 75  },
  { name: "Hạ Chí",      hanzi: "夏至", index: 11, longitude: 90  },
  { name: "Tiểu Thử",    hanzi: "小暑", index: 12, longitude: 105 },
  { name: "Đại Thử",     hanzi: "大暑", index: 13, longitude: 120 },
  { name: "Lập Thu",     hanzi: "立秋", index: 14, longitude: 135 },
  { name: "Xử Thử",      hanzi: "處暑", index: 15, longitude: 150 },
  { name: "Bạch Lộ",     hanzi: "白露", index: 16, longitude: 165 },
  { name: "Thu Phân",    hanzi: "秋分", index: 17, longitude: 180 },
  { name: "Hàn Lộ",      hanzi: "寒露", index: 18, longitude: 195 },
  { name: "Sương Giáng", hanzi: "霜降", index: 19, longitude: 210 },
  { name: "Lập Đông",    hanzi: "立冬", index: 20, longitude: 225 },
  { name: "Tiểu Tuyết",  hanzi: "小雪", index: 21, longitude: 240 },
  { name: "Đại Tuyết",   hanzi: "大雪", index: 22, longitude: 255 },
  { name: "Đông Chí",    hanzi: "冬至", index: 23, longitude: 270 },
];

/**
 * Pre-computed solar term dates for 2025-2040 (Vietnam UTC+7).
 * Format: [iso, termIndex] — termIndex maps to SOLAR_TERM_META[index].
 */
const TIET_KHI_DATES: [string, number][] = [
  // 2025
  ["2025-01-05", 0],  // Tiểu Hàn
  ["2025-01-20", 1],  // Đại Hàn
  ["2025-02-03", 2],  // Lập Xuân
  ["2025-02-18", 3],  // Vũ Thủy
  ["2025-03-05", 4],  // Kinh Trập
  ["2025-03-20", 5],  // Xuân Phân
  ["2025-04-04", 6],  // Thanh Minh
  ["2025-04-20", 7],  // Cốc Vũ
  ["2025-05-05", 8],  // Lập Hạ
  ["2025-05-21", 9],  // Tiểu Mãn
  ["2025-06-05", 10], // Mang Chủng
  ["2025-06-21", 11], // Hạ Chí
  ["2025-07-07", 12], // Tiểu Thử
  ["2025-07-22", 13], // Đại Thử
  ["2025-08-07", 14], // Lập Thu
  ["2025-08-23", 15], // Xử Thử
  ["2025-09-07", 16], // Bạch Lộ
  ["2025-09-23", 17], // Thu Phân
  ["2025-10-08", 18], // Hàn Lộ
  ["2025-10-23", 19], // Sương Giáng
  ["2025-11-07", 20], // Lập Đông
  ["2025-11-22", 21], // Tiểu Tuyết
  ["2025-12-07", 22], // Đại Tuyết
  ["2025-12-22", 23], // Đông Chí
  // 2026
  ["2026-01-05", 0],  // Tiểu Hàn
  ["2026-01-20", 1],  // Đại Hàn
  ["2026-02-04", 2],  // Lập Xuân
  ["2026-02-18", 3],  // Vũ Thủy
  ["2026-03-06", 4],  // Kinh Trập
  ["2026-03-20", 5],  // Xuân Phân
  ["2026-04-05", 6],  // Thanh Minh
  ["2026-04-20", 7],  // Cốc Vũ
  ["2026-05-05", 8],  // Lập Hạ
  ["2026-05-21", 9],  // Tiểu Mãn
  ["2026-06-06", 10], // Mang Chủng
  ["2026-06-21", 11], // Hạ Chí
  ["2026-07-07", 12], // Tiểu Thử
  ["2026-07-23", 13], // Đại Thử
  ["2026-08-07", 14], // Lập Thu
  ["2026-08-23", 15], // Xử Thử
  ["2026-09-08", 16], // Bạch Lộ
  ["2026-09-23", 17], // Thu Phân
  ["2026-10-08", 18], // Hàn Lộ
  ["2026-10-23", 19], // Sương Giáng
  ["2026-11-07", 20], // Lập Đông
  ["2026-11-22", 21], // Tiểu Tuyết
  ["2026-12-07", 22], // Đại Tuyết
  ["2026-12-22", 23], // Đông Chí
  // 2027
  ["2027-01-06", 0],  // Tiểu Hàn
  ["2027-01-20", 1],  // Đại Hàn
  ["2027-02-04", 2],  // Lập Xuân
  ["2027-02-19", 3],  // Vũ Thủy
  ["2027-03-06", 4],  // Kinh Trập
  ["2027-03-21", 5],  // Xuân Phân
  ["2027-04-05", 6],  // Thanh Minh
  ["2027-04-20", 7],  // Cốc Vũ
  ["2027-05-06", 8],  // Lập Hạ
  ["2027-05-21", 9],  // Tiểu Mãn
  ["2027-06-06", 10], // Mang Chủng
  ["2027-06-21", 11], // Hạ Chí
  ["2027-07-07", 12], // Tiểu Thử
  ["2027-07-23", 13], // Đại Thử
  ["2027-08-08", 14], // Lập Thu
  ["2027-08-23", 15], // Xử Thử
  ["2027-09-08", 16], // Bạch Lộ
  ["2027-09-23", 17], // Thu Phân
  ["2027-10-08", 18], // Hàn Lộ
  ["2027-10-24", 19], // Sương Giáng
  ["2027-11-07", 20], // Lập Đông
  ["2027-11-22", 21], // Tiểu Tuyết
  ["2027-12-07", 22], // Đại Tuyết
  ["2027-12-22", 23], // Đông Chí
  // 2028
  ["2028-01-06", 0],  // Tiểu Hàn
  ["2028-01-21", 1],  // Đại Hàn
  ["2028-02-04", 2],  // Lập Xuân
  ["2028-02-19", 3],  // Vũ Thủy
  ["2028-03-05", 4],  // Kinh Trập
  ["2028-03-20", 5],  // Xuân Phân
  ["2028-04-04", 6],  // Thanh Minh
  ["2028-04-20", 7],  // Cốc Vũ
  ["2028-05-05", 8],  // Lập Hạ
  ["2028-05-20", 9],  // Tiểu Mãn
  ["2028-06-05", 10], // Mang Chủng
  ["2028-06-21", 11], // Hạ Chí
  ["2028-07-06", 12], // Tiểu Thử
  ["2028-07-22", 13], // Đại Thử
  ["2028-08-07", 14], // Lập Thu
  ["2028-08-22", 15], // Xử Thử
  ["2028-09-07", 16], // Bạch Lộ
  ["2028-09-22", 17], // Thu Phân
  ["2028-10-08", 18], // Hàn Lộ
  ["2028-10-23", 19], // Sương Giáng
  ["2028-11-07", 20], // Lập Đông
  ["2028-11-22", 21], // Tiểu Tuyết
  ["2028-12-06", 22], // Đại Tuyết
  ["2028-12-21", 23], // Đông Chí
  // 2029
  ["2029-01-05", 0],  // Tiểu Hàn
  ["2029-01-20", 1],  // Đại Hàn
  ["2029-02-03", 2],  // Lập Xuân
  ["2029-02-18", 3],  // Vũ Thủy
  ["2029-03-05", 4],  // Kinh Trập
  ["2029-03-20", 5],  // Xuân Phân
  ["2029-04-04", 6],  // Thanh Minh
  ["2029-04-20", 7],  // Cốc Vũ
  ["2029-05-05", 8],  // Lập Hạ
  ["2029-05-21", 9],  // Tiểu Mãn
  ["2029-06-05", 10], // Mang Chủng
  ["2029-06-21", 11], // Hạ Chí
  ["2029-07-07", 12], // Tiểu Thử
  ["2029-07-23", 13], // Đại Thử
  ["2029-08-07", 14], // Lập Thu
  ["2029-08-23", 15], // Xử Thử
  ["2029-09-07", 16], // Bạch Lộ
  ["2029-09-23", 17], // Thu Phân
  ["2029-10-08", 18], // Hàn Lộ
  ["2029-10-23", 19], // Sương Giáng
  ["2029-11-07", 20], // Lập Đông
  ["2029-11-22", 21], // Tiểu Tuyết
  ["2029-12-07", 22], // Đại Tuyết
  ["2029-12-22", 23], // Đông Chí
  // 2030
  ["2030-01-05", 0],  // Tiểu Hàn
  ["2030-01-20", 1],  // Đại Hàn
  ["2030-02-04", 2],  // Lập Xuân
  ["2030-02-19", 3],  // Vũ Thủy
  ["2030-03-06", 4],  // Kinh Trập
  ["2030-03-20", 5],  // Xuân Phân
  ["2030-04-05", 6],  // Thanh Minh
  ["2030-04-20", 7],  // Cốc Vũ
  ["2030-05-05", 8],  // Lập Hạ
  ["2030-05-21", 9],  // Tiểu Mãn
  ["2030-06-06", 10], // Mang Chủng
  ["2030-06-21", 11], // Hạ Chí
  ["2030-07-07", 12], // Tiểu Thử
  ["2030-07-23", 13], // Đại Thử
  ["2030-08-07", 14], // Lập Thu
  ["2030-08-23", 15], // Xử Thử
  ["2030-09-08", 16], // Bạch Lộ
  ["2030-09-23", 17], // Thu Phân
  ["2030-10-08", 18], // Hàn Lộ
  ["2030-10-23", 19], // Sương Giáng
  ["2030-11-07", 20], // Lập Đông
  ["2030-11-22", 21], // Tiểu Tuyết
  ["2030-12-07", 22], // Đại Tuyết
  ["2030-12-22", 23], // Đông Chí
  // 2031
  ["2031-01-06", 0],  // Tiểu Hàn
  ["2031-01-21", 1],  // Đại Hàn
  ["2031-02-04", 2],  // Lập Xuân
  ["2031-02-19", 3],  // Vũ Thủy
  ["2031-03-06", 4],  // Kinh Trập
  ["2031-03-21", 5],  // Xuân Phân
  ["2031-04-05", 6],  // Thanh Minh
  ["2031-04-21", 7],  // Cốc Vũ
  ["2031-05-06", 8],  // Lập Hạ
  ["2031-05-21", 9],  // Tiểu Mãn
  ["2031-06-06", 10], // Mang Chủng
  ["2031-06-22", 11], // Hạ Chí
  ["2031-07-07", 12], // Tiểu Thử
  ["2031-07-23", 13], // Đại Thử
  ["2031-08-08", 14], // Lập Thu
  ["2031-08-23", 15], // Xử Thử
  ["2031-09-08", 16], // Bạch Lộ
  ["2031-09-23", 17], // Thu Phân
  ["2031-10-09", 18], // Hàn Lộ
  ["2031-10-24", 19], // Sương Giáng
  ["2031-11-08", 20], // Lập Đông
  ["2031-11-23", 21], // Tiểu Tuyết
  ["2031-12-07", 22], // Đại Tuyết
  ["2031-12-22", 23], // Đông Chí
  // 2032
  ["2032-01-06", 0],  // Tiểu Hàn
  ["2032-01-21", 1],  // Đại Hàn
  ["2032-02-04", 2],  // Lập Xuân
  ["2032-02-19", 3],  // Vũ Thủy
  ["2032-03-05", 4],  // Kinh Trập
  ["2032-03-20", 5],  // Xuân Phân
  ["2032-04-04", 6],  // Thanh Minh
  ["2032-04-20", 7],  // Cốc Vũ
  ["2032-05-05", 8],  // Lập Hạ
  ["2032-05-20", 9],  // Tiểu Mãn
  ["2032-06-05", 10], // Mang Chủng
  ["2032-06-21", 11], // Hạ Chí
  ["2032-07-06", 12], // Tiểu Thử
  ["2032-07-22", 13], // Đại Thử
  ["2032-08-07", 14], // Lập Thu
  ["2032-08-22", 15], // Xử Thử
  ["2032-09-07", 16], // Bạch Lộ
  ["2032-09-22", 17], // Thu Phân
  ["2032-10-08", 18], // Hàn Lộ
  ["2032-10-23", 19], // Sương Giáng
  ["2032-11-07", 20], // Lập Đông
  ["2032-11-22", 21], // Tiểu Tuyết
  ["2032-12-06", 22], // Đại Tuyết
  ["2032-12-21", 23], // Đông Chí
  // 2033
  ["2033-01-05", 0],  // Tiểu Hàn
  ["2033-01-20", 1],  // Đại Hàn
  ["2033-02-03", 2],  // Lập Xuân
  ["2033-02-18", 3],  // Vũ Thủy
  ["2033-03-05", 4],  // Kinh Trập
  ["2033-03-20", 5],  // Xuân Phân
  ["2033-04-05", 6],  // Thanh Minh
  ["2033-04-20", 7],  // Cốc Vũ
  ["2033-05-05", 8],  // Lập Hạ
  ["2033-05-21", 9],  // Tiểu Mãn
  ["2033-06-06", 10], // Mang Chủng
  ["2033-06-21", 11], // Hạ Chí
  ["2033-07-07", 12], // Tiểu Thử
  ["2033-07-23", 13], // Đại Thử
  ["2033-08-07", 14], // Lập Thu
  ["2033-08-23", 15], // Xử Thử
  ["2033-09-07", 16], // Bạch Lộ
  ["2033-09-23", 17], // Thu Phân
  ["2033-10-08", 18], // Hàn Lộ
  ["2033-10-23", 19], // Sương Giáng
  ["2033-11-07", 20], // Lập Đông
  ["2033-11-22", 21], // Tiểu Tuyết
  ["2033-12-07", 22], // Đại Tuyết
  ["2033-12-22", 23], // Đông Chí
  // 2034
  ["2034-01-05", 0],  // Tiểu Hàn
  ["2034-01-20", 1],  // Đại Hàn
  ["2034-02-04", 2],  // Lập Xuân
  ["2034-02-19", 3],  // Vũ Thủy
  ["2034-03-06", 4],  // Kinh Trập
  ["2034-03-20", 5],  // Xuân Phân
  ["2034-04-05", 6],  // Thanh Minh
  ["2034-04-20", 7],  // Cốc Vũ
  ["2034-05-05", 8],  // Lập Hạ
  ["2034-05-21", 9],  // Tiểu Mãn
  ["2034-06-06", 10], // Mang Chủng
  ["2034-06-21", 11], // Hạ Chí
  ["2034-07-07", 12], // Tiểu Thử
  ["2034-07-23", 13], // Đại Thử
  ["2034-08-07", 14], // Lập Thu
  ["2034-08-23", 15], // Xử Thử
  ["2034-09-08", 16], // Bạch Lộ
  ["2034-09-23", 17], // Thu Phân
  ["2034-10-08", 18], // Hàn Lộ
  ["2034-10-23", 19], // Sương Giáng
  ["2034-11-07", 20], // Lập Đông
  ["2034-11-22", 21], // Tiểu Tuyết
  ["2034-12-07", 22], // Đại Tuyết
  ["2034-12-22", 23], // Đông Chí
  // 2035
  ["2035-01-05", 0],  // Tiểu Hàn
  ["2035-01-20", 1],  // Đại Hàn
  ["2035-02-04", 2],  // Lập Xuân
  ["2035-02-19", 3],  // Vũ Thủy
  ["2035-03-06", 4],  // Kinh Trập
  ["2035-03-21", 5],  // Xuân Phân
  ["2035-04-05", 6],  // Thanh Minh
  ["2035-04-21", 7],  // Cốc Vũ
  ["2035-05-06", 8],  // Lập Hạ
  ["2035-05-21", 9],  // Tiểu Mãn
  ["2035-06-06", 10], // Mang Chủng
  ["2035-06-22", 11], // Hạ Chí
  ["2035-07-08", 12], // Tiểu Thử
  ["2035-07-23", 13], // Đại Thử
  ["2035-08-08", 14], // Lập Thu
  ["2035-08-23", 15], // Xử Thử
  ["2035-09-08", 16], // Bạch Lộ
  ["2035-09-23", 17], // Thu Phân
  ["2035-10-09", 18], // Hàn Lộ
  ["2035-10-24", 19], // Sương Giáng
  ["2035-11-08", 20], // Lập Đông
  ["2035-11-23", 21], // Tiểu Tuyết
  ["2035-12-08", 22], // Đại Tuyết
  ["2035-12-22", 23], // Đông Chí
  // 2036
  ["2036-01-06", 0],  // Tiểu Hàn
  ["2036-01-21", 1],  // Đại Hàn
  ["2036-02-05", 2],  // Lập Xuân
  ["2036-02-19", 3],  // Vũ Thủy
  ["2036-03-05", 4],  // Kinh Trập
  ["2036-03-20", 5],  // Xuân Phân
  ["2036-04-04", 6],  // Thanh Minh
  ["2036-04-20", 7],  // Cốc Vũ
  ["2036-05-05", 8],  // Lập Hạ
  ["2036-05-20", 9],  // Tiểu Mãn
  ["2036-06-05", 10], // Mang Chủng
  ["2036-06-21", 11], // Hạ Chí
  ["2036-07-07", 12], // Tiểu Thử
  ["2036-07-22", 13], // Đại Thử
  ["2036-08-07", 14], // Lập Thu
  ["2036-08-22", 15], // Xử Thử
  ["2036-09-07", 16], // Bạch Lộ
  ["2036-09-22", 17], // Thu Phân
  ["2036-10-08", 18], // Hàn Lộ
  ["2036-10-23", 19], // Sương Giáng
  ["2036-11-07", 20], // Lập Đông
  ["2036-11-22", 21], // Tiểu Tuyết
  ["2036-12-07", 22], // Đại Tuyết
  ["2036-12-21", 23], // Đông Chí
  // 2037
  ["2037-01-05", 0],  // Tiểu Hàn
  ["2037-01-20", 1],  // Đại Hàn
  ["2037-02-04", 2],  // Lập Xuân
  ["2037-02-18", 3],  // Vũ Thủy
  ["2037-03-05", 4],  // Kinh Trập
  ["2037-03-20", 5],  // Xuân Phân
  ["2037-04-04", 6],  // Thanh Minh
  ["2037-04-20", 7],  // Cốc Vũ
  ["2037-05-05", 8],  // Lập Hạ
  ["2037-05-21", 9],  // Tiểu Mãn
  ["2037-06-05", 10], // Mang Chủng
  ["2037-06-21", 11], // Hạ Chí
  ["2037-07-07", 12], // Tiểu Thử
  ["2037-07-23", 13], // Đại Thử
  ["2037-08-07", 14], // Lập Thu
  ["2037-08-23", 15], // Xử Thử
  ["2037-09-07", 16], // Bạch Lộ
  ["2037-09-23", 17], // Thu Phân
  ["2037-10-08", 18], // Hàn Lộ
  ["2037-10-23", 19], // Sương Giáng
  ["2037-11-07", 20], // Lập Đông
  ["2037-11-22", 21], // Tiểu Tuyết
  ["2037-12-07", 22], // Đại Tuyết
  ["2037-12-22", 23], // Đông Chí
  // 2038
  ["2038-01-05", 0],  // Tiểu Hàn
  ["2038-01-20", 1],  // Đại Hàn
  ["2038-02-04", 2],  // Lập Xuân
  ["2038-02-19", 3],  // Vũ Thủy
  ["2038-03-06", 4],  // Kinh Trập
  ["2038-03-20", 5],  // Xuân Phân
  ["2038-04-05", 6],  // Thanh Minh
  ["2038-04-20", 7],  // Cốc Vũ
  ["2038-05-05", 8],  // Lập Hạ
  ["2038-05-21", 9],  // Tiểu Mãn
  ["2038-06-06", 10], // Mang Chủng
  ["2038-06-21", 11], // Hạ Chí
  ["2038-07-07", 12], // Tiểu Thử
  ["2038-07-23", 13], // Đại Thử
  ["2038-08-07", 14], // Lập Thu
  ["2038-08-23", 15], // Xử Thử
  ["2038-09-08", 16], // Bạch Lộ
  ["2038-09-23", 17], // Thu Phân
  ["2038-10-08", 18], // Hàn Lộ
  ["2038-10-24", 19], // Sương Giáng
  ["2038-11-07", 20], // Lập Đông
  ["2038-11-22", 21], // Tiểu Tuyết
  ["2038-12-07", 22], // Đại Tuyết
  ["2038-12-22", 23], // Đông Chí
  // 2039
  ["2039-01-06", 0],  // Tiểu Hàn
  ["2039-01-21", 1],  // Đại Hàn
  ["2039-02-04", 2],  // Lập Xuân
  ["2039-02-19", 3],  // Vũ Thủy
  ["2039-03-06", 4],  // Kinh Trập
  ["2039-03-21", 5],  // Xuân Phân
  ["2039-04-05", 6],  // Thanh Minh
  ["2039-04-21", 7],  // Cốc Vũ
  ["2039-05-06", 8],  // Lập Hạ
  ["2039-05-21", 9],  // Tiểu Mãn
  ["2039-06-06", 10], // Mang Chủng
  ["2039-06-22", 11], // Hạ Chí
  ["2039-07-08", 12], // Tiểu Thử
  ["2039-07-23", 13], // Đại Thử
  ["2039-08-08", 14], // Lập Thu
  ["2039-08-24", 15], // Xử Thử
  ["2039-09-08", 16], // Bạch Lộ
  ["2039-09-24", 17], // Thu Phân
  ["2039-10-09", 18], // Hàn Lộ
  ["2039-10-24", 19], // Sương Giáng
  ["2039-11-08", 20], // Lập Đông
  ["2039-11-23", 21], // Tiểu Tuyết
  ["2039-12-08", 22], // Đại Tuyết
  ["2039-12-22", 23], // Đông Chí
  // 2040
  ["2040-01-06", 0],  // Tiểu Hàn
  ["2040-01-21", 1],  // Đại Hàn
  ["2040-02-04", 2],  // Lập Xuân
  ["2040-02-19", 3],  // Vũ Thủy
  ["2040-03-05", 4],  // Kinh Trập
  ["2040-03-20", 5],  // Xuân Phân
  ["2040-04-04", 6],  // Thanh Minh
  ["2040-04-20", 7],  // Cốc Vũ
  ["2040-05-05", 8],  // Lập Hạ
  ["2040-05-20", 9],  // Tiểu Mãn
  ["2040-06-05", 10], // Mang Chủng
  ["2040-06-21", 11], // Hạ Chí
  ["2040-07-07", 12], // Tiểu Thử
  ["2040-07-22", 13], // Đại Thử
  ["2040-08-07", 14], // Lập Thu
  ["2040-08-23", 15], // Xử Thử
  ["2040-09-07", 16], // Bạch Lộ
  ["2040-09-22", 17], // Thu Phân
  ["2040-10-08", 18], // Hàn Lộ
  ["2040-10-23", 19], // Sương Giáng
  ["2040-11-07", 20], // Lập Đông
  ["2040-11-22", 21], // Tiểu Tuyết
  ["2040-12-06", 22], // Đại Tuyết
  ["2040-12-21", 23], // Đông Chí
];

/** Build a fast O(1) lookup map from ISO date → SolarTerm */
const _lookupMap = new Map<string, SolarTerm>(
  TIET_KHI_DATES.map(([iso, idx]) => [
    iso,
    { iso, ...SOLAR_TERM_META[idx]! },
  ]),
);

/**
 * Look up whether an ISO date (YYYY-MM-DD) is a solar term day.
 * Returns `null` if the date is not a solar term.
 */
export function getSolarTermForDate(iso: string): SolarTerm | null {
  return _lookupMap.get(iso) ?? null;
}

/**
 * Returns true if a date is the start of a new solar period (Lập Xuân / Lập Hạ / Lập Thu / Lập Đông).
 * These are the 4 season-start terms of particular astrological significance.
 */
export function isSeasonStart(iso: string): boolean {
  const term = getSolarTermForDate(iso);
  return term != null && [2, 8, 14, 20].includes(term.index);
}

/**
 * Returns the solar term that is currently active on a given ISO date.
 * The "active" term is the most recent one that started on or before the date.
 * Returns null if the date is before 2025-01-05.
 */
export function getActiveSolarTerm(iso: string): SolarTerm | null {
  const sorted = TIET_KHI_DATES;
  // Binary search for largest iso ≤ given date
  let lo = 0;
  let hi = sorted.length - 1;
  let result: [string, number] | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const entry = sorted[mid]!;
    if (entry[0] <= iso) {
      result = entry;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (!result) return null;
  return { iso: result[0], ...SOLAR_TERM_META[result[1]]! };
}

/** All 384 entries as fully materialised SolarTerm objects. */
export const ALL_TIET_KHI: SolarTerm[] = TIET_KHI_DATES.map(([iso, idx]) => ({
  iso,
  ...SOLAR_TERM_META[idx]!,
}));
