import { useEffect } from "react";
import { useNavigate } from "react-router";

/** Legacy route — birth hour is collected on `/dang-ky` (single onboarding step). */
export default function GioSinhRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dang-ky", { replace: true });
  }, [navigate]);

  return null;
}
