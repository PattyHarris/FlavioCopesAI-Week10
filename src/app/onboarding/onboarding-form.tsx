"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm({
  defaultEmail,
  defaultName,
}: {
  defaultEmail: string;
  defaultName: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultName);
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterDescription, setNewsletterDescription] = useState("");
  const [message, setMessage] = useState(`Signed in as ${defaultEmail}`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Creating your workspace...");

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          newsletterName,
          newsletterDescription,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create your newsletter.");
      }

      setMessage(payload.message ?? "Your newsletter is ready.");
      router.push(payload.redirectTo ?? "/app");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create your newsletter.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="field">
        <span>Your name</span>
        <input
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Patty Harris"
          required
          type="text"
          value={fullName}
        />
      </label>
      <label className="field">
        <span>Newsletter name</span>
        <input
          onChange={(event) => setNewsletterName(event.target.value)}
          placeholder="What's new Weekly"
          required
          type="text"
          value={newsletterName}
        />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea
          onChange={(event) => setNewsletterDescription(event.target.value)}
          placeholder="A short description for your newsletter homepage and forms."
          value={newsletterDescription}
        />
      </label>
      <div className="form-actions">
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating..." : "Create newsletter"}
        </button>
      </div>
      <p className="muted-copy">{message}</p>
    </form>
  );
}
