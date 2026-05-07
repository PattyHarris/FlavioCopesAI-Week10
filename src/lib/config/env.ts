const requiredPublicKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendAudienceFromEmail: process.env.RESEND_AUDIENCE_FROM_EMAIL ?? "",
  resendReplyTo: process.env.RESEND_REPLY_TO ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};

export const hasSupabaseBrowserEnv = requiredPublicKeys.every((key) => Boolean(process.env[key]));
