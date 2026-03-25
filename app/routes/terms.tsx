import { Navigate } from "react-router";

/** Alias for payment providers / app stores (see devops checklist). */
export default function TermsRedirect() {
  return <Navigate to="/dieu-khoan" replace />;
}
