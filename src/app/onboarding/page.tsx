import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/newsletters";

import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const context = await getCurrentUserContext();

  if (!context.user) {
    redirect("/login");
  }
  const hasExistingNewsletters = context.newsletters.length > 0;

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">{hasExistingNewsletters ? "New newsletter" : "Onboarding"}</p>
        <h1>{hasExistingNewsletters ? "Create another newsletter" : "Create your first newsletter"}</h1>
        <p className="muted-copy">
          {hasExistingNewsletters
            ? "Add another newsletter workspace for a new audience, publishing rhythm, or billing context."
            : "Your auth account is working. This step creates the product record we&apos;ll use for subscribers, forms, campaigns, and billing."}
        </p>
        <OnboardingForm defaultEmail={context.user.email ?? ""} defaultName={context.profile?.full_name ?? ""} />
      </div>
    </div>
  );
}
