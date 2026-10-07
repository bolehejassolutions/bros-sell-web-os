import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type HitPayPayload = Record<string, unknown>;

export type NormalizedHitPayEvent = {
  status: string;
  providerPaymentId: string | null;
  providerReference: string | null;
  amount: number | null;
  currency: string | null;
  purchaseEmail: string | null;
  productIds: string[];
};

function clean(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function numberValue(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function objectValue(value: unknown): HitPayPayload | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as HitPayPayload
    : null;
}

function collectProductIds(payload: HitPayPayload) {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    const item = clean(value);
    if (item) ids.add(item);
  };

  add(payload.product_id);
  add(objectValue(payload.product)?.id);

  const order = objectValue(payload.order);
  if (order) {
    add(order.product_id);
    const items = Array.isArray(order.items) ? order.items : [];
    for (const raw of items) {
      const item = objectValue(raw);
      if (!item) continue;
      add(item.product_id);
      add(objectValue(item.product)?.id);
    }
  }

  const products = Array.isArray(payload.products) ? payload.products : [];
  for (const raw of products) add(objectValue(raw)?.id);

  return [...ids];
}

export function normalizeHitPayPayload(payload: HitPayPayload): NormalizedHitPayEvent {
  const data = objectValue(payload.data);
  const source = data ?? payload;
  return {
    status: (clean(source.status) ?? clean(payload.status) ?? "").toLowerCase(),
    providerPaymentId:
      clean(source.id) ??
      clean(source.payment_request_id) ??
      clean(source.paymentRequestId) ??
      clean(payload.id) ??
      clean(payload.payment_request_id) ??
      clean(payload.paymentRequestId),
    providerReference:
      clean(source.reference_number) ??
      clean(source.referenceNumber) ??
      clean(source.reference) ??
      clean(payload.reference_number) ??
      clean(payload.referenceNumber) ??
      clean(payload.reference),
    amount: numberValue(source.amount ?? payload.amount),
    currency: clean(source.currency ?? payload.currency)?.toUpperCase() ?? null,
    purchaseEmail: clean(source.email ?? payload.email)?.toLowerCase() ?? null,
    productIds: collectProductIds(payload),
  };
}

function validHex(value: string) {
  return /^[a-f0-9]{64}$/i.test(value);
}

function equalHex(left: string, right: string) {
  if (!validHex(left) || !validHex(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function verifyRawBodySignature(rawBody: string, signature: string | null, salt: string) {
  if (!signature || !salt) return false;
  const expected = createHmac("sha256", salt).update(rawBody).digest("hex");
  return equalHex(signature.trim(), expected);
}

export function legacyCanonicalize(payload: HitPayPayload) {
  return Object.keys(payload)
    .filter(key => key !== "hmac")
    .sort()
    .map(key => {
      const value = payload[key];
      if (value === null || value === undefined) return key;
      if (typeof value === "object") return key + JSON.stringify(value);
      return key + String(value);
    })
    .join("");
}

export function verifyLegacyPayloadHmac(payload: HitPayPayload, salt: string) {
  const provided = clean(payload.hmac);
  if (!provided || !salt) return false;
  const expected = createHmac("sha256", salt)
    .update(legacyCanonicalize(payload))
    .digest("hex");
  return equalHex(provided, expected);
}

export function webhookFingerprint(rawBody: string, eventObject: string | null, eventType: string | null) {
  return createHash("sha256")
    .update(`${eventObject ?? ""}\n${eventType ?? ""}\n${rawBody}`)
    .digest("hex");
}
