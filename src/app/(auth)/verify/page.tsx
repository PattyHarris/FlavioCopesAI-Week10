"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("Enter the OTP you receive by email.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, token }),
    });

    const payload = (await response.json()) as { message?: string; error?: string };
    const nextMessage = payload.message ?? payload.error ?? "Unable to verify OTP right now.";
    setMessage(nextMessage);

    if (response.ok) {
      router.push("/app");
      router.refresh();
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Verification</p>
        <h1>Finish sign-in</h1>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email address</span>
            <input onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label className="field">
            <span>One-time code</span>
            <input onChange={(event) => setToken(event.target.value)} required type="text" value={token} />
          </label>
          <div className="form-actions">
            <button className="button button-primary" type="submit">
              Verify and create session
            </button>
          </div>
        </form>
        <p className="muted-copy">{message}</p>
      </div>
    </div>
  );
}
