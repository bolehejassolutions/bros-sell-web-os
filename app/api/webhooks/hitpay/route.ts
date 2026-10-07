import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeHitPayPayload,
  verifyLegacyPayloadHmac,
  verifyRawBodySignature,
  webhookFingerprint,
  type HitPayPayload,
} from "@/lib/hitpay/webhook";

export const runtime = "nodejs";

function parsePayload(raw: string, contentType: string): HitPayPayload {
  if (contentType.includes("application/json")) {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Webhook payload must be an object.");
    }
    return value as HitPayPayload;
  }

  const payload: HitPayPayload = {};
  const params = new URLSearchParams(raw);
  params.forEach((value, key) => { payload[key] = value; });
  return payload;
}

export async function POST(request: Request) {
  const salt = process.env.HITPAY_WEBHOOK_SALT ?? process.env.HITPAY_SALT;
  if (!salt) {
    console.error("HitPay webhook salt is not configured.");
    return NextResponse.json({ error: "Webhook unavailable." }, { status: 503 });
  }

  let raw = "";
  let payload: HitPayPayload;
  try {
    raw = await request.text();
    payload = parsePayload(raw, (request.headers.get("content-type") ?? "").toLowerCase());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const headerSignature = request.headers.get("hitpay-signature");
  const valid = headerSignature
    ? verifyRawBodySignature(raw, headerSignature, salt)
    : verifyLegacyPayloadHmac(payload, salt);

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const eventObject = request.headers.get("hitpay-event-object");
  const eventType = request.headers.get("hitpay-event-type");
  const event = normalizeHitPayPayload(payload);

  if (!event.providerPaymentId && !event.providerReference) {
    return NextResponse.json({ error: "Payment identity missing." }, { status: 400 });
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
