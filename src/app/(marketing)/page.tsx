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
              Open app
            </Link>
          </div>
        </header>

        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Newsletter infrastructure for modern teams</p>
            <h1>Run forms, campaigns, segments, and billing from one calm workspace.</h1>
            <p>
              `What&apos;s new` is designed like a serious product, not a toy dashboard. Create newsletters,
              grow a clean subscriber graph, send campaigns, and track performance from a document-like interface.
            </p>
            <div className="form-actions">
              <Link className="button button-primary" href="/app">
                Explore the dashboard scaffold
              </Link>
              <Link className="button button-secondary" href="/login">
                Try OTP sign-in flow
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <p className="eyebrow">Billing model</p>
                <strong>Usage based</strong>
              </div>
              <div className="hero-stat">
                <p className="eyebrow">Acquisition</p>
                <strong>Hosted + embedded forms</strong>
              </div>
              <div className="hero-stat">
                <p className="eyebrow">Sending</p>
                <strong>Resend-ready</strong>
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
                  {newsletter.forms} forms, {newsletter.campaigns} campaigns, one shared audience pool.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block feature-grid">
          <article className="card">
            <p className="eyebrow">Audience model</p>
            <h3>Newsletter-owned subscribers</h3>
            <p className="muted-copy">
              Forms are acquisition channels, not separate lists. That keeps segments and campaign targeting sane.
            </p>
          </article>
          <article className="card">
            <p className="eyebrow">Sending model</p>
            <h3>Campaigns with delivery records</h3>
            <p className="muted-copy">
              Every recipient gets an email delivery row so sent, delivered, opened, clicked, and bounced events can
              roll up cleanly.
            </p>
          </article>
          <article className="card">
            <p className="eyebrow">Product posture</p>
            <h3>Built like a SaaS platform</h3>
            <p className="muted-copy">
              Dark mode, command palette, responsive shell, and deployable server routes are part of the base.
            </p>
          </article>
        </section>
      </div>
    </div>
  );
}
