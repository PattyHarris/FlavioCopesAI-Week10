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
  hasStripeCustomer,
  plans,
}: {
  newsletterSlug: string;
  currentPlanId: string | null;
  hasStripeCustomer: boolean;
  plans: Plan[];
}) {
  const [message, setMessage] = useState("Upgrade when you are ready or open the billing portal for changes.");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

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

  async function handlePortal() {
    setOpeningPortal(true);
    setMessage("Opening Stripe customer portal...");

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newsletterSlug,
        }),
      });

      const payload = (await response.json()) as { portalUrl?: string; error?: string };

      if (!response.ok || !payload.portalUrl) {
        throw new Error(payload.error ?? "Unable to open the Stripe customer portal.");
      }

      window.location.href = payload.portalUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open the Stripe customer portal.");
    } finally {
      setOpeningPortal(false);
    }
  }

  return (
    <div className="card">
      <p className="eyebrow">Billing actions</p>
      <div className="card-list">
        <div className="hero-stat">
          <strong>Manage billing</strong>
          <p className="muted-copy">
            {hasStripeCustomer
              ? "Open Stripe's customer portal to review payment details and manage the subscription."
              : "Complete a Stripe checkout first so this newsletter has a linked customer record."}
          </p>
          <div className="form-actions">
            <button
              className="button button-secondary"
              disabled={!hasStripeCustomer || openingPortal || loadingPlanId !== null}
              onClick={handlePortal}
              type="button"
            >
              {openingPortal ? "Opening..." : "Manage billing"}
            </button>
          </div>
        </div>

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
      <p className="form-status">{message}</p>
    </div>
  );
}
