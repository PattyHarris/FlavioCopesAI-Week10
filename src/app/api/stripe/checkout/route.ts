import { NextResponse } from "next/server";

import { createStripeClient } from "@/lib/billing/stripe";
import { env } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnedNewsletterBySlug } from "@/lib/newsletters";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    newsletterSlug?: string;
    billingPlanId?: string;
  };
  const requestOrigin = request.headers.get("origin");
  const appOrigin = requestOrigin ?? env.appUrl;

  if (!body.newsletterSlug || !body.billingPlanId) {
    return NextResponse.json(
      { error: "Newsletter and billing plan are required." },
      { status: 400 },
    );
  }

  try {
    const stripe = createStripeClient();
    const supabase = await createSupabaseServerClient();
    const { newsletter, context } = await getOwnedNewsletterBySlug(body.newsletterSlug);

    const { data: plan, error: planError } = await supabase
      .from("billing_plans")
      .select("id, name, stripe_price_id")
      .eq("id", body.billingPlanId)
      .maybeSingle();

    if (planError) {
      throw new Error(planError.message);
    }

    if (!plan) {
      throw new Error("Billing plan not found.");
    }

    if (!plan.stripe_price_id) {
      throw new Error(`The ${plan.name} plan does not have a Stripe Price ID configured yet.`);
    }

    const { data: subscriptionRow, error: subscriptionError } = await supabase
      .from("newsletter_subscriptions")
      .select("id, stripe_customer_id")
      .eq("newsletter_id", newsletter.id)
      .maybeSingle();

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${appOrigin}/app/newsletters/${newsletter.slug}/settings?checkout=success`,
      cancel_url: `${appOrigin}/app/newsletters/${newsletter.slug}/settings?checkout=cancelled`,
      allow_promotion_codes: true,
      customer: subscriptionRow?.stripe_customer_id ?? undefined,
      customer_email: subscriptionRow?.stripe_customer_id ? undefined : context.user?.email ?? undefined,
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        newsletter_id: newsletter.id,
        newsletter_slug: newsletter.slug,
        billing_plan_id: plan.id,
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create Stripe checkout session.",
      },
      { status: 500 },
    );
  }
}
