"use client";

import { FormEvent, useState } from "react";

type FormOption = {
  id: string;
  name: string;
  slug: string;
};

type SegmentRule =
  | { field: "source_list_id"; operator: "equals"; value: string }
  | { field: "status"; operator: "equals"; value: string }
  | { field: "subscribed_at"; operator: "after"; value: string };

type SegmentRow = {
  id: string;
  name: string;
  description: string | null;
  rules: SegmentRule[];
  created_at: string;
  audienceSize: number;
  ruleDescriptions: string[];
};

export function CreateSegment({
  newsletterSlug,
  forms,
  initialSegments,
}: {
  newsletterSlug: string;
  forms: FormOption[];
  initialSegments: SegmentRow[];
}) {
  const [segments, setSegments] = useState(initialSegments);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState<"source_list_id" | "status" | "subscribed_at">("source_list_id");
  const [formId, setFormId] = useState(forms[0]?.id ?? "");
  const [statusValue, setStatusValue] = useState("subscribed");
  const [dateValue, setDateValue] = useState("");
  const [message, setMessage] = useState("Build a simple rule-based audience segment.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function buildRules(): SegmentRule[] {
    if (ruleType === "source_list_id" && formId) {
      return [{ field: "source_list_id", operator: "equals", value: formId }];
    }

    if (ruleType === "status") {
      return [{ field: "status", operator: "equals", value: statusValue }];
    }

    if (ruleType === "subscribed_at" && dateValue) {
      return [{ field: "subscribed_at", operator: "after", value: dateValue }];
    }

    return [];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Creating segment...");

    try {
      const response = await fetch("/api/segments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newsletterSlug,
          name,
          description,
          rules: buildRules(),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        segment?: SegmentRow;
      };

      if (!response.ok || !payload.segment) {
        throw new Error(payload.error ?? "Unable to create segment.");
      }

      setSegments((current) => [payload.segment as SegmentRow, ...current]);
      setName("");
      setDescription("");
      setRuleType("source_list_id");
      setFormId(forms[0]?.id ?? "");
      setStatusValue("subscribed");
      setDateValue("");
      setMessage(payload.message ?? "Segment created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create segment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="detail-grid">
      <article className="card">
        <p className="eyebrow">Create segment</p>
        <h2>Define a simple audience rule</h2>
        <p className="helper-copy">
          First pass: create one-rule segments by source form, subscriber status, or signup date.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Segment name</span>
            <input
              onChange={(event) => setName(event.target.value)}
              placeholder="Landing page signups"
              required
              type="text"
              value={name}
            />
          </label>
          <label className="field">
            <span className="field-label">Description</span>
            <textarea
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Who belongs in this audience?"
              value={description}
            />
          </label>
          <label className="field">
            <span className="field-label">Rule type</span>
            <select className="select-input" onChange={(event) => setRuleType(event.target.value as typeof ruleType)} value={ruleType}>
              <option value="source_list_id">Signed up through a form</option>
              <option value="status">Subscriber status</option>
              <option value="subscribed_at">Signed up after a date</option>
            </select>
          </label>

          {ruleType === "source_list_id" ? (
            <label className="field">
              <span className="field-label">Form</span>
              <select className="select-input" onChange={(event) => setFormId(event.target.value)} value={formId}>
                {forms.length === 0 ? <option value="">No forms available</option> : null}
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {ruleType === "status" ? (
            <label className="field">
              <span className="field-label">Status</span>
              <select className="select-input" onChange={(event) => setStatusValue(event.target.value)} value={statusValue}>
                <option value="subscribed">subscribed</option>
                <option value="unsubscribed">unsubscribed</option>
                <option value="bounced">bounced</option>
              </select>
            </label>
          ) : null}

          {ruleType === "subscribed_at" ? (
            <label className="field">
              <span className="field-label">Signed up after</span>
              <input onChange={(event) => setDateValue(event.target.value)} required type="date" value={dateValue} />
            </label>
          ) : null}

          <div className="form-actions">
            <button className="button button-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating..." : "Create segment"}
            </button>
          </div>
          <p className="helper-copy">{message}</p>
        </form>
      </article>

      <article className="card">
        <p className="eyebrow">Saved segments</p>
        <div className="card-list">
          {segments.length === 0 ? (
            <div className="hero-stat">
              <strong>No segments yet</strong>
              <p className="muted-copy">Create one here, then use it as a campaign audience.</p>
            </div>
          ) : (
            segments.map((segment) => (
              <div className="hero-stat" key={segment.id}>
                <strong>{segment.name}</strong>
                <p className="muted-copy">{segment.description || "No description yet."}</p>
                <div className="stack-row">
                  <span className="badge">{segment.audienceSize} subscribers</span>
                </div>
                <div className="rule-list">
                  {segment.ruleDescriptions.map((rule) => (
                    <p className="muted-copy" key={rule}>
                      {rule}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    </div>
  );
}
