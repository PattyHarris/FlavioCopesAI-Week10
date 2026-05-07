import { Resend } from "resend";

import { env } from "@/lib/config/env";

export function createResendClient() {
  if (!env.resendApiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  return new Resend(env.resendApiKey);
}

export function getResendFromEmail() {
  if (!env.resendAudienceFromEmail) {
    throw new Error("Missing RESEND_AUDIENCE_FROM_EMAIL.");
  }

  return env.resendAudienceFromEmail;
}
