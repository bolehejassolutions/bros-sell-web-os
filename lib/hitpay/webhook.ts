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

function customerEmail(source: HitPayPayload) {
  return clean(objectValue(source.customer)?.email)?.toLowerCase() ?? null;
}

function collectLineItemProductIds(source: HitPayPayload) {
  const ids = new Set<string>();
  const scanLineItems = (value: unknown) => {
    const items = Array.isArray(value) ? value : [];
    for (const raw of items) {
      const item = objectValue(raw);
      if (!item) continue;
      const itemType = clean(item.item_type)?.toLowerCase();
      const relatedId = clean(item.related_id);
      if (itemType === "product" && relatedId) ids.add(relatedId);
    }
  };

  scanLineItems(source.line_items);
  const order = objectValue(source.order);
  if (order) scanLineItems(order.line_items);

  return [...ids];
}

export function normalizeHitPayStoreEvent(payload: HitPayPayload): NormalizedHitPayEvent {
  const data = objectValue(payload.data);
  const source = data ?? payload;
  const order = objectValue(source.order) ?? objectValue(payload.order);

  return {
    status: (clean(source.status) ?? clean(payload.status) ?? "").toLowerCase(),
    providerPaymentId:
      clean(source.id) ??
      clean(payload.id),
    providerReference:
      clean(source.order_id) ??
      clean(order?.id) ??
      clean(source.reference_number) ??
      clean(payload.reference_number),
    businessId:
      clean(source.business_id) ??
      clean(order?.business_id) ??
      clean(payload.business_id),
    amount: numberValue(source.amount ?? order?.amount ?? payload.amount),
    currency: clean(source.currency ?? order?.currency ?? payload.currency)?.toUpperCase() ?? null,
    purchaseEmail:
      customerEmail(source) ??
      (order ? customerEmail(order) : null) ??
      customerEmail(payload),
    productIds: collectLineItemProductIds(source),
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
