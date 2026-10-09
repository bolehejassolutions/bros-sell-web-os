import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  hashEvidenceValue,
  normalizeHitPayStoreEvent,
  payloadShape,
  verifyRawBodySignature,
  webhookFingerprint,
} from "../lib/hitpay/webhook.ts";

test("registered webhook raw-body signature requires the endpoint salt", () => {
  const endpointSalt = "endpoint-salt";
  const apiSalt = "api-key-salt";
  const raw = JSON.stringify({ id: "charge_1", status: "succeeded" });
  const signature = createHmac("sha256", endpointSalt).update(raw).digest("hex");

  assert.equal(verifyRawBodySignature(raw, signature, endpointSalt), true);
  assert.equal(verifyRawBodySignature(raw, signature, apiSalt), false);
  assert.equal(verifyRawBodySignature(raw + " ", signature, endpointSalt), false);
});

test("documented charge.created shape maps buyer, order and product line identity", () => {
  const event = normalizeHitPayStoreEvent({
    id: "charge_123",
    business_id: "business_123",
    status: "succeeded",
    customer: {
      name: "Buyer",
      email: " Buyer@Example.com ",
    },
    currency: "myr",
    amount: 100,
    order: {
      id: "order_123",
      business_id: "business_123",
      status: "completed",
      payment_status: "paid",
      customer: {
        email: "buyer@example.com",
      },
      currency: "myr",
      amount: 100,
      line_items: [
        {
          id: "line_1",
          item_type: "product",
          related_id: "a2cfb307-366d-4ebc-9ff4-68b6c718e7d6",
          quantity: 1,
          unit_price: 100,
          line_item_amount: 100,
        },
      ],
    },
    order_id: "order_123",
  });

  assert.deepEqual(event, {
    status: "succeeded",
    providerPaymentId: "charge_123",
    providerReference: "order_123",
    businessId: "business_123",
    amount: 100,
    currency: "MYR",
    purchaseEmail: "buyer@example.com",
    productIds: ["a2cfb307-366d-4ebc-9ff4-68b6c718e7d6"],
  });
});

test("non-product line items never become entitlement product identifiers", () => {
  const event = normalizeHitPayStoreEvent({
    id: "charge_123",
    status: "succeeded",
    customer: { email: "buyer@example.com" },
    order: {
      id: "order_123",
      line_items: [
        { item_type: "shipping", related_id: "shipping_1" },
        { item_type: "product", related_id: "product_1" },
        { item_type: "discount", related_id: "discount_1" },
      ],
    },
  });
  assert.deepEqual(event.productIds, ["product_1"]);
});

test("merchant-observed product line identity stays distinct from the catalogue editor identity", () => {
  // Structure derived from the authenticated merchant Request view for #1007.
  // Purchase identifiers/email are synthetic; this is not the original body
  // and carries no original signature or authenticated API provenance.
  const event = normalizeHitPayStoreEvent({
    id: "redacted-charge",
    business_id: "a089a95e-7d0e-4f1b-8d85-425f3c82f460",
    status: "succeeded",
    customer: { email: "redacted@example.com" },
    currency: "myr", amount: 50, order_id: "redacted-order",
    order: {
      id: "redacted-order", order_display_number: 1007,
      business_id: "a089a95e-7d0e-4f1b-8d85-425f3c82f460",
      status: "completed", payment_status: "paid",
      customer: { email: "redacted@example.com" }, currency: "myr",
      line_items: [{ item_type: "product", related_id: "a2cfb307-df19-4a44-91ea-1a5ac1b64dc1", quantity: 1, unit_price: 50 }],
    },
  });
  assert.deepEqual(event.productIds, ["a2cfb307-df19-4a44-91ea-1a5ac1b64dc1"]);
  assert.ok(!event.productIds.includes("a2cfb307-366d-4ebc-9ff4-68b6c718e7d6"));
  assert.equal(event.providerReference, "redacted-order");
  assert.equal(event.purchaseEmail, "redacted@example.com");
  assert.equal(event.amount, 50);
});

test("nested order customer is accepted when the charge customer is absent", () => {
  const event = normalizeHitPayStoreEvent({
    id: "charge_123",
    business_id: "business_123",
    status: "succeeded",
    amount: 100,
    currency: "MYR",
    order: {
      id: "order_123",
      customer: { email: "nested@example.com" },
      line_items: [{ item_type: "product", related_id: "product_1" }],
    },
  });
  assert.equal(event.purchaseEmail, "nested@example.com");
  assert.equal(event.providerReference, "order_123");
});

test("webhook fingerprint is stable for identical retries and separates event metadata", () => {
  const raw = '{"status":"succeeded"}';
  assert.equal(
    webhookFingerprint(raw, "charge", "created"),
    webhookFingerprint(raw, "charge", "created"),
  );
  assert.notEqual(
    webhookFingerprint(raw, "charge", "created"),
    webhookFingerprint(raw, "charge", "updated"),
  );
});

test("capture evidence hashes buyer identity and records structure without values", () => {
  assert.equal(hashEvidenceValue("buyer@example.com"), hashEvidenceValue("buyer@example.com"));
  assert.notEqual(hashEvidenceValue("buyer@example.com"), "buyer@example.com");
  const shape = payloadShape({
    customer: { email: "buyer@example.com" },
    order: { line_items: [{ item_type: "product", related_id: "product_1" }] },
  });
  assert.ok(shape.includes("$.customer.email:string"));
  assert.ok(shape.includes("$.order.line_items[]:object"));
  assert.ok(!shape.some(item => item.includes("buyer@example.com") || item.includes("product_1")));
});
