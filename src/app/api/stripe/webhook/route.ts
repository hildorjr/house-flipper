import type Stripe from "stripe";

import { logError, logWarn } from "@/lib/logger";
import { getStripe } from "@/lib/stripe";
import {
  getProfileByStripeCustomerId,
  setStripeCustomerId,
} from "@/server/data/profiles";
import { upsertFromStripe } from "@/server/data/subscriptions";

export const runtime = "nodejs";

function subscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
    case "unpaid":
      return "PAST_DUE" as const;
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE" as const;
    default:
      return "CANCELED" as const;
  }
}

async function ownerIdForSubscription(subscription: Stripe.Subscription) {
  const metadataOwnerId = subscription.metadata.userId;
  if (metadataOwnerId) return metadataOwnerId;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const profile = await getProfileByStripeCustomerId(customerId);
  return profile?.id ?? null;
}

async function syncSubscription(subscription: Stripe.Subscription, ownerId?: string | null) {
  const userId = ownerId ?? (await ownerIdForSubscription(subscription));
  if (!userId) return;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  await setStripeCustomerId(userId, customerId);

  await upsertFromStripe(userId, {
    tier: subscription.status === "active" || subscription.status === "trialing" ? "PRO" : "FREE",
    status: subscriptionStatus(subscription.status),
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id ?? null,
    currentPeriodEnd: subscription.items.data[0]
      ? new Date(subscription.items.data[0].current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

async function syncInvoice(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;
  if (!subscriptionId) return;
  await syncSubscription(await getStripe().subscriptions.retrieve(subscriptionId));
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret || !secret.startsWith("whsec_")) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      secret,
    );
  } catch (error) {
    logWarn("Stripe webhook signature verification failed", { error });
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (userId && customerId) {
          await setStripeCustomerId(userId, customerId);
        }
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subscriptionId) {
          await syncSubscription(
            await getStripe().subscriptions.retrieve(subscriptionId),
            userId,
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        await syncInvoice(event.data.object);
        break;
    }
  } catch (error) {
    logError("Stripe webhook processing failed", {
      error,
      eventId: event.id,
      eventType: event.type,
    });
    return Response.json({ error: "Unable to process Stripe event." }, { status: 500 });
  }

  return Response.json({ received: true });
}
