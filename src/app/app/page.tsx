import { redirect } from "next/navigation";

import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardDataForCurrentUser } from "@/lib/newsletters";
import { segmentExamples } from "@/lib/mock/data";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Draft";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const context = await getDashboardDataForCurrentUser();

  if (!context.user) {
    redirect("/login");
  }

  if (context.newsletters.length === 0) {
    redirect("/onboarding");
  }

  return (
    <>
      <section className="card">
        <p className="eyebrow">Welcome</p>
        <h2>{context.profile?.full_name || context.user.email || "Your workspace"} is ready to grow.</h2>
        <p className="muted-copy">
          You now have live dashboard counts coming from Supabase across your newsletters, forms, subscribers, and
          campaigns.
        </p>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Subscribers"
          value={context.totalSubscribers.toLocaleString()}
          detail="Across all newsletters you own"
        />
        <StatCard label="Forms" value={String(context.totalForms)} detail="Hosted forms and embeddable entry points" />
        <StatCard label="Campaigns" value={String(context.totalCampaigns)} detail="Draft, scheduled, and sent" />
      </section>

      <section className="detail-grid">
        <article className="card">
          <p className="eyebrow">Recent campaigns</p>
          <div className="table-list">
            {context.recentCampaigns.length === 0 ? (
              <div className="table-row">
                <div>
                  <strong>No campaigns yet</strong>
                  <p className="muted-copy">Your recent campaign activity will appear here once you create drafts.</p>
                </div>
              </div>
            ) : (
              context.recentCampaigns.map((campaign) => (
                <div className="table-row" key={campaign.id}>
                  <div>
                    <strong>{campaign.name}</strong>
                    <p className="muted-copy">{campaign.newsletterName}</p>
                  </div>
                  <div>
                    <span className="badge">{campaign.status}</span>
                    <p className="muted-copy">{formatTimestamp(campaign.sentAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">Your newsletters</p>
          <div className="card-list">
            {context.newsletters.map((newsletter) => (
              <div className="hero-stat" key={newsletter.id}>
                <strong>{newsletter.name}</strong>
                <p className="muted-copy">{newsletter.description || "No description yet."}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="detail-grid">
        <article className="card">
          <p className="eyebrow">Segment ideas</p>
          <div className="card-list">
            {segmentExamples.map((segment) => (
              <div className="hero-stat" key={segment}>
                <strong>{segment}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">What&apos;s next</p>
          <div className="card-list">
            <div className="hero-stat">
              <strong>Create your first signup form</strong>
              <p className="muted-copy">That gives us the first end-to-end path from public page to subscriber record.</p>
            </div>
            <div className="hero-stat">
              <strong>Replace more placeholders with live data</strong>
              <p className="muted-copy">Subscribers, forms, and campaigns pages can now build on this same context.</p>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
