import { upsertFromStripe } from "@/server/data/subscriptions";
import { setStripeCustomerId } from "@/server/data/profiles";

export async function activateMockPro(
  userId: string,
  interval: "monthly" | "annual",
) {
  const customerId = `cus_mock_${userId.replace(/-/g, "").slice(0, 14)}`;
  const subscriptionId = `sub_mock_${userId.replace(/-/g, "").slice(0, 14)}`;
  await setStripeCustomerId(userId, customerId);
  await upsertFromStripe(userId, {
    tier: "PRO",
    status: "ACTIVE",
    stripeSubscriptionId: subscriptionId,
    stripePriceId:
      interval === "monthly"
        ? "price_mock_monthly"
        : "price_mock_annual",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
  });
}

export async function cancelMockPro(userId: string) {
  await upsertFromStripe(userId, {
    tier: "FREE",
    status: "CANCELED",
    stripeSubscriptionId: null,
    stripePriceId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
}
