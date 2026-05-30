import { Navigate } from "react-router";

/** Dropped in Direction C — overlay lives on `/tra-cuu` (G10). */
export default function TraCuuDangTimRedirect() {
  return <Navigate to="/tra-cuu" replace />;
}
