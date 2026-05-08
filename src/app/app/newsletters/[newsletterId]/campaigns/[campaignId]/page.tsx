import Link from "next/link";
import { redirect } from "next/navigation";

import { getCampaignReportForOwnedNewsletter } from "@/lib/newsletters";

const deliveryStatuses = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "opened", label: "Opened" },
  { value: "clicked", label: "Clicked" },
  { value: "bounced", label: "Bounced" },
  { value: "complained", label: "Complained" },
  { value: "failed", label: "Failed" },
] as const;

type PageProps = {
  params: Promise<{
    newsletterId: string;
    campaignId: string;
  }>;
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function CampaignDetailPage({ params, searchParams }: PageProps) {
  const { newsletterId, campaignId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedStatus = resolvedSearchParams?.status ?? "all";
  const activeStatus = deliveryStatuses.some((item) => item.value === requestedStatus) ? requestedStatus : "all";

  try {
    const { newsletter, campaign, deliveries, summary, statusCounts } = await getCampaignReportForOwnedNewsletter(
      newsletterId,
      campaignId,
    );

    const filteredDeliveries =
      activeStatus === "all" ? deliveries : deliveries.filter((delivery) => delivery.status === activeStatus);

    const formatDateTime = (value: string | null) =>
      value
        ? new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(value))
        : "Not yet";

    return (
      <>
        <section className="card">
          <div className="stack-row">
            <Link className="button button-secondary" href={`/app/newsletters/${newsletter.slug}/campaigns`}>
              Back to campaigns
            </Link>
            <span className="badge">{campaign.status}</span>
            <span className="badge">{campaign.audienceLabel}</span>
          </div>
          <p className="eyebrow">Campaign report</p>
          <h2>{campaign.name}</h2>
          <p className="muted-copy">{campaign.subject}</p>
          <p className="helper-copy">
            {campaign.preview_text || "No preview text was added for this campaign."}
          </p>
          <p className="helper-copy">
            Sent at {campaign.sent_at ? formatDateTime(campaign.sent_at) : "Not sent yet"}.
            {campaign.segmentName ? ` Targeting segment: ${campaign.segmentName}.` : " Targeting all subscribers."}
          </p>
        </section>

        <section className="campaign-stats-grid campaign-stats-grid-expanded">
          <article className="campaign-stat">
            <strong>{summary.total}</strong>
            <span>Total recipients</span>
          </article>
          <article className="campaign-stat">
            <strong>{summary.delivered}</strong>
            <span>Delivered</span>
          </article>
          <article className="campaign-stat">
            <strong>{summary.opened}</strong>
            <span>Opened</span>
          </article>
          <article className="campaign-stat">
            <strong>{summary.clicked}</strong>
            <span>Clicked</span>
          </article>
          <article className="campaign-stat">
            <strong>{summary.bounced}</strong>
            <span>Bounced</span>
          </article>
          <article className="campaign-stat">
            <strong>{summary.deliveryRate}%</strong>
            <span>Delivery rate</span>
          </article>
          <article className="campaign-stat">
            <strong>{summary.openRate}%</strong>
            <span>Open rate</span>
          </article>
          <article className="campaign-stat">
            <strong>{summary.clickRate}%</strong>
            <span>Click rate</span>
          </article>
        </section>

        <section className="detail-grid">
          <article className="card">
            <p className="eyebrow">Audience details</p>
            <div className="card-list">
              <div className="hero-stat">
                <strong>Audience</strong>
                <p className="muted-copy">{campaign.audienceLabel}</p>
              </div>
              <div className="hero-stat">
                <strong>Segment description</strong>
                <p className="muted-copy">{campaign.segmentDescription || "No segment description for this audience."}</p>
              </div>
              <div className="hero-stat">
                <strong>Current delivery state</strong>
                <p className="muted-copy">
                  {summary.queued} queued, {summary.sent} sent, {summary.failed} failed, {summary.complained} complained
                </p>
              </div>
            </div>
          </article>

          <article className="card">
            <p className="eyebrow">Filter recipients</p>
            <div className="filter-bar">
              {deliveryStatuses.map((status) => (
                <Link
                  className={`filter-chip${activeStatus === status.value ? " filter-chip-active" : ""}`}
                  href={
                    status.value === "all"
                      ? `/app/newsletters/${newsletter.slug}/campaigns/${campaign.id}`
                      : `/app/newsletters/${newsletter.slug}/campaigns/${campaign.id}?status=${status.value}`
                  }
                  key={status.value}
                >
                  {status.label} ({statusCounts[status.value] ?? 0})
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="card">
          <p className="eyebrow">Recipient log</p>
          <div className="card-list">
            {filteredDeliveries.length === 0 ? (
              <div className="hero-stat">
                <strong>No recipients match this filter</strong>
                <p className="muted-copy">Try another delivery status to inspect more rows.</p>
              </div>
            ) : (
              filteredDeliveries.map((delivery) => (
                <div className="table-row" key={delivery.id}>
                  <div className="recipient-copy">
                    <strong>{delivery.subscriber.fullName ?? delivery.subscriber.email}</strong>
                    <p className="muted-copy">{delivery.subscriber.email}</p>
                    <p className="helper-copy">
                      Source: {delivery.subscriber.sourceFormName} · Subscriber status: {delivery.subscriber.status}
                    </p>
                  </div>
                  <div className="subscriber-meta">
                    <div className="stack-row">
                      <span className="badge">{delivery.status}</span>
                    </div>
                    <p className="muted-copy">Queued {formatDateTime(delivery.created_at)}</p>
                    <p className="muted-copy">Delivered {formatDateTime(delivery.delivered_at)}</p>
                    <p className="muted-copy">Opened {formatDateTime(delivery.opened_at)}</p>
                    <p className="muted-copy">Clicked {formatDateTime(delivery.clicked_at)}</p>
                    {delivery.status === "bounced" ? (
                      <p className="muted-copy">Bounced {formatDateTime(delivery.bounced_at)}</p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </>
    );
  } catch {
    redirect("/app");
  }
}
