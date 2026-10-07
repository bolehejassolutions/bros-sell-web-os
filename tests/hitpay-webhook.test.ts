import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  legacyCanonicalize,
  normalizeHitPayPayload,
  verifyLegacyPayloadHmac,
  verifyRawBodySignature,
  webhookFingerprint,
} from "../lib/hitpay/webhook.ts";

test("v2-style raw-body signature verifies and rejects mutation", () => {
  const salt = "test-salt";
  const raw = JSON.stringify({ id: "pay_1", status: "completed", amount: "197.00", currency: "myr" });
  const signature = createHmac("sha256", salt).update(raw).digest("hex");
  assert.equal(verifyRawBodySignature(raw, signature, salt), true);
  assert.equal(verifyRawBodySignature(raw + " ", signature, salt), false);
});

test("legacy payload hmac remains compatible with the earlier HitPay integration", () => {
  const salt = "legacy-salt";
  const payload: Record<string, unknown> = {
    amount: "5.00",
    currency: "MYR",
    reference_number: "BROS-TEST",
    status: "completed",
  };
  payload.hmac = createHmac("sha256", salt).update(legacyCanonicalize(payload)).digest("hex");
  assert.equal(verifyLegacyPayloadHmac(payload, salt), true);
  payload.status = "failed";
  assert.equal(verifyLegacyPayloadHmac(payload, salt), false);
});

test("normalizer extracts payment identity, buyer email and explicit product identifiers", () => {
  const event = normalizeHitPayPayload({
    id: "request_123",
    reference_number: "ORDER-123",
    status: "completed",
    amount: "197.00",
    currency: "myr",
    email: " Buyer@Example.com ",
    order: {
      items: [
        { product_id: "product_abc" },
        { product: { id: "product_abc" } },
      ],
    },
  });
  assert.deepEqual(event, {
    status: "completed",
    providerPaymentId: "request_123",
    providerReference: "ORDER-123",
    amount: 197,
    currency: "MYR",
    purchaseEmail: "buyer@example.com",
    productIds: ["product_abc"],
  });
});

test("webhook fingerprint is stable for retries and separates event metadata", () => {
  const raw = '{"status":"completed"}';
  assert.equal(webhookFingerprint(raw, "payment_request", "completed"), webhookFingerprint(raw, "payment_request", "completed"));
  assert.notEqual(webhookFingerprint(raw, "payment_request", "completed"), webhookFingerprint(raw, "payment_request", "failed"));
});
