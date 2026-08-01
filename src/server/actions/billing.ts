"use server";

import { getLocale } from "next-intl/server";

import type { ActionResult } from "@/lib/utils";
import { getStripe } from "@/lib/stripe";
import { isMockThirdParty } from "@/lib/mock/enabled";
import { requireUser } from "@/server/auth";
import { getProfile } from "@/server/data/profiles";

function appUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) throw new Error("Billing is not configured. Set NEXT_PUBLIC_APP_URL.");
  return new URL(value).origin;
}

function priceId(interval: "monthly" | "annual") {
  const value =
    interval === "monthly"
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL;
  if (!value || !value.startsWith("price_")) {
    throw new Error(`Stripe ${interval} price is not configured.`);
  }
  return value;
}

function errorResult(error: unknown): ActionResult<string> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Unable to open Stripe.",
  };
}

export async function createCheckoutSession(
  interval: "monthly" | "annual",
): Promise<ActionResult<string>> {
  try {
    const [user, locale] = await Promise.all([requireUser(), getLocale()]);
    if (isMockThirdParty()) {
      return {
        ok: true,
        data: `${appUrl()}/${locale}/mock/billing/checkout?interval=${interval}`,
      };
    }

    const profile = await getProfile(user.id);
    if (!profile) throw new Error("Profile not found.");

    const origin = appUrl();
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: profile.stripeCustomerId ?? undefined,
      customer_email: profile.stripeCustomerId ? undefined : profile.email ?? undefined,
      client_reference_id: user.id,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      line_items: [{ price: priceId(interval), quantity: 1 }],
      success_url: `${origin}/${locale}/settings/billing?checkout=success`,
      cancel_url: `${origin}/${locale}/settings/billing?checkout=cancelled`,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { ok: true, data: session.url };
  } catch (error) {
    return errorResult(error);
  }
}

export async function createPortalSession(): Promise<ActionResult<string>> {
  try {
    const [user, locale] = await Promise.all([requireUser(), getLocale()]);
    if (isMockThirdParty()) {
      return {
        ok: true,
        data: `${appUrl()}/${locale}/mock/billing/portal`,
      };
    }

    const profile = await getProfile(user.id);
    if (!profile?.stripeCustomerId) {
      throw new Error("No Stripe subscription is available to manage.");
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${appUrl()}/${locale}/settings/billing`,
    });
    return { ok: true, data: session.url };
  } catch (error) {
    return errorResult(error);
  }
}
