"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils/cn";

export function AppShell({
  children,
  currentNewsletter,
  newsletters,
  userEmail,
  userName,
}: {
  children: React.ReactNode;
  currentNewsletter: {
    name: string;
    slug: string;
  };
  newsletters: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  userEmail: string;
  userName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const matchedNewsletterSlug = pathname.match(/\/app\/newsletters\/([^/]+)/)?.[1];
  const activeNewsletter =
    newsletters.find((newsletter) => newsletter.slug === matchedNewsletterSlug) ?? currentNewsletter;
  const navigation = [
    { href: "/app", label: "Overview" },
    { href: `/app/newsletters/${activeNewsletter.slug}/subscribers`, label: "Subscribers" },
    { href: `/app/newsletters/${activeNewsletter.slug}/forms`, label: "Forms" },
    { href: `/app/newsletters/${activeNewsletter.slug}/segments`, label: "Segments" },
    { href: `/app/newsletters/${activeNewsletter.slug}/campaigns`, label: "Campaigns" },
    { href: `/app/newsletters/${activeNewsletter.slug}/settings`, label: "Settings" },
  ];

  function getPageTitle() {
    if (pathname === "/app") {
      return "Overview";
    }

    if (pathname.includes("/subscribers")) {
      return "Subscribers";
    }

    if (pathname.includes("/forms")) {
      return "Forms";
    }

    if (pathname.includes("/segments")) {
      return "Segments";
    }

    if (pathname.includes("/campaigns/")) {
      return "Campaign report";
    }

    if (pathname.includes("/campaigns")) {
      return "Campaigns";
    }

    if (pathname.includes("/settings")) {
      return "Settings";
    }

    return "Workspace";
  }

  const pageTitle = getPageTitle();

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to sign out.");
      }

      window.location.href = "/login";
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to sign out.");
      setIsSigningOut(false);
    }
  }

  function handleNewsletterChange(nextSlug: string) {
    router.push(`/app/newsletters/${nextSlug}/settings`);
  }

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", isMenuOpen && "sidebar-open")}>
        <div className="sidebar-brand">
          <Link href="/">What&apos;s new</Link>
          <button
            aria-label="Close navigation"
            className="ghost-button mobile-only"
            onClick={() => setIsMenuOpen(false)}
            type="button"
          >
            Close
          </button>
        </div>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              className={cn("sidebar-link", pathname === item.href && "sidebar-link-active")}
              href={item.href}
              key={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>Everything for one newsletter workspace, from forms through billing.</p>
          <button className="ghost-button" disabled={isSigningOut} onClick={handleSignOut} type="button">
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="ghost-button mobile-only" onClick={() => setIsMenuOpen(true)} type="button">
              Menu
            </button>
            <div className="topbar-copy">
              <p className="eyebrow">{activeNewsletter.name}</p>
              <h1>{pageTitle}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-meta">
              <div className="icon-chip-row">
                <Link
                  aria-label={`Current newsletter ${activeNewsletter.name}`}
                  className="icon-chip"
                  data-tooltip={`${activeNewsletter.name} (${activeNewsletter.slug})`}
                  href={`/app/newsletters/${activeNewsletter.slug}/settings`}
                >
                  N
                </Link>
                <span
                  aria-label={`Signed in as ${userEmail}`}
                  className="icon-chip"
                  data-tooltip={userName ? `${userName} (${userEmail})` : userEmail}
                >
                  @
                </span>
                {newsletters.length > 1 ? (
                  <span
                    aria-label={`${newsletters.length} newsletters available`}
                    className="icon-chip"
                    data-tooltip={newsletters.map((newsletter) => newsletter.name).join(" | ")}
                  >
                    {newsletters.length}
                  </span>
                ) : null}
              </div>
              <label className="newsletter-switcher">
                <span className="sr-only">Choose newsletter</span>
                <select
                  className="select-input compact-select"
                  onChange={(event) => handleNewsletterChange(event.target.value)}
                  value={activeNewsletter.slug}
                >
                  {newsletters.map((newsletter) => (
                    <option key={newsletter.id} value={newsletter.slug}>
                      {newsletter.name}
                    </option>
                  ))}
                </select>
              </label>
              <Link className="button button-secondary" href="/onboarding">
                New newsletter
              </Link>
              <Link className="button button-secondary" href={`/app/newsletters/${activeNewsletter.slug}/settings`}>
                Edit newsletter
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="page-frame">{children}</main>
      </div>
    </div>
  );
}
