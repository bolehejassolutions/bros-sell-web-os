import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { claimPaidBrosSellOrders, hasWebOSAccess } from "@/lib/supabase/entitlement";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (await hasWebOSAccess(supabase)) redirect("/app");

  await claimPaidBrosSellOrders(supabase);
  if (await hasWebOSAccess(supabase)) redirect("/app");

  redirect("/activate");
}
