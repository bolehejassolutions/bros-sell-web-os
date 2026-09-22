import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  redirect("/");
}
