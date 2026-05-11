"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ExistingForm = {
  id: string;
  name: string;
  slug: string;
  heading: string;
  description: string | null;
  submit_button_label: string;
  background_color: string | null;
  text_color: string | null;
  created_at?: string;
};

export function CreateForm({
  newsletterSlug,
  initialForms,
}: {
  newsletterSlug: string;
  initialForms: ExistingForm[];
}) {
  const [forms, setForms] = useState(initialForms);
  const [name, setName] = useState("");
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [submitButtonLabel, setSubmitButtonLabel] = useState("Subscribe");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [textColor, setTextColor] = useState("#212529");
  const [message, setMessage] = useState("Create a hosted form, then open its public URL locally.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Creating form...");

    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newsletterSlug,
          name,
          heading,
          description,
          submitButtonLabel,
          backgroundColor,
          textColor,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        form?: ExistingForm;
        publicUrl?: string;
      };

      if (!response.ok || !payload.form) {
        throw new Error(payload.error ?? "Unable to create form.");
      }

      setForms((current) => [payload.form as ExistingForm, ...current]);
      setName("");
      setHeading("");
      setDescription("");
      setSubmitButtonLabel("Subscribe");
      setBackgroundColor("#FFFFFF");
      setTextColor("#212529");
      setMessage(`${payload.message ?? "Signup form created."} Public URL: ${payload.publicUrl}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create form.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="detail-grid">
      <article className="card">
        <p className="eyebrow">Create form</p>
        <h2>Build a hosted signup entry point</h2>
        <div className="inline-note">Each form feeds the same newsletter audience while preserving source attribution.</div>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Form name</span>
            <input onChange={(event) => setName(event.target.value)} required type="text" value={name} />
          </label>
          <label className="field">
            <span>Heading</span>
            <input onChange={(event) => setHeading(event.target.value)} required type="text" value={heading} />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea onChange={(event) => setDescription(event.target.value)} value={description} />
          </label>
          <label className="field">
            <span>Submit button label</span>
            <input
              onChange={(event) => setSubmitButtonLabel(event.target.value)}
              required
              type="text"
              value={submitButtonLabel}
            />
          </label>
          <div className="color-row">
            <label className="field">
              <span>Background color</span>
              <input onChange={(event) => setBackgroundColor(event.target.value)} type="color" value={backgroundColor} />
            </label>
            <label className="field">
              <span>Text color</span>
              <input onChange={(event) => setTextColor(event.target.value)} type="color" value={textColor} />
            </label>
          </div>
          <div className="form-actions">
            <button className="button button-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating..." : "Create newsletter form"}
            </button>
          </div>
          <p className="form-status">{message}</p>
        </form>
      </article>

      <article className="card">
        <p className="eyebrow">Hosted forms</p>
        <div className="card-list">
          {forms.length === 0 ? (
            <div className="hero-stat">
              <strong>No forms yet</strong>
              <p className="muted-copy">Create one to publish your first hosted signup page.</p>
            </div>
          ) : (
            forms.map((form) => (
              <div className="hero-stat" key={form.id}>
                <div className="item-header">
                  <strong>{form.name}</strong>
                  <span className="muted-copy">{form.heading}</span>
                </div>
                {form.description ? <p className="muted-copy">{form.description}</p> : null}
                <div className="form-actions">
                  <Link className="button button-secondary" href={`/forms/${newsletterSlug}/${form.slug}`} target="_blank">
                    Open public page
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    </div>
  );
}
