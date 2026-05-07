import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/billing/stripe";

type StripeSubscriptionShape = {
  id: string;
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  status: string;
  items?: {
    data: Array<{
      price?: {
        id?: string | null;
      } | null;
    }>;
  };
  current_period_start?: number;
  current_period_end?: number;
};

import Stripe from "stripe";

function toIsoFromUnix(value?: number) {
  return value ? new Date(value * 1000).toISOString() : null;
}

async function syncSubscriptionToNewsletterSubscription(subscription: StripeSubscriptionShape) {
  const supabase = createSupabaseAdminClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer && "id" in subscription.customer
        ? subscription.customer.id
        : null;
  const firstPriceId = subscription.items?.data[0]?.price?.id ?? null;

  const { data: billingPlan, error: billingPlanError } = await supabase
    .from("billing_plans")
    .select("id")
    .eq("stripe_price_id", firstPriceId)
    .maybeSingle();

  if (billingPlanError) {
    throw new Error(billingPlanError.message);
  }

  const { data: existingSubscription, error: existingSubscriptionError } = await supabase
    .from("newsletter_subscriptions")
    .select("id, newsletter_id, billing_plan_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (existingSubscriptionError) {
    throw new Error(existingSubscriptionError.message);
  }

  if (!existingSubscription) {
    return {
      ignored: true,
      reason: `No newsletter_subscription matched stripe_subscription_id ${subscription.id}.`,
    };
  }

  const { error: updateError } = await supabase
    .from("newsletter_subscriptions")
    .update({
      billing_plan_id: billingPlan?.id ?? existingSubscription.billing_plan_id ?? null,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: toIsoFromUnix(subscription.current_period_start),
      current_period_end: toIsoFromUnix(subscription.current_period_end),
    })
    .eq("id", existingSubscription.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    ignored: false,
    newsletterSubscriptionId: existingSubscription.id,
  };
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
  const supabase = createSupabaseAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const newsletterId = session.metadata?.newsletter_id;
      const billingPlanId = session.metadata?.billing_plan_id;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

      if (!newsletterId) {
        return { ignored: true, reason: "Missing newsletter_id metadata on checkout session." };
      }

      const { error } = await supabase
        .from("newsletter_subscriptions")
        .update({
          billing_plan_id: billingPlanId ?? null,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: "active",
        })
        .eq("newsletter_id", newsletterId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        ignored: false,
        newsletterId,
      };
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      return syncSubscriptionToNewsletterSubscription(event.data.object as StripeSubscriptionShape);
    }

    case "invoice.paid":
    case "invoice.payment_failed":
      return {
        ignored: true,
        reason: `Event ${event.type} acknowledged but not yet used for state changes.`,
      };

    default:
      return {
        ignored: true,
        reason: `Unhandled Stripe event type: ${event.type}`,
      };
  }
}

export function constructStripeEvent(rawBody: string, signature: string) {
  const stripe = createStripeClient();

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
