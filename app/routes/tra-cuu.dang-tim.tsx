import { Navigate } from "react-router";

/** Legacy route — CPickLoading is overlay on `/tra-cuu` (G10). */
export default function TraCuuDangTimRoute() {
  return <Navigate to="/tra-cuu" replace />;
}
