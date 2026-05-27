/** One-shot redirect reason when auth session ends outside manual sign-out. */

let pendingReason: "expired" | null = null;
let manualSignOut = false;

export function markManualSignOut(): void {
  manualSignOut = true;
}

export function markSessionExpired(): void {
  if (!manualSignOut) {
    pendingReason = "expired";
  }
}

export function consumeAuthRedirectReason(): "expired" | null {
  const reason = pendingReason;
  pendingReason = null;
  return reason;
}

export function resetManualSignOutFlag(): void {
  manualSignOut = false;
}
