import { Navigate } from "react-router";

/** Alias for payment providers / app stores (see devops checklist). */
export default function PrivacyRedirect() {
  return <Navigate to="/chinh-sach-bao-mat" replace />;
}
