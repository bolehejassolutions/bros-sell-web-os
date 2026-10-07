import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function hasWebOSAccess(client?: ServerClient) {
  const supabase = client ?? await createClient();
  const { data: canonical, error: canonicalError } = await supabase.rpc("has_active_bros_sell_entitlement", {
    p_product_code: "BROS_SELL_CORE",
    p_access_level: "core",
  });
  if (!canonicalError && Boolean(canonical)) return true;

  const { data: legacy, error: legacyError } = await supabase.rpc("has_active_bros_sell_entitlement", {
    p_product_code: "BROS_SELL_WEB_OS",
    p_access_level: "core",
  });
  if (legacyError) return false;
  return Boolean(legacy);
}

export async function claimPaidBrosSellOrders(client?: ServerClient) {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase.rpc("claim_bros_sell_paid_orders");
  // Keep access recovery backward-compatible if the automation migration has not
  // reached a deployment yet. The manual recovery page remains the fallback.
  if (error) return 0;
  const claimed = Number(data ?? 0);
  return Number.isFinite(claimed) ? claimed : 0;
}
