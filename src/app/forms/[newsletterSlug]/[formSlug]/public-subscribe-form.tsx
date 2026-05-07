"use client";

import { FormEvent, useState } from "react";

export function PublicSubscribeForm({
  newsletterSlug,
  formSlug,
  submitLabel,
}: {
  newsletterSlug: string;
  formSlug: string;
  submitLabel: string;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("Join the newsletter.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Submitting...");

    try {
      const response = await fetch(`/api/public/forms/${newsletterSlug}/${formSlug}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
        }),
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to subscribe.");
      }

      setEmail("");
      setFirstName("");
      setLastName("");
      setMessage(payload.message ?? "You are subscribed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to subscribe.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="helper-copy">
        Optional: first and last name. Required: email address. The second field is for last name.
      </p>
      <label className="field">
        <span className="field-label">First name</span>
        <input
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Ada"
          type="text"
          value={firstName}
        />
      </label>
      <label className="field">
        <span className="field-label">Last name</span>
        <input
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Lovelace"
          type="text"
          value={lastName}
        />
      </label>
      <label className="field">
        <span className="field-label">Email address</span>
        <input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="reader@example.com"
          required
          type="email"
          value={email}
        />
      </label>
      <div className="form-actions">
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      </div>
      <p className="helper-copy">{message}</p>
    </form>
  );
}
