import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_")) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
  });
}

export function getPaymentMethods(): string[] {
  return (process.env.STRIPE_PAYMENT_METHODS ?? "card")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}
