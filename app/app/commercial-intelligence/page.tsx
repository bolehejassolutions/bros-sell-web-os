import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CommercialIntelligence from "./commercial-intelligence";

const BOOTSTRAP_INTERNAL_EMAIL = "bolehejassolutions@gmail.com";

function isInternalEmail(email: string | null) {
  if (!email) return false;
  const allowed = (process.env.BROS_INTERNAL_EMAILS ?? "")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.toLowerCase()) ||
    email.toLowerCase() === BOOTSTRAP_INTERNAL_EMAIL;
}

export default async function CommercialIntelligencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const emailPresent = Boolean(user?.email);
  const emailMatches = isInternalEmail(user?.email ?? null);
  console.info("[commercial-intelligence] access check", {
    userPresent: Boolean(user),
    emailPresent,
    emailMatches,
    envConfigured: Boolean(process.env.BROS_INTERNAL_EMAILS),
  });

  if (!user) redirect("/login");
  if (!emailMatches) redirect("/app");
  return <CommercialIntelligence />;
}