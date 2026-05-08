import { NextResponse } from "next/server";

import { createStripeClient } from "@/lib/billing/stripe";
import { env } from "@/lib/config/env";
import { getOwnedNewsletterBySlug } from "@/lib/newsletters";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    newsletterSlug?: string;
  };
  const requestOrigin = request.headers.get("origin");
  const appOrigin = requestOrigin ?? env.appUrl;

  if (!body.newsletterSlug) {
    return NextResponse.json({ error: "Newsletter is required." }, { status: 400 });
  }

  try {
    const stripe = createStripeClient();
    const supabase = await createSupabaseServerClient();
    const { newsletter } = await getOwnedNewsletterBySlug(body.newsletterSlug);

    const { data: subscriptionRow, error: subscriptionError } = await supabase
      .from("newsletter_subscriptions")
      .select("stripe_customer_id")
      .eq("newsletter_id", newsletter.id)
      .maybeSingle();

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    if (!subscriptionRow?.stripe_customer_id) {
      throw new Error("This newsletter is not linked to a Stripe customer yet.");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscriptionRow.stripe_customer_id,
      return_url: `${appOrigin}/app/newsletters/${newsletter.slug}/settings?portal=returned`,
    });

    return NextResponse.json({
      portalUrl: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to open the Stripe customer portal.",
      },
      { status: 500 },
    );
  }
}
