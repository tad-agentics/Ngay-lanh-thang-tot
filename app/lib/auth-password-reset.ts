/** Supabase password-reset redirect — must match Auth URL allow list. */

export function passwordResetRedirectUrl(): string {
  if (typeof window === "undefined") {
    return "/dat-lai-mat-khau/recovery";
  }
  return `${window.location.origin}/dat-lai-mat-khau/recovery`;
}
