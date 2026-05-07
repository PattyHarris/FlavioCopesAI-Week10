create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  sender_name text,
  sender_email text,
  brand_primary_color text default '#312E81',
  brand_secondary_color text default '#6366F1',
  created_at timestamptz not null default now()
);

create table if not exists public.signup_forms (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters (id) on delete cascade,
  name text not null,
  slug text not null,
  heading text not null,
  description text,
  submit_button_label text not null default 'Subscribe',
  background_color text default '#FFFFFF',
  text_color text default '#212529',
  is_embeddable boolean not null default true,
  created_at timestamptz not null default now(),
  unique (newsletter_id, slug)
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters (id) on delete cascade,
  source_list_id uuid references public.signup_forms (id) on delete set null,
  email text not null,
  first_name text,
  last_name text,
  status text not null default 'subscribed',
  subscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (newsletter_id, email)
);

create table if not exists public.segments (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters (id) on delete cascade,
  name text not null,
  description text,
  rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters (id) on delete cascade,
  segment_id uuid references public.segments (id) on delete set null,
  name text not null,
  subject text not null,
  preview_text text,
  body_html text not null default '',
  status text not null default 'draft',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  subscriber_id uuid not null references public.subscribers (id) on delete cascade,
  provider_message_id text,
  status text not null default 'queued',
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (campaign_id, subscriber_id)
);

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_price_id text unique,
  monthly_base_price_cents integer not null default 0,
  included_emails integer not null default 0,
  included_subscribers integer not null default 0,
  overage_email_price_cents integer not null default 0,
  overage_subscriber_price_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null unique references public.newsletters (id) on delete cascade,
  billing_plan_id uuid references public.billing_plans (id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters (id) on delete cascade,
  event_type text not null,
  quantity integer not null default 1,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
