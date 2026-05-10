import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createResendClient, getResendFromEmail } from "@/lib/email/resend";
import { slugify } from "@/lib/utils/slugify";

export type SegmentRule =
  | { field: "source_list_id"; operator: "equals"; value: string }
  | { field: "status"; operator: "equals"; value: string }
  | { field: "subscribed_at"; operator: "after" | "before"; value: string };

export type OnboardingInput = {
  fullName: string;
  newsletterName: string;
  newsletterDescription: string;
};

const RESEND_MAX_REQUESTS_PER_SECOND = 4;
const RESEND_BATCH_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function ensureNewsletterSubscriptionRow(newsletterId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: existingSubscription, error: existingSubscriptionError } = await supabase
    .from("newsletter_subscriptions")
    .select("id")
    .eq("newsletter_id", newsletterId)
    .maybeSingle();

  if (existingSubscriptionError) {
    throw new Error(existingSubscriptionError.message);
  }

  if (existingSubscription) {
    return existingSubscription;
  }

  const { data: freePlan, error: freePlanError } = await supabase
    .from("billing_plans")
    .select("id")
    .eq("name", "Free")
    .maybeSingle();

  if (freePlanError) {
    throw new Error(freePlanError.message);
  }

  if (!freePlan) {
    throw new Error("Free billing plan not found. Run the billing seed migration first.");
  }

  const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

  const { data: createdSubscription, error: createError } = await supabase
    .from("newsletter_subscriptions")
    .insert({
      newsletter_id: newsletterId,
      billing_plan_id: freePlan.id,
      status: "active",
      current_period_start: periodStart,
      current_period_end: periodEnd,
    })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return createdSubscription;
}

export async function getCurrentUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    return {
      user: null,
      profile: null,
      newsletters: [],
    };
  }

  const [{ data: profile, error: profileError }, { data: newsletters, error: newslettersError }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("newsletters")
      .select("id, name, slug, description, created_at")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (newslettersError) {
    throw new Error(newslettersError.message);
  }

  return {
    user,
    profile,
    newsletters: newsletters ?? [],
  };
}

export async function createNewsletterForCurrentUser(input: OnboardingInput) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error("You must be signed in to create a newsletter.");
  }

  const profileUpdates = {
    id: user.id,
    email: user.email ?? "",
    full_name: input.fullName.trim() || null,
  };

  const { error: profileError } = await supabase.from("profiles").upsert(profileUpdates, {
    onConflict: "id",
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const baseSlug = slugify(input.newsletterName);
  const fallbackSlug = `newsletter-${user.id.slice(0, 8)}`;
  const candidateSlug = baseSlug || fallbackSlug;

  const { data: existingSlug, error: slugLookupError } = await supabase
    .from("newsletters")
    .select("slug")
    .ilike("slug", `${candidateSlug}%`);

  if (slugLookupError) {
    throw new Error(slugLookupError.message);
  }

  const nextSlug =
    existingSlug && existingSlug.length > 0 ? `${candidateSlug}-${existingSlug.length + 1}` : candidateSlug;

  const { data: newsletter, error: newsletterError } = await supabase
    .from("newsletters")
    .insert({
      owner_user_id: user.id,
      name: input.newsletterName.trim(),
      slug: nextSlug,
      description: input.newsletterDescription.trim() || null,
      sender_name: input.fullName.trim() || null,
      sender_email: user.email ?? null,
    })
    .select("id, name, slug")
    .single();

  if (newsletterError) {
    throw new Error(newsletterError.message);
  }

  await ensureNewsletterSubscriptionRow(newsletter.id);

  return newsletter;
}

export async function getDashboardDataForCurrentUser() {
  const context = await getCurrentUserContext();

  if (!context.user) {
    return {
      ...context,
      totalSubscribers: 0,
      totalForms: 0,
      totalCampaigns: 0,
      recentCampaigns: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  const newsletterIds = context.newsletters.map((newsletter) => newsletter.id);

  if (newsletterIds.length === 0) {
    return {
      ...context,
      totalSubscribers: 0,
      totalForms: 0,
      totalCampaigns: 0,
      recentCampaigns: [],
    };
  }

  const [
    { count: subscriberCount, error: subscriberError },
    { count: formCount, error: formError },
    { count: campaignCount, error: campaignCountError },
    { data: campaigns, error: campaignsError },
  ] = await Promise.all([
    supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .in("newsletter_id", newsletterIds),
    supabase
      .from("signup_forms")
      .select("*", { count: "exact", head: true })
      .in("newsletter_id", newsletterIds),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .in("newsletter_id", newsletterIds),
    supabase
      .from("campaigns")
      .select("id, name, status, sent_at, created_at, newsletter_id")
      .in("newsletter_id", newsletterIds)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (subscriberError) {
    throw new Error(subscriberError.message);
  }

  if (formError) {
    throw new Error(formError.message);
  }

  if (campaignCountError) {
    throw new Error(campaignCountError.message);
  }

  if (campaignsError) {
    throw new Error(campaignsError.message);
  }

  const newsletterNameById = new Map(context.newsletters.map((newsletter) => [newsletter.id, newsletter.name]));

  return {
    ...context,
    totalSubscribers: subscriberCount ?? 0,
    totalForms: formCount ?? 0,
    totalCampaigns: campaignCount ?? 0,
    recentCampaigns: (campaigns ?? []).map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      sentAt: campaign.sent_at ?? campaign.created_at,
      newsletterName: newsletterNameById.get(campaign.newsletter_id) ?? "Newsletter",
    })),
  };
}

export async function getOwnedNewsletterBySlug(slug: string) {
  const context = await getCurrentUserContext();

  if (!context.user) {
    throw new Error("You must be signed in.");
  }

  const newsletter = context.newsletters.find((item) => item.slug === slug);

  if (!newsletter) {
    throw new Error("Newsletter not found.");
  }

  return {
    context,
    newsletter,
  };
}

export async function getFormsForOwnedNewsletter(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(slug);

  const { data: forms, error } = await supabase
    .from("signup_forms")
    .select("id, name, slug, heading, description, submit_button_label, background_color, text_color, created_at")
    .eq("newsletter_id", newsletter.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    newsletter,
    forms: forms ?? [],
  };
}

export async function createSignupFormForCurrentUser(input: {
  newsletterSlug: string;
  name: string;
  heading: string;
  description: string;
  submitButtonLabel: string;
  backgroundColor: string;
  textColor: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(input.newsletterSlug);

  const baseSlug = slugify(input.name);
  const fallbackSlug = `form-${newsletter.id.slice(0, 8)}`;
  const candidateSlug = baseSlug || fallbackSlug;

  const { data: existingForms, error: existingFormsError } = await supabase
    .from("signup_forms")
    .select("slug")
    .eq("newsletter_id", newsletter.id)
    .ilike("slug", `${candidateSlug}%`);

  if (existingFormsError) {
    throw new Error(existingFormsError.message);
  }

  const nextSlug =
    existingForms && existingForms.length > 0 ? `${candidateSlug}-${existingForms.length + 1}` : candidateSlug;

  const { data: form, error } = await supabase
    .from("signup_forms")
    .insert({
      newsletter_id: newsletter.id,
      name: input.name.trim(),
      slug: nextSlug,
      heading: input.heading.trim(),
      description: input.description.trim() || null,
      submit_button_label: input.submitButtonLabel.trim() || "Subscribe",
      background_color: input.backgroundColor.trim() || "#FFFFFF",
      text_color: input.textColor.trim() || "#212529",
    })
    .select("id, name, slug, heading, description, submit_button_label, background_color, text_color")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    newsletter,
    form,
  };
}

export async function getSubscribersForOwnedNewsletter(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(slug);

  const [{ data: subscribers, error: subscribersError }, { data: forms, error: formsError }] = await Promise.all([
    supabase
      .from("subscribers")
      .select("id, email, first_name, last_name, status, subscribed_at, source_list_id, created_at")
      .eq("newsletter_id", newsletter.id)
      .order("subscribed_at", { ascending: false }),
    supabase
      .from("signup_forms")
      .select("id, name, slug")
      .eq("newsletter_id", newsletter.id),
  ]);

  if (subscribersError) {
    throw new Error(subscribersError.message);
  }

  if (formsError) {
    throw new Error(formsError.message);
  }

  const formNameById = new Map((forms ?? []).map((form) => [form.id, form.name]));

  return {
    newsletter,
    subscribers:
      (subscribers ?? []).map((subscriber) => ({
        ...subscriber,
        sourceFormName: subscriber.source_list_id
          ? formNameById.get(subscriber.source_list_id) ?? "Unknown form"
          : "Direct import",
      })) ?? [],
  };
}

export async function getCampaignsForOwnedNewsletter(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(slug);

  const [
    { data: campaigns, error: campaignsError },
    { data: segments, error: segmentsError },
    { count: subscriberCount, error: subscriberCountError },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, subject, preview_text, status, sent_at, created_at, segment_id")
      .eq("newsletter_id", newsletter.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("segments")
      .select("id, name, description")
      .eq("newsletter_id", newsletter.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("newsletter_id", newsletter.id),
  ]);

  if (campaignsError) {
    throw new Error(campaignsError.message);
  }

  if (segmentsError) {
    throw new Error(segmentsError.message);
  }

  if (subscriberCountError) {
    throw new Error(subscriberCountError.message);
  }

  const segmentNameById = new Map((segments ?? []).map((segment) => [segment.id, segment.name]));
  const deliveryCountByCampaignId = new Map<string, number>();
  const deliveryStatsByCampaignId = new Map<
    string,
    {
      total: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      complained: number;
      failed: number;
    }
  >();
  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);

  if (campaignIds.length > 0) {
    const { data: deliveries, error: deliveriesError } = await supabase
      .from("email_deliveries")
      .select("campaign_id, status, delivered_at, opened_at, clicked_at, bounced_at")
      .in("campaign_id", campaignIds);

    if (deliveriesError) {
      throw new Error(deliveriesError.message);
    }

    (deliveries ?? []).forEach((delivery) => {
      deliveryCountByCampaignId.set(
        delivery.campaign_id,
        (deliveryCountByCampaignId.get(delivery.campaign_id) ?? 0) + 1,
      );

      const nextStats = deliveryStatsByCampaignId.get(delivery.campaign_id) ?? {
        total: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        failed: 0,
      };

      nextStats.total += 1;

      if (delivery.delivered_at || delivery.status === "delivered") {
        nextStats.delivered += 1;
      }

      if (delivery.opened_at || delivery.status === "opened") {
        nextStats.opened += 1;
      }

      if (delivery.clicked_at || delivery.status === "clicked") {
        nextStats.clicked += 1;
      }

      if (delivery.bounced_at || delivery.status === "bounced") {
        nextStats.bounced += 1;
      }

      if (delivery.status === "complained") {
        nextStats.complained += 1;
      }

      if (delivery.status === "failed") {
        nextStats.failed += 1;
      }

      deliveryStatsByCampaignId.set(delivery.campaign_id, nextStats);
    });
  }

  return {
    newsletter,
    segments: segments ?? [],
    subscriberCount: subscriberCount ?? 0,
    campaigns:
      (campaigns ?? []).map((campaign) => ({
        ...campaign,
        audienceLabel: campaign.segment_id
          ? segmentNameById.get(campaign.segment_id) ?? "Specific segment"
          : "All subscribers",
        queuedRecipients: deliveryCountByCampaignId.get(campaign.id) ?? 0,
        deliveryStats: deliveryStatsByCampaignId.get(campaign.id) ?? {
          total: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          complained: 0,
          failed: 0,
        },
      })) ?? [],
  };
}

export async function getCampaignReportForOwnedNewsletter(slug: string, campaignId: string) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(slug);

  const [{ data: campaign, error: campaignError }, { data: forms, error: formsError }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, subject, preview_text, body_html, status, sent_at, created_at, segment_id")
      .eq("newsletter_id", newsletter.id)
      .eq("id", campaignId)
      .maybeSingle(),
    supabase.from("signup_forms").select("id, name").eq("newsletter_id", newsletter.id),
  ]);

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (formsError) {
    throw new Error(formsError.message);
  }

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const [{ data: deliveries, error: deliveriesError }, { data: segment, error: segmentError }] = await Promise.all([
    supabase
      .from("email_deliveries")
      .select(
        `
          id,
          campaign_id,
          subscriber_id,
          status,
          delivered_at,
          opened_at,
          clicked_at,
          bounced_at,
          created_at,
          subscribers!inner (
            id,
            email,
            first_name,
            last_name,
            status,
            subscribed_at,
            source_list_id
          )
        `,
      )
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false }),
    campaign.segment_id
      ? supabase
          .from("segments")
          .select("id, name, description")
          .eq("newsletter_id", newsletter.id)
          .eq("id", campaign.segment_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (deliveriesError) {
    throw new Error(deliveriesError.message);
  }

  if (segmentError) {
    throw new Error(segmentError.message);
  }

  const formNameById = new Map((forms ?? []).map((form) => [form.id, form.name]));
  const statusCounts = new Map<string, number>();
  const summary = {
    total: 0,
    queued: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
    failed: 0,
  };

  const normalizedDeliveries = (deliveries ?? []).map((delivery) => {
    const subscriber = Array.isArray(delivery.subscribers) ? delivery.subscribers[0] : delivery.subscribers;
    const fullName = [subscriber?.first_name, subscriber?.last_name].filter(Boolean).join(" ").trim();

    summary.total += 1;
    statusCounts.set(delivery.status, (statusCounts.get(delivery.status) ?? 0) + 1);

    if (delivery.status === "queued") {
      summary.queued += 1;
    }

    if (delivery.status === "sent") {
      summary.sent += 1;
    }

    if (delivery.delivered_at || ["delivered", "opened", "clicked"].includes(delivery.status)) {
      summary.delivered += 1;
    }

    if (delivery.opened_at || ["opened", "clicked"].includes(delivery.status)) {
      summary.opened += 1;
    }

    if (delivery.clicked_at || delivery.status === "clicked") {
      summary.clicked += 1;
    }

    if (delivery.bounced_at || delivery.status === "bounced") {
      summary.bounced += 1;
    }

    if (delivery.status === "complained") {
      summary.complained += 1;
    }

    if (delivery.status === "failed") {
      summary.failed += 1;
    }

    return {
      id: delivery.id,
      status: delivery.status,
      created_at: delivery.created_at,
      delivered_at: delivery.delivered_at,
      opened_at: delivery.opened_at,
      clicked_at: delivery.clicked_at,
      bounced_at: delivery.bounced_at,
      subscriber: {
        id: subscriber?.id ?? delivery.subscriber_id,
        email: subscriber?.email ?? "Unknown email",
        fullName: fullName || null,
        status: subscriber?.status ?? "unknown",
        subscribedAt: subscriber?.subscribed_at ?? null,
        sourceFormName: subscriber?.source_list_id
          ? formNameById.get(subscriber.source_list_id) ?? "Unknown form"
          : "Direct import",
      },
    };
  });

  const rate = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0);

  return {
    newsletter,
    campaign: {
      ...campaign,
      audienceLabel: segment?.name ?? "All subscribers",
      segmentName: segment?.name ?? null,
      segmentDescription: segment?.description ?? null,
    },
    deliveries: normalizedDeliveries,
    statusCounts: {
      all: normalizedDeliveries.length,
      queued: statusCounts.get("queued") ?? 0,
      sent: statusCounts.get("sent") ?? 0,
      delivered: statusCounts.get("delivered") ?? 0,
      opened: statusCounts.get("opened") ?? 0,
      clicked: statusCounts.get("clicked") ?? 0,
      bounced: statusCounts.get("bounced") ?? 0,
      complained: statusCounts.get("complained") ?? 0,
      failed: statusCounts.get("failed") ?? 0,
    },
    summary: {
      ...summary,
      deliveryRate: rate(summary.delivered, summary.total),
      openRate: rate(summary.opened, summary.total),
      clickRate: rate(summary.clicked, summary.total),
      bounceRate: rate(summary.bounced, summary.total),
    },
  };
}

export async function createCampaignDraftForCurrentUser(input: {
  newsletterSlug: string;
  name: string;
  subject: string;
  previewText: string;
  bodyHtml: string;
  segmentId?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(input.newsletterSlug);

  let segmentId: string | null = null;

  if (input.segmentId) {
    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("id")
      .eq("newsletter_id", newsletter.id)
      .eq("id", input.segmentId)
      .maybeSingle();

    if (segmentError) {
      throw new Error(segmentError.message);
    }

    if (!segment) {
      throw new Error("Selected segment was not found for this newsletter.");
    }

    segmentId = segment.id;
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      newsletter_id: newsletter.id,
      segment_id: segmentId,
      name: input.name.trim(),
      subject: input.subject.trim(),
      preview_text: input.previewText.trim() || null,
      body_html: input.bodyHtml.trim(),
      status: "draft",
    })
    .select("id, name, subject, preview_text, status, sent_at, created_at, segment_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    newsletter,
    campaign: {
      ...campaign,
      audienceLabel: segmentId ? "Specific segment" : "All subscribers",
      queuedRecipients: 0,
      deliveryStats: {
        total: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        failed: 0,
      },
    },
  };
}

function applySegmentRules<T extends {
  source_list_id: string | null;
  status: string;
  subscribed_at: string;
}>(
  subscribers: T[],
  rules: SegmentRule[],
) {
  return subscribers.filter((subscriber) =>
    rules.every((rule) => {
      if (rule.field === "source_list_id" && rule.operator === "equals") {
        return subscriber.source_list_id === rule.value;
      }

      if (rule.field === "status" && rule.operator === "equals") {
        return subscriber.status === rule.value;
      }

      if (rule.field === "subscribed_at" && rule.operator === "after") {
        return new Date(subscriber.subscribed_at).getTime() > new Date(rule.value).getTime();
      }

      if (rule.field === "subscribed_at" && rule.operator === "before") {
        return new Date(subscriber.subscribed_at).getTime() < new Date(rule.value).getTime();
      }

      return true;
    }),
  );
}

function describeSegmentRule(
  rule: SegmentRule,
  formNameById: Map<string, string>,
) {
  if (rule.field === "source_list_id") {
    return `Source is ${formNameById.get(rule.value) ?? "selected form"}`;
  }

  if (rule.field === "status") {
    return `Status is ${rule.value}`;
  }

  if (rule.field === "subscribed_at") {
    return rule.operator === "before" ? `Signed up before ${rule.value}` : `Signed up after ${rule.value}`;
  }

  return "Custom rule";
}

export async function getSegmentsForOwnedNewsletter(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(slug);

  const [
    { data: segments, error: segmentsError },
    { data: forms, error: formsError },
    { data: subscribers, error: subscribersError },
  ] = await Promise.all([
    supabase
      .from("segments")
      .select("id, name, description, rules, created_at")
      .eq("newsletter_id", newsletter.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("signup_forms")
      .select("id, name, slug")
      .eq("newsletter_id", newsletter.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscribers")
      .select("id, source_list_id, status, subscribed_at")
      .eq("newsletter_id", newsletter.id),
  ]);

  if (segmentsError) {
    throw new Error(segmentsError.message);
  }

  if (formsError) {
    throw new Error(formsError.message);
  }

  if (subscribersError) {
    throw new Error(subscribersError.message);
  }

  const formNameById = new Map((forms ?? []).map((form) => [form.id, form.name]));
  const subscriberRows = subscribers ?? [];

  return {
    newsletter,
    forms: forms ?? [],
    segments: (segments ?? []).map((segment) => {
      const rules = Array.isArray(segment.rules) ? (segment.rules as SegmentRule[]) : [];
      const matchingSubscribers = applySegmentRules(subscriberRows, rules);

      return {
        ...segment,
        rules,
        audienceSize: matchingSubscribers.length,
        ruleDescriptions: rules.map((rule) => describeSegmentRule(rule, formNameById)),
      };
    }),
  };
}

export async function createSegmentForCurrentUser(input: {
  newsletterSlug: string;
  name: string;
  description: string;
  rules: SegmentRule[];
}) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(input.newsletterSlug);

  const { data: formRows, error: formsError } = await supabase
    .from("signup_forms")
    .select("id, name")
    .eq("newsletter_id", newsletter.id);

  if (formsError) {
    throw new Error(formsError.message);
  }

  if (input.rules.length === 0) {
    throw new Error("At least one rule is required.");
  }

  for (const rule of input.rules) {
    if (rule.field === "source_list_id") {
      const matchesForm = (formRows ?? []).some((form) => form.id === rule.value);
      if (!matchesForm) {
        throw new Error("Selected form rule does not belong to this newsletter.");
      }
    }
  }

  const { data: segment, error } = await supabase
    .from("segments")
    .insert({
      newsletter_id: newsletter.id,
      name: input.name.trim(),
      description: input.description.trim() || null,
      rules: input.rules,
    })
    .select("id, name, description, rules, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: subscribers, error: subscribersError } = await supabase
    .from("subscribers")
    .select("id, source_list_id, status, subscribed_at")
    .eq("newsletter_id", newsletter.id);

  if (subscribersError) {
    throw new Error(subscribersError.message);
  }

  const formNameById = new Map((formRows ?? []).map((form) => [form.id, form.name]));
  const rules = Array.isArray(segment.rules) ? (segment.rules as SegmentRule[]) : [];

  return {
    newsletter,
    segment: {
      ...segment,
      rules,
      audienceSize: applySegmentRules(subscribers ?? [], rules).length,
      ruleDescriptions: rules.map((rule) => describeSegmentRule(rule, formNameById)),
    },
  };
}

export async function prepareCampaignSendForCurrentUser(input: {
  newsletterSlug: string;
  campaignId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(input.newsletterSlug);

  const [
    { data: campaign, error: campaignError },
    { data: subscribers, error: subscribersError },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, segment_id")
      .eq("newsletter_id", newsletter.id)
      .eq("id", input.campaignId)
      .maybeSingle(),
    supabase
      .from("subscribers")
      .select("id, source_list_id, status, subscribed_at")
      .eq("newsletter_id", newsletter.id),
  ]);

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (subscribersError) {
    throw new Error(subscribersError.message);
  }

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  let recipients = (subscribers ?? []).filter((subscriber) => subscriber.status === "subscribed");

  if (campaign.segment_id) {
    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("rules")
      .eq("newsletter_id", newsletter.id)
      .eq("id", campaign.segment_id)
      .maybeSingle();

    if (segmentError) {
      throw new Error(segmentError.message);
    }

    if (!segment) {
      throw new Error("Campaign segment not found.");
    }

    const rules = Array.isArray(segment.rules) ? (segment.rules as SegmentRule[]) : [];
    recipients = applySegmentRules(recipients, rules).filter((subscriber) => subscriber.status === "subscribed");
  }

  if (recipients.length === 0) {
    throw new Error("No matching subscribed recipients were found for this campaign.");
  }

  const { error: deliveryError } = await supabase.from("email_deliveries").upsert(
    recipients.map((subscriber) => ({
      campaign_id: campaign.id,
      subscriber_id: subscriber.id,
      status: "queued",
    })),
    { onConflict: "campaign_id,subscriber_id" },
  );

  if (deliveryError) {
    throw new Error(deliveryError.message);
  }

  const { error: campaignUpdateError } = await supabase
    .from("campaigns")
    .update({ status: "queued" })
    .eq("id", campaign.id)
    .eq("newsletter_id", newsletter.id);

  if (campaignUpdateError) {
    throw new Error(campaignUpdateError.message);
  }

  return {
    campaignId: campaign.id,
    queuedRecipients: recipients.length,
  };
}

export async function sendQueuedCampaignForCurrentUser(input: {
  newsletterSlug: string;
  campaignId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(input.newsletterSlug);

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, name, subject, preview_text, body_html, status")
    .eq("newsletter_id", newsletter.id)
    .eq("id", input.campaignId)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const { data: deliveries, error: deliveriesError } = await supabase
    .from("email_deliveries")
    .select(
      `
        id,
        subscriber_id,
        status,
        subscribers!inner (
          id,
          email
        )
      `,
    )
    .eq("campaign_id", campaign.id)
    .eq("status", "queued");

  if (deliveriesError) {
    throw new Error(deliveriesError.message);
  }

  if (!deliveries || deliveries.length === 0) {
    throw new Error("No queued deliveries were found for this campaign.");
  }

  const resend = createResendClient();
  const from = getResendFromEmail();

  const sendResults: Array<{
    deliveryId: string;
    providerMessageId: string | null;
  }> = [];

  for (let index = 0; index < deliveries.length; index += RESEND_MAX_REQUESTS_PER_SECOND) {
    const deliveryBatch = deliveries.slice(index, index + RESEND_MAX_REQUESTS_PER_SECOND);

    const batchResults = await Promise.all(
      deliveryBatch.map(async (delivery) => {
        const recipient = Array.isArray(delivery.subscribers) ? delivery.subscribers[0] : delivery.subscribers;

        if (!recipient?.email) {
          throw new Error("Queued delivery is missing a subscriber email.");
        }

        const { data, error } = await resend.emails.send({
          from,
          to: [recipient.email],
          subject: campaign.subject,
          html: campaign.body_html,
          replyTo: undefined,
        });

        if (error) {
          throw new Error(error.message);
        }

        return {
          deliveryId: delivery.id,
          providerMessageId: data?.id ?? null,
        };
      }),
    );

    sendResults.push(...batchResults);

    if (index + RESEND_MAX_REQUESTS_PER_SECOND < deliveries.length) {
      await sleep(RESEND_BATCH_DELAY_MS);
    }
  }

  for (const result of sendResults) {
    const { error } = await supabase
      .from("email_deliveries")
      .update({
        provider_message_id: result.providerMessageId,
        status: "sent",
      })
      .eq("id", result.deliveryId);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { error: campaignUpdateError } = await supabase
    .from("campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaign.id)
    .eq("newsletter_id", newsletter.id);

  if (campaignUpdateError) {
    throw new Error(campaignUpdateError.message);
  }

  return {
    campaignId: campaign.id,
    sentCount: sendResults.length,
  };
}

export async function getBillingForOwnedNewsletter(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { newsletter } = await getOwnedNewsletterBySlug(slug);

  await ensureNewsletterSubscriptionRow(newsletter.id);

  const { data: subscription, error: subscriptionError } = await supabase
    .from("newsletter_subscriptions")
    .select(
      `
        id,
        status,
        current_period_start,
        current_period_end,
        stripe_customer_id,
        stripe_subscription_id,
        billing_plans (
          id,
          name,
          stripe_price_id,
          monthly_base_price_cents,
          included_emails,
          included_subscribers,
          overage_email_price_cents,
          overage_subscriber_price_cents
        )
      `,
    )
    .eq("newsletter_id", newsletter.id)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  const { data: plans, error: plansError } = await supabase
    .from("billing_plans")
    .select(
      "id, name, stripe_price_id, monthly_base_price_cents, included_emails, included_subscribers, overage_email_price_cents, overage_subscriber_price_cents",
    )
    .order("monthly_base_price_cents", { ascending: true });

  if (plansError) {
    throw new Error(plansError.message);
  }

  const activePlan = Array.isArray(subscription?.billing_plans)
    ? subscription?.billing_plans[0]
    : subscription?.billing_plans;
  const freePlan = (plans ?? []).find((plan) => plan.name === "Free");
  const selectedPlan = activePlan ?? (!subscription ? freePlan : null) ?? null;

  const periodStart =
    subscription?.current_period_start ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const periodEnd =
    subscription?.current_period_end ??
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

  const [{ count: subscriberCount, error: subscriberError }, { count: sentCount, error: sentCountError }] =
    await Promise.all([
      supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("newsletter_id", newsletter.id)
        .eq("status", "subscribed"),
      supabase
        .from("campaigns")
        .select("email_deliveries!inner(id)", { count: "exact", head: true })
        .eq("newsletter_id", newsletter.id)
        .gte("email_deliveries.created_at", periodStart)
        .lt("email_deliveries.created_at", periodEnd),
    ]);

  if (subscriberError) {
    throw new Error(subscriberError.message);
  }

  if (sentCountError) {
    throw new Error(sentCountError.message);
  }

  const currentSubscribers = subscriberCount ?? 0;
  const currentEmails = sentCount ?? 0;

  const includedSubscribers = selectedPlan?.included_subscribers ?? 0;
  const includedEmails = selectedPlan?.included_emails ?? 0;
  const overageSubscribers = Math.max(0, currentSubscribers - includedSubscribers);
  const overageEmails = Math.max(0, currentEmails - includedEmails);
  const overageSubscriberCostCents = overageSubscribers * (selectedPlan?.overage_subscriber_price_cents ?? 0);
  const overageEmailCostCents = overageEmails * (selectedPlan?.overage_email_price_cents ?? 0);
  const projectedTotalCents =
    (selectedPlan?.monthly_base_price_cents ?? 0) + overageSubscriberCostCents + overageEmailCostCents;

  const recommendedPlan =
    (plans ?? []).find(
      (plan) => plan.included_subscribers >= currentSubscribers && plan.included_emails >= currentEmails,
    ) ??
    (plans ?? [])[plans?.length ? plans.length - 1 : 0] ??
    null;

  return {
    newsletter,
    subscription: subscription
      ? {
          ...subscription,
          billing_plans: selectedPlan,
        }
      : null,
    plans: plans ?? [],
    usage: {
      currentSubscribers,
      currentEmails,
      includedSubscribers,
      includedEmails,
      overageSubscribers,
      overageEmails,
      overageSubscriberCostCents,
      overageEmailCostCents,
      projectedTotalCents,
      periodStart,
      periodEnd,
    },
    selectedPlan,
    recommendedPlan,
  };
}
