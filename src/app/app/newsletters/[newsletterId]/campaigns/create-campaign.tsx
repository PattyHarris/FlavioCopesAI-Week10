"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type SegmentOption = {
  id: string;
  name: string;
  description: string | null;
};

type CampaignRow = {
  id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
  segment_id: string | null;
  audienceLabel: string;
  queuedRecipients: number;
  deliveryStats: {
    total: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    failed: number;
  };
};

export function CreateCampaign({
  newsletterSlug,
  segments,
  initialCampaigns,
  subscriberCount,
}: {
  newsletterSlug: string;
  segments: SegmentOption[];
  initialCampaigns: CampaignRow[];
  subscriberCount: number;
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [message, setMessage] = useState("Create a draft first. Sending can come next.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preparingCampaignId, setPreparingCampaignId] = useState<string | null>(null);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);

  function getCampaignActionHint(campaign: CampaignRow) {
    if (campaign.status === "draft") {
      return "Prepare send first to generate delivery records before sending.";
    }

    if (campaign.status === "queued") {
      return `${campaign.queuedRecipients} deliveries are ready to send.`;
    }

    if (campaign.status === "sent") {
      return "Sent campaigns stay here for reporting and follow-up review.";
    }

    return "Review the report or continue with the next step.";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Creating campaign draft...");

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newsletterSlug,
          name,
          subject,
          previewText,
          bodyHtml,
          segmentId,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        campaign?: CampaignRow;
      };

      if (!response.ok || !payload.campaign) {
        throw new Error(payload.error ?? "Unable to create campaign draft.");
      }

      setCampaigns((current) => [payload.campaign as CampaignRow, ...current]);
      setName("");
      setSubject("");
      setPreviewText("");
      setBodyHtml("");
      setSegmentId("");
      setMessage(payload.message ?? "Campaign draft created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create campaign draft.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePrepare(campaignId: string) {
    setPreparingCampaignId(campaignId);
    setMessage("Preparing delivery records...");

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/prepare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newsletterSlug,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        campaignId?: string;
        queuedRecipients?: number;
      };

      if (!response.ok || !payload.campaignId) {
        throw new Error(payload.error ?? "Unable to prepare campaign send.");
      }

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === payload.campaignId
            ? {
                ...campaign,
                status: "queued",
                queuedRecipients: payload.queuedRecipients ?? campaign.queuedRecipients,
              }
            : campaign,
        ),
      );
      setMessage(payload.message ?? "Prepared delivery records.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to prepare campaign send.");
    } finally {
      setPreparingCampaignId(null);
    }
  }

  async function handleSend(campaignId: string) {
    setSendingCampaignId(campaignId);
    setMessage("Sending through Resend...");

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newsletterSlug,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        campaignId?: string;
        sentCount?: number;
      };

      if (!response.ok || !payload.campaignId) {
        throw new Error(payload.error ?? "Unable to send campaign.");
      }

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === payload.campaignId
            ? {
                ...campaign,
                status: "sent",
                queuedRecipients: payload.sentCount ?? campaign.queuedRecipients,
              }
            : campaign,
        ),
      );
      setMessage(payload.message ?? "Campaign sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send campaign.");
    } finally {
      setSendingCampaignId(null);
    }
  }

  return (
    <div className="detail-grid">
      <article className="card">
        <p className="eyebrow">Create campaign</p>
        <h2>Write the next email</h2>
        <div className="inline-note">
          Blank audience means all {subscriberCount.toLocaleString()} subscribers.
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Campaign name</span>
            <input
              onChange={(event) => setName(event.target.value)}
              placeholder="May product roundup"
              required
              type="text"
              value={name}
            />
          </label>
          <label className="field">
            <span className="field-label">Subject line</span>
            <input
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Everything new this month"
              required
              type="text"
              value={subject}
            />
          </label>
          <label className="field">
            <span className="field-label">Preview text</span>
            <input
              onChange={(event) => setPreviewText(event.target.value)}
              placeholder="A short line that appears in inbox previews"
              type="text"
              value={previewText}
            />
          </label>
          <label className="field">
            <span className="field-label">Audience</span>
            <select className="select-input" onChange={(event) => setSegmentId(event.target.value)} value={segmentId}>
              <option value="">All subscribers</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Body</span>
            <textarea
              onChange={(event) => setBodyHtml(event.target.value)}
              placeholder="Write the newsletter content here. We can swap this to a richer editor later."
              required
              value={bodyHtml}
            />
          </label>
          <div className="form-actions">
            <button className="button button-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating..." : "Create campaign draft"}
            </button>
          </div>
          <p className="form-status">{message}</p>
        </form>
      </article>

      <article className="card">
        <p className="eyebrow">Drafts and sends</p>
        <div className="card-list">
          {campaigns.length === 0 ? (
            <div className="hero-stat">
              <strong>No campaigns yet</strong>
              <p className="muted-copy">Create a draft here and it will appear immediately.</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div className="hero-stat" key={campaign.id}>
                <div className="item-header">
                  <strong>{campaign.name}</strong>
                  <span className="muted-copy">{campaign.subject}</span>
                </div>
                <div className="stack-row">
                  <span className="badge">{campaign.status}</span>
                  <span className="badge">{campaign.audienceLabel}</span>
                  <span className="badge">{campaign.queuedRecipients} deliveries</span>
                </div>
                <div className="campaign-stats-grid">
                  <div className="campaign-stat">
                    <strong>{campaign.deliveryStats.delivered}</strong>
                    <span>Delivered</span>
                  </div>
                  <div className="campaign-stat">
                    <strong>{campaign.deliveryStats.opened}</strong>
                    <span>Opened</span>
                  </div>
                  <div className="campaign-stat">
                    <strong>{campaign.deliveryStats.clicked}</strong>
                    <span>Clicked</span>
                  </div>
                  <div className="campaign-stat">
                    <strong>{campaign.deliveryStats.bounced}</strong>
                    <span>Bounced</span>
                  </div>
                </div>
                <div className="form-actions">
                  <Link
                    className="button button-secondary"
                    href={`/app/newsletters/${newsletterSlug}/campaigns/${campaign.id}`}
                  >
                    View report
                  </Link>
                  <button
                    className="button button-secondary"
                    disabled={preparingCampaignId === campaign.id || campaign.status === "queued"}
                    onClick={() => handlePrepare(campaign.id)}
                    type="button"
                  >
                    {preparingCampaignId === campaign.id
                      ? "Preparing..."
                      : campaign.status === "queued"
                        ? "Prepared"
                      : "Prepare send"}
                  </button>
                  <button
                    className="button button-primary"
                    disabled={sendingCampaignId === campaign.id || campaign.status !== "queued"}
                    onClick={() => handleSend(campaign.id)}
                    type="button"
                  >
                    {sendingCampaignId === campaign.id
                      ? "Sending..."
                      : campaign.status !== "queued"
                        ? "Prepare first"
                        : "Send now"}
                  </button>
                </div>
                <p className="form-status">{getCampaignActionHint(campaign)}</p>
              </div>
            ))
          )}
        </div>
      </article>
    </div>
  );
}
