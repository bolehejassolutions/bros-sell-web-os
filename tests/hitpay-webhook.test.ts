import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  normalizeHitPayStoreEvent,
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
