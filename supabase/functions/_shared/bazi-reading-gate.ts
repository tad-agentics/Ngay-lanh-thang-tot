import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isServiceRoleBearer } from "./internal-service-auth.ts";
import { canUseBaziReading } from "./entitlements.ts";

type ServiceClient = SupabaseClient;

/** JWT user + entitlement luận Bát tự năm (gói năm hoặc `bazi_reading_unlocked_at`). */
export async function userHasBaziReadingAccess(
  admin: ServiceClient,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_expires_at, bazi_reading_unlocked_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return false;
  return canUseBaziReading(profile);
}

export type BaziReadingAuth = {
  uid: string;
  admin: ServiceClient;
};

/** Returns null when denied (caller returns empty 200). */
export async function requireBaziReadingAuth(
  req: Request,
  options?: {
    allowWithoutEntitlement?: boolean;
    /** Internal prewarm — `Authorization: Bearer` service role + body field. */
    prewarmUserId?: string;
  },
): Promise<BaziReadingAuth | null> {
  const gateUrl = Deno.env.get("SUPABASE_URL");
  const gateAnon = Deno.env.get("SUPABASE_ANON_KEY");
  const gateService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!gateUrl || !gateAnon || !gateService) return null;

  const admin = createClient(gateUrl, gateService);

  if (options?.prewarmUserId && isServiceRoleBearer(req)) {
    const uid = options.prewarmUserId;
    if (!options.allowWithoutEntitlement) {
      const allowed = await userHasBaziReadingAccess(admin, uid);
      if (!allowed) return null;
    }
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

  if (!options?.allowWithoutEntitlement) {
    const allowed = await userHasBaziReadingAccess(admin, uid);
    if (!allowed) return null;
  }
  return { uid, admin };
}
