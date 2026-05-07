export type NewsletterSummary = {
  id: string;
  name: string;
  subscribers: number;
  forms: number;
  campaigns: number;
  openRate: string;
  revenue: string;
};

export const newsletterSummaries: NewsletterSummary[] = [
  {
    id: "product-led",
    name: "Product Led Dispatch",
    subscribers: 4821,
    forms: 4,
    campaigns: 18,
    openRate: "42.8%",
    revenue: "$612",
  },
  {
    id: "founder-notes",
    name: "Founder Notes",
    subscribers: 1294,
    forms: 2,
    campaigns: 9,
    openRate: "51.3%",
    revenue: "$184",
  },
];

export const recentCampaigns = [
  {
    id: "cmp-1",
    name: "April Product Roundup",
    audience: "All subscribers",
    status: "Sent",
    sentAt: "Yesterday",
  },
  {
    id: "cmp-2",
    name: "Welcome Flow Check-In",
    audience: "Signed up in last 30 days",
    status: "Draft",
    sentAt: "Ready to send",
  },
  {
    id: "cmp-3",
    name: "Churn Risk Winback",
    audience: "Inactive readers",
    status: "Scheduled",
    sentAt: "Tomorrow at 9:00 AM",
  },
];

export const segmentExamples = [
  "Signed up after March 1",
  "From landing page form",
  "Opened at least 3 campaigns",
  "Clicked billing CTA",
];
