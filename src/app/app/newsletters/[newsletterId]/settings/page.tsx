import { redirect } from "next/navigation";

import { BillingActions } from "./billing-actions";
import { getBillingForOwnedNewsletter } from "@/lib/newsletters";

type PageProps = {
  params: Promise<{
    newsletterId: string;
  }>;
  searchParams?: Promise<{
    checkout?: string;
  }>;
};

export default async function SettingsPage({ params, searchParams }: PageProps) {
  const { newsletterId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const checkoutState = resolvedSearchParams?.checkout;

  try {
    const { newsletter, usage, selectedPlan, recommendedPlan, plans, subscription } =
      await getBillingForOwnedNewsletter(newsletterId);

    const centsToDollars = (value: number) => `$${(value / 100).toFixed(2)}`;

    return (
      <>
        <section className="card">
          <p className="eyebrow">Settings</p>
          <h2>{newsletter.name}: billing, domains, defaults, and roles</h2>
          <p className="muted-copy">
            Billing is now driven by real subscriber and sent-email usage. Stripe checkout can plug into this next,
            but we can already test tier thresholds safely.
          </p>
        </section>

        {checkoutState === "success" ? (
          <section className="status-banner status-banner-success" aria-live="polite">
            <strong>Checkout complete.</strong>
            <p className="muted-copy">
              Stripe sent you back successfully. If your plan details do not update right away, refresh after the
              webhook finishes syncing.
            </p>
          </section>
        ) : null}

        {checkoutState === "cancelled" ? (
          <section className="status-banner status-banner-warning" aria-live="polite">
            <strong>Checkout cancelled.</strong>
            <p className="muted-copy">
              No billing change was made. You can return to this page and try the upgrade flow again whenever you are
              ready.
            </p>
          </section>
        ) : null}

        <section className="stats-grid">
          <article className="card stat-card">
            <p className="eyebrow">Current plan</p>
            <h3>{selectedPlan?.name ?? "No plan"}</h3>
            <p className="muted-copy">
              {selectedPlan ? centsToDollars(selectedPlan.monthly_base_price_cents) : "$0.00"} base per month
            </p>
            <p className="helper-copy">
              {selectedPlan
                ? `${selectedPlan.included_subscribers.toLocaleString()} subscriber limit on this plan`
                : "No seeded billing plan is attached yet"}
            </p>
          </article>
          <article className="card stat-card">
            <p className="eyebrow">Active subscribers</p>
            <h3>{usage.currentSubscribers.toLocaleString()}</h3>
            <p className="muted-copy">
              {usage.includedSubscribers.toLocaleString()} included on current plan
            </p>
            <p className="helper-copy">
              {usage.currentSubscribers > usage.includedSubscribers
                ? `${(usage.currentSubscribers - usage.includedSubscribers).toLocaleString()} over the included limit`
                : `${(usage.includedSubscribers - usage.currentSubscribers).toLocaleString()} subscribers remaining before overage`}
            </p>
          </article>
          <article className="card stat-card">
            <p className="eyebrow">Sent this period</p>
            <h3>{usage.currentEmails.toLocaleString()}</h3>
            <p className="muted-copy">{usage.includedEmails.toLocaleString()} included emails</p>
          </article>
        </section>

        <section className="detail-grid">
          <article className="card">
            <p className="eyebrow">Usage projection</p>
            <div className="card-list">
              <div className="hero-stat">
                <strong>Projected monthly total</strong>
                <p className="muted-copy">{centsToDollars(usage.projectedTotalCents)}</p>
              </div>
              <div className="hero-stat">
                <strong>Subscriber overage</strong>
                <p className="muted-copy">
                  {usage.overageSubscribers.toLocaleString()} above plan, {centsToDollars(usage.overageSubscriberCostCents)}
                </p>
              </div>
              <div className="hero-stat">
                <strong>Email overage</strong>
                <p className="muted-copy">
                  {usage.overageEmails.toLocaleString()} above plan, {centsToDollars(usage.overageEmailCostCents)}
                </p>
              </div>
              <div className="hero-stat">
                <strong>Recommended plan</strong>
                <p className="muted-copy">{recommendedPlan?.name ?? "No recommendation yet"}</p>
              </div>
            </div>
          </article>

          <article className="card">
            <p className="eyebrow">Subscription state</p>
            <div className="card-list">
              <div className="hero-stat">
                <strong>Status</strong>
                <p className="muted-copy">{subscription?.status ?? "No subscription row found"}</p>
              </div>
              <div className="hero-stat">
                <strong>Billing period</strong>
                <p className="muted-copy">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(usage.periodStart))}{" "}
                  to{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(usage.periodEnd))}
                </p>
              </div>
              <div className="hero-stat">
                <strong>Stripe connection</strong>
                <p className="muted-copy">
                  {subscription?.stripe_customer_id ? "Customer linked" : "Not linked yet"}
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="detail-grid">
          <article className="card">
            <p className="eyebrow">Plans</p>
            <div className="card-list">
              {plans.length === 0 ? (
                <div className="hero-stat">
                  <strong>No billing plans found</strong>
                  <p className="muted-copy">
                    The `billing_plans` table is empty. Run the `004_seed_billing_plans.sql` migration, then refresh
                    this page.
                  </p>
                </div>
              ) : (
                plans.map((plan) => (
                  <div className="hero-stat" key={plan.id}>
                    <strong>{plan.name}</strong>
                    <p className="muted-copy">
                      {centsToDollars(plan.monthly_base_price_cents)} / month
                    </p>
                    <p className="muted-copy">
                      Includes {plan.included_subscribers.toLocaleString()} subscribers and{" "}
                      {plan.included_emails.toLocaleString()} emails
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="card">
            <p className="eyebrow">Testing help</p>
            <div className="card-list">
              <div className="hero-stat">
                <strong>How to exceed the free tier</strong>
                <p className="muted-copy">
                  Add dummy subscribers until you cross the included subscriber limit on the free plan.
                </p>
              </div>
              <div className="hero-stat">
                <strong>Recommended test method</strong>
                <p className="muted-copy">
                  Use direct SQL inserts in Supabase for bulk dummy subscribers instead of filling forms manually.
                </p>
              </div>
              <div className="hero-stat">
                <strong>Next Stripe step</strong>
                <p className="muted-copy">
                  Once usage and plans look right, we can connect Stripe checkout and customer portal flows.
                </p>
              </div>
            </div>
          </article>
        </section>

        <section>
          <BillingActions
            currentPlanId={selectedPlan?.id ?? null}
            newsletterSlug={newsletter.slug}
            plans={plans}
          />
        </section>
      </>
    );
  } catch {
    redirect("/app");
  }
}
