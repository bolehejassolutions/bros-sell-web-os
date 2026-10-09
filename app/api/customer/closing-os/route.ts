import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";

const BUCKET = "bros-sell-customer-files";
const PATH = "closing-os/BROS_SELL_02_Closing_OS_v2.5.pdf";
const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: PRIVATE_NO_STORE }
    );
  }

  if (!(await hasWebOSAccess())) {
    return NextResponse.json(
      { error: "Active BROS SELL access required." },
      { status: 403, headers: PRIVATE_NO_STORE }
    );
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(PATH, 10 * 60);

  if (error || !data?.signedUrl) {
    console.error("Closing OS signed URL error:", error);
    return NextResponse.json(
      { error: "Closing OS is temporarily unavailable." },
      { status: 503, headers: PRIVATE_NO_STORE }
    );
  }

  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
