"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const quickActions = [
  { href: "/app", label: "Open dashboard" },
  { href: "/app/newsletters/product-led/subscribers", label: "View subscribers" },
  { href: "/app/newsletters/product-led/forms", label: "Open signup forms" },
  { href: "/app/newsletters/product-led/campaigns", label: "Write campaign" },
  { href: "/login", label: "Go to sign in" },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="command-overlay" onClick={() => setIsOpen(false)} role="presentation">
      <div
        aria-label="Command palette"
        className="command-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="command-header">
          <span>Command palette</span>
          <kbd>Esc</kbd>
        </div>
        <div className="command-list">
          {quickActions.map((action) => (
            <Link className="command-item" href={action.href} key={action.href} onClick={() => setIsOpen(false)}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
