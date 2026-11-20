import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type HitPayPayload = Record<string, unknown>;

export type NormalizedHitPayEvent = {
  status: string;
  providerPaymentId: string | null;
  providerReference: string | null;
  businessId: string | null;
  amount: number | null;
  currency: string | null;
  purchaseEmail: string | null;
  productIds: string[];
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function amountValue(value: unknown) {
  const amount = typeof value === "number" ? value
    : typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : NaN;
  return Number.isFinite(amount) ? amount : null;
}

function objectValue(value: unknown): HitPayPayload | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as HitPayPayload
    : null;
}

// A charge and its own order may repeat a field. A supplied malformed or
// contradictory value cannot be replaced with the more convenient copy.
function consistent<T>(charge: unknown, order: unknown, parse: (value: unknown) => T | null) {
  if (charge == null) return parse(order);
  if (order == null) return parse(charge);
  const value = parse(charge);
  return value === parse(order) ? value : null;
}

function emailValue(value: unknown) {
  const email = clean(value)?.toLowerCase();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function orderProductIds(items: unknown) {
  if (!Array.isArray(items)) return [];
  const ids = new Set<string>();
  for (const raw of items) {
    const line = objectValue(raw);
    const type = clean(line?.item_type);
    if (!type) return [];
    if (type.toLowerCase() !== "product") continue;
    const id = clean(line?.related_id);
    if (!id) return [];
    ids.add(id);
  }
  return [...ids];
}

export function normalizeHitPayStoreEvent(payload: HitPayPayload): NormalizedHitPayEvent {
  const charge = objectValue(payload.data) ?? payload;
  const order = objectValue(charge.order);
  return {
    status: clean(charge.status)?.toLowerCase() ?? "",
    providerPaymentId: clean(charge.id),
    providerReference: consistent(charge.order_id, order?.id, clean),
    businessId: consistent(charge.business_id, order?.business_id, clean),
    amount: consistent(charge.amount, order?.amount, amountValue),
    currency: consistent(charge.currency, order?.currency, value => clean(value)?.toUpperCase() ?? null),
    purchaseEmail: consistent(objectValue(charge.customer)?.email, objectValue(order?.customer)?.email, emailValue),
    productIds: orderProductIds(order?.line_items),
  };
}

function validHex(value: string) {
  return /^[a-f0-9]{64}$/i.test(value);
}

function equalHex(left: string, right: string) {
  if (!validHex(left) || !validHex(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function verifyRawBodySignature(rawBody: string, signature: string | null, endpointSalt: string) {
  if (!signature || !endpointSalt) return false;
  const expected = createHmac("sha256", endpointSalt).update(rawBody).digest("hex");
  return equalHex(signature.trim(), expected);
}

export function webhookFingerprint(rawBody: string, eventObject: string, eventType: string) {
  return createHash("sha256")
    .update(`${eventObject}\n${eventType}\n${rawBody}`)
    .digest("hex");
}

export function hashEvidenceValue(value: string | null) {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

export function payloadShape(value: unknown, prefix = "$", depth = 0): string[] {
  if (depth > 8) return [`${prefix}:depth-limit`];
  if (Array.isArray(value)) {
    const shape = [`${prefix}:array`];
    const sample = value[0];
    if (sample !== undefined) shape.push(...payloadShape(sample, `${prefix}[]`, depth + 1));
    return shape;
  }
  if (value && typeof value === "object") {
    const shape = [`${prefix}:object`];
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      shape.push(...payloadShape((value as Record<string, unknown>)[key], `${prefix}.${key}`, depth + 1));
    }
    return shape;
  }
  return [`${prefix}:${value === null ? "null" : typeof value}`];
}
