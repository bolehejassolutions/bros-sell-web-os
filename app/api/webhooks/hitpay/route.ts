import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeHitPayStoreEvent,
  verifyRawBodySignature,
  webhookFingerprint,
  type HitPayPayload,
} from "@/lib/hitpay/webhook";

export const runtime = "nodejs";

function parseJsonObject(raw: string): HitPayPayload {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Webhook payload must be an object.");
  }
  return value as HitPayPayload;
}

export async function POST(request: Request) {
  const endpointSalt = process.env.HITPAY_WEBHOOK_SALT;
  const expectedBusinessId = process.env.HITPAY_BUSINESS_ID;

  if (!endpointSalt || !expectedBusinessId) {
    console.error("HitPay webhook server configuration is incomplete.");
    return NextResponse.json({ error: "Webhook unavailable." }, { status: 503 });
  }

  const eventObject = (request.headers.get("hitpay-event-object") ?? "").toLowerCase();
  const eventType = (request.headers.get("hitpay-event-type") ?? "").toLowerCase();

  // Initial release intentionally subscribes to one payment-proof event only.
  // HitPay documents charge.created as firing after a successful payment.
  if (eventObject !== "charge" || eventType !== "created") {
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "JSON webhook required." }, { status: 415 });
  }

  let raw = "";
  let payload: HitPayPayload;
  try {
    raw = await request.text();
    payload = parseJsonObject(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!verifyRawBodySignature(raw, request.headers.get("hitpay-signature"), endpointSalt)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = normalizeHitPayStoreEvent(payload);

  if (event.businessId !== expectedBusinessId) {
    return NextResponse.json({ error: "Merchant mismatch." }, { status: 403 });
  }

  if (!event.providerPaymentId || !event.providerReference) {
    return NextResponse.json({ error: "Payment identity missing." }, { status: 400 });
  }

  if (!event.purchaseEmail || event.productIds.length === 0) {
    return NextResponse.json({ error: "Order mapping evidence missing." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("process_bros_sell_hitpay_event", {
    p_event_key: webhookFingerprint(raw, eventObject, eventType),
    p_provider_payment_id: event.providerPaymentId,
    p_provider_reference: event.providerReference,
    p_status: event.status,
    p_amount: event.amount,
    p_currency: event.currency,
    p_purchase_email: event.purchaseEmail,
    p_product_ids: event.productIds,
    p_payload: payload,
  });

  if (error) {
    console.error("HitPay webhook processing failed:", error.message);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true, result: data });
}
