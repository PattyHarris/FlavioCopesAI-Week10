import Stripe from "stripe";

import { env } from "@/lib/config/env";

export function createStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(env.stripeSecretKey);
}
