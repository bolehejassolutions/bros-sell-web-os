import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasCoreAccess } from "@/lib/supabase/entitlement";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await hasCoreAccess())) redirect("/activate");
  redirect("/app");
}
