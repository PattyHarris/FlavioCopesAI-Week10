"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils/cn";

export function AppShell({
  children,
  primaryNewsletterSlug,
}: {
  children: React.ReactNode;
  primaryNewsletterSlug: string;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigation = [
    { href: "/app", label: "Overview" },
    { href: `/app/newsletters/${primaryNewsletterSlug}/subscribers`, label: "Subscribers" },
    { href: `/app/newsletters/${primaryNewsletterSlug}/forms`, label: "Forms" },
    { href: `/app/newsletters/${primaryNewsletterSlug}/segments`, label: "Segments" },
    { href: `/app/newsletters/${primaryNewsletterSlug}/campaigns`, label: "Campaigns" },
    { href: `/app/newsletters/${primaryNewsletterSlug}/settings`, label: "Settings" },
  ];

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
          <p>Usage billing, forms, analytics, and delivery live together in one product shell.</p>
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
            <div className="command-hint">Press Cmd/Ctrl + K</div>
            <ThemeToggle />
          </div>
        </header>
        <main className="page-frame">{children}</main>
      </div>
    </div>
  );
}
