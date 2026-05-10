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

  return (
    <AppShell
      currentNewsletter={primaryNewsletter}
      newsletters={context.newsletters}
      userEmail={context.user.email ?? "Unknown email"}
      userName={context.profile?.full_name ?? null}
    >
      {children}
    </AppShell>
  );
}
