import type { Metadata } from "next";

import { CommandPalette } from "@/components/command/command-palette";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "What's new",
  description: "A polished newsletter SaaS for forms, campaigns, segments, billing, and delivery tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <CommandPalette />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
