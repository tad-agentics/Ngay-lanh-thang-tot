import { Navigate } from "react-router";

/** Phong thủy not shipped in Direction C v1 — keep redirect for bookmarks. */
export default function TienIchPhongThuyRedirect() {
  return <Navigate to="/lich" replace />;
}
