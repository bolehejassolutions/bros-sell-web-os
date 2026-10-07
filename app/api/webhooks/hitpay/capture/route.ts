import { NextResponse } from "next/server";
import {
  hashEvidenceValue,
  normalizeHitPayStoreEvent,
  payloadShape,
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
  const endpointSalt = process.env.HITPAY_CAPTURE_WEBHOOK_SALT;
  const expectedBusinessId = process.env.HITPAY_BUSINESS_ID;

  if (!endpointSalt || !expectedBusinessId) {
    console.error("HitPay capture endpoint configuration is incomplete.");
    return NextResponse.json({ error: "Capture unavailable." }, { status: 503 });
  }

  const eventObject = (request.headers.get("hitpay-event-object") ?? "").toLowerCase();
  const eventType = (request.headers.get("hitpay-event-type") ?? "").toLowerCase();

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

  const fingerprint = webhookFingerprint(raw, eventObject, eventType);

  // Intentionally no Supabase/service-role client here. This endpoint can never
  // write payment orders or entitlements. Evidence is limited to private
  // deployment logs and excludes the raw body and buyer email.
  console.info("BROS_SELL_HITPAY_CAPTURE", JSON.stringify({
    fingerprint,
    eventObject,
    eventType,
    providerPaymentId: event.providerPaymentId,
    providerReference: event.providerReference,
    businessId: event.businessId,
    status: event.status,
    amount: event.amount,
    currency: event.currency,
    purchaseEmailSha256: hashEvidenceValue(event.purchaseEmail),
    productIds: event.productIds,
    payloadShape: payloadShape(payload),
  }));

  return NextResponse.json({
    received: true,
    captureOnly: true,
    fingerprint,
    mapped: {
      paymentIdentity: Boolean(event.providerPaymentId),
      orderIdentity: Boolean(event.providerReference),
      buyerIdentity: Boolean(event.purchaseEmail),
      productIdentity: event.productIds.length > 0,
      merchantIdentity: Boolean(event.businessId),
      amount: event.amount !== null,
      currency: Boolean(event.currency),
    },
  });
}
