import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { newsletterSummaries } from "@/lib/mock/data";

export default function MarketingHomePage() {
  return (
    <div className="marketing-shell">
      <div className="page-wrap">
        <header className="marketing-nav">
          <Link className="brand" href="/">
            What&apos;s new
          </Link>
          <div className="nav-actions">
            <ThemeToggle />
            <Link className="button button-secondary" href="/login">
              Sign in
            </Link>
            <Link className="button button-primary" href="/app">
              Open workspace
            </Link>
          </div>
        </header>

        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Newsletter software with a calmer center of gravity</p>
            <h1>Publish, grow, and bill from one workspace that stays readable as the product grows.</h1>
            <p>
              What&apos;s new brings forms, subscriber growth, campaigns, delivery reporting, and billing into one
              deliberate product surface. It is built for teams that want fewer scattered tools and fewer accidental
              lists.
            </p>
            <div className="form-actions">
              <Link className="button button-primary" href="/app">
                Explore the workspace
              </Link>
              <Link className="button button-secondary" href="/login">
                Try email OTP
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <p className="eyebrow">Audience model</p>
                <strong>One subscriber pool per newsletter</strong>
              </div>
              <div className="hero-stat">
                <p className="eyebrow">Campaign flow</p>
                <strong>Draft, queue, send, report</strong>
              </div>
              <div className="hero-stat">
                <p className="eyebrow">Billing model</p>
                <strong>Usage based with Stripe</strong>
              </div>
            </div>
          </div>

          <div className="hero-preview">
            {newsletterSummaries.map((newsletter) => (
              <article className="card" key={newsletter.id}>
                <p className="eyebrow">{newsletter.name}</p>
                <h3>{newsletter.subscribers.toLocaleString()} subscribers</h3>
                <div className="stack-row">
                  <span className="badge">{newsletter.openRate} open rate</span>
                  <span className="badge">{newsletter.revenue} MRR</span>
                </div>
                <p className="muted-copy">
                  {newsletter.forms} forms, {newsletter.campaigns} campaigns, one deliberate audience graph.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block feature-grid">
          <article className="card">
            <p className="eyebrow">Audience model</p>
            <h3>Subscribers belong to the newsletter</h3>
            <p className="muted-copy">
              Hosted forms and widgets are acquisition channels, not separate lists, so segmentation stays coherent.
            </p>
          </article>
          <article className="card">
            <p className="eyebrow">Delivery model</p>
            <h3>Every send becomes a reportable record</h3>
            <p className="muted-copy">
              Sent, delivered, opened, clicked, and bounced states are captured per recipient so reporting can stay
              honest.
            </p>
          </article>
          <article className="card">
            <p className="eyebrow">Operational posture</p>
            <h3>Ready for billing, auth, and deployment</h3>
            <p className="muted-copy">
              Supabase, Resend, Stripe, and Render are part of the working system rather than a hand-wavy future plan.
            </p>
          </article>
        </section>
      </div>
    </div>
  );
}
