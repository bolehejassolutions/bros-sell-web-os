import { createClient } from "@/lib/supabase/server";

export async function hasCoreAccess() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_active_bros_sell_entitlement", {
    p_product_code: "BROS_SELL_WEB_OS",
    p_access_level: "core",
  });
  if (error) return false;
  return Boolean(data);
}
