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
        <div className="identity-card">
          <p className="eyebrow">Signed in as</p>
          <strong>{userName || userEmail}</strong>
          <p className="muted-copy">{userEmail}</p>
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
        <div className="sidebar-section">
          <p className="eyebrow">Current newsletter</p>
          <strong>{currentNewsletter.name}</strong>
          <p className="muted-copy">{currentNewsletter.slug}</p>
        </div>
        <div className="sidebar-section">
          <p className="eyebrow">Your newsletters</p>
          <div className="newsletter-list">
            {newsletters.map((newsletter) => (
              <Link
                className={cn(
                  "newsletter-link",
                  newsletter.slug === currentNewsletter.slug && "newsletter-link-active",
                )}
                href={`/app/newsletters/${newsletter.slug}/settings`}
                key={newsletter.id}
                onClick={() => setIsMenuOpen(false)}
              >
                <strong>{newsletter.name}</strong>
                <span>{newsletter.slug}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="sidebar-footer">
          <p>Usage billing, forms, analytics, and delivery live together in one product shell.</p>
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
            <div className="identity-inline">
              <strong>{currentNewsletter.name}</strong>
              <span>{userEmail}</span>
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
