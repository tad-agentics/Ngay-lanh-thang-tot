export function subscriptionActive(expires: string | null): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date();
}
