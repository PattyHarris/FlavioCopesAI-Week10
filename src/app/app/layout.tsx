import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUserContext } from "@/lib/newsletters";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentUserContext();

  if (!context.user) {
    redirect("/login");
  }

  const primaryNewsletter = context.newsletters[0];

  if (!primaryNewsletter) {
    redirect("/onboarding");
  }

  return <AppShell primaryNewsletterSlug={primaryNewsletter.slug}>{children}</AppShell>;
}
