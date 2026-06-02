import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isServiceRoleBearer } from "./internal-service-auth.ts";
import { canUseTieuVanReading } from "./entitlements.ts";

type ServiceClient = SupabaseClient;

export async function userHasTieuVanReadingAccess(
  admin: ServiceClient,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_expires_at, tieu_van_reading_expires_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return false;
  return canUseTieuVanReading(profile);
}

export type TieuVanReadingAuth = {
  uid: string;
  admin: ServiceClient;
};

export async function requireTieuVanReadingAuth(
  req: Request,
  options?: { prewarmUserId?: string },
): Promise<TieuVanReadingAuth | null> {
  const gateUrl = Deno.env.get("SUPABASE_URL");
  const gateAnon = Deno.env.get("SUPABASE_ANON_KEY");
  const gateService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!gateUrl || !gateAnon || !gateService) return null;

  const admin = createClient(gateUrl, gateService);

  if (options?.prewarmUserId && isServiceRoleBearer(req)) {
    const uid = options.prewarmUserId;
    const allowed = await userHasTieuVanReadingAccess(admin, uid);
    if (!allowed) return null;
    return { uid, admin };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const userClient = createClient(gateUrl, gateAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const uid = userData?.user?.id;
  if (userErr || !uid) return null;

  const allowed = await userHasTieuVanReadingAccess(admin, uid);
  if (!allowed) return null;
  return { uid, admin };
}
