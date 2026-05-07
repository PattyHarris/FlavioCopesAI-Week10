"use client";

import { useState } from "react";

type Plan = {
  id: string;
  name: string;
  stripe_price_id: string | null;
};

export function BillingActions({
  newsletterSlug,
  currentPlanId,
  plans,
}: {
  newsletterSlug: string;
  currentPlanId: string | null;
  plans: Plan[];
}) {
  const [message, setMessage] = useState("Choose a paid plan when you are ready to test Stripe checkout.");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  async function handleCheckout(planId: string) {
    setLoadingPlanId(planId);
    setMessage("Creating Stripe checkout session...");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newsletterSlug,
          billingPlanId: planId,
        }),
      });

      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error ?? "Unable to start Stripe checkout.");
      }

      window.location.href = payload.checkoutUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start Stripe checkout.");
    } finally {
      setLoadingPlanId(null);
    }
  }

  return (
    <div className="card">
      <p className="eyebrow">Upgrade actions</p>
      <div className="card-list">
        {plans
          .filter((plan) => plan.name !== "Free")
          .map((plan) => (
            <div className="hero-stat" key={plan.id}>
              <strong>{plan.name}</strong>
              <p className="muted-copy">
                {plan.stripe_price_id
                  ? "Stripe price configured"
                  : "Missing stripe_price_id in billing_plans; checkout will not start yet"}
              </p>
              <div className="form-actions">
                <button
                  className="button button-primary"
                  disabled={loadingPlanId === plan.id || currentPlanId === plan.id}
                  onClick={() => handleCheckout(plan.id)}
                  type="button"
                >
                  {loadingPlanId === plan.id ? "Starting..." : currentPlanId === plan.id ? "Current plan" : `Choose ${plan.name}`}
                </button>
              </div>
            </div>
          ))}
      </div>
      <p className="helper-copy">{message}</p>
    </div>
  );
}
