"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

function humanizeOtpError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("rate limit") || lowerMessage.includes("security purposes")) {
    return "Supabase is rate-limiting OTP requests right now. Wait about a minute, then try again.";
  }

  if (lowerMessage.includes("60 seconds") || lowerMessage.includes("wait")) {
    return "A code was requested recently for this email. Wait about a minute before sending another OTP.";
  }

  return message;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Enter your email and request a one-time code.");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Requesting OTP...");

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setMessage(humanizeOtpError(payload.error ?? "Unable to request an OTP right now."));
        return;
      }

      setCooldownSeconds(60);
      setMessage(payload.message ?? "OTP requested. Check your inbox, then move to verify.");
    } catch {
      setMessage("The app could not reach the OTP endpoint. Check that the dev server is still running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Access</p>
        <h1>Sign in with email OTP</h1>
        <p className="muted-copy">
          This follows the Supabase pattern you used in `Week8`, but adapted for a Next.js App Router product shell.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email address</span>
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <div className="form-actions">
            <button className="button button-primary" disabled={isSubmitting || cooldownSeconds > 0} type="submit">
              {isSubmitting ? "Sending..." : cooldownSeconds > 0 ? `Retry in ${cooldownSeconds}s` : "Send OTP"}
            </button>
            <Link className="button button-secondary" href="/verify">
              Verify code
            </Link>
          </div>
        </form>
        <p className="helper-copy">{message}</p>
      </div>
    </div>
  );
}
