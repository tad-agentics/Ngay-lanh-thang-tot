import { Navigate, useSearchParams } from "react-router";

/** Lịch tháng gộp vào `/lich` — giữ route + query `year`/`month` cho bookmark. */
export default function LichThangRedirect() {
  const [searchParams] = useSearchParams();
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (year || month) {
    const qs = new URLSearchParams();
    if (year) qs.set("year", year);
    if (month) qs.set("month", month);
    return <Navigate to={`/lich?${qs.toString()}`} replace />;
  }

  return <Navigate to="/lich" replace />;
}
