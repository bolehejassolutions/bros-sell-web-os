import { createClient } from "@/lib/supabase/server";

export async function hasWebOSAccess() {
  const supabase = await createClient();
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
