import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/newsletters";

import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const context = await getCurrentUserContext();

  if (!context.user) {
    redirect("/login");
  }

  if (context.newsletters.length > 0) {
    redirect("/app");
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Onboarding</p>
        <h1>Create your first newsletter</h1>
        <p className="muted-copy">
          Your auth account is working. This step creates the product record we&apos;ll use for subscribers, forms,
          campaigns, and billing.
        </p>
        <OnboardingForm defaultEmail={context.user.email ?? ""} defaultName={context.profile?.full_name ?? ""} />
      </div>
    </div>
  );
}
