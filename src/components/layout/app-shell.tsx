"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigation = [
    { href: "/app", label: "Overview" },
    { href: `/app/newsletters/${currentNewsletter.slug}/subscribers`, label: "Subscribers" },
    { href: `/app/newsletters/${currentNewsletter.slug}/forms`, label: "Forms" },
    { href: `/app/newsletters/${currentNewsletter.slug}/segments`, label: "Segments" },
    { href: `/app/newsletters/${currentNewsletter.slug}/campaigns`, label: "Campaigns" },
    { href: `/app/newsletters/${currentNewsletter.slug}/settings`, label: "Settings" },
  ];

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
            <div>
              <p className="eyebrow">Workspace</p>
              <h1>Newsletter OS</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="workspace-context">
              <div className="context-card">
                <span className="context-label">Current newsletter</span>
                <strong>{currentNewsletter.name}</strong>
                <span>{currentNewsletter.slug}</span>
              </div>
              <div className="context-card context-card-account">
                <span className="context-label">Signed in as</span>
                <strong>{userName || userEmail}</strong>
                <span>{userEmail}</span>
              </div>
              <div className="context-switcher">
                {newsletters.map((newsletter) => (
                  <Link
                    className={cn(
                      "context-chip",
                      newsletter.slug === currentNewsletter.slug && "context-chip-active",
                    )}
                    href={`/app/newsletters/${newsletter.slug}/settings`}
                    key={newsletter.id}
                  >
                    {newsletter.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="command-hint">Press Cmd/Ctrl + K</div>
            <ThemeToggle />
          </div>
        </header>
        <main className="page-frame">{children}</main>
      </div>
    </div>
  );
}
