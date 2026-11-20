import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./server";
import { claimPaidBrosSellOrders, hasWebOSAccess } from "./entitlement";

// Next renders layouts and pages concurrently. Both must await the same
// confirmed account's pending purchase claim before deciding access.
export const requireWorkspaceUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await claimPaidBrosSellOrders(supabase);
  if (!(await hasWebOSAccess(supabase))) redirect("/activate");
  return { user, supabase };
});
