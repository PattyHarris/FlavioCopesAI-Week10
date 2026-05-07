import { NextResponse } from "next/server";

import { constructStripeEvent, processStripeWebhookEvent } from "@/lib/billing/stripe-webhooks";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const rawBody = await request.text();
    const event = constructStripeEvent(rawBody, signature);
    const result = await processStripeWebhookEvent(event);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to process Stripe webhook.",
      },
      { status: 500 },
    );
  }
}
