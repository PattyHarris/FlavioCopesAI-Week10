# What's new

`What's new` is a real SaaS newsletter platform for creators, teams, and businesses. Users can create multiple newsletters, collect subscribers through hosted forms and embeddable widgets, write and send campaigns, segment audiences, and track delivery performance.

This repository is the working space for planning, implementation, and ongoing session notes.

## Product Summary

Core product capabilities:

- User accounts with email/password authentication
- Multiple newsletters per user
- Shared subscriber pool per newsletter
- Hosted signup forms with configurable branding
- Embeddable signup widgets
- Audience segments powered by rule-based filters
- Campaign editor with subject, rich text body, and recipient targeting
- Email sending and delivery tracking
- Usage-based pricing with tiered plans
- Responsive SaaS dashboard with dark mode and command palette

## UI Direction

The app should feel clean, document-like, and production-ready rather than like a demo.

Design notes pulled from `Agents.md`:

- Use a professional, minimal interface focused on readability
- Prefer a sidebar layout on desktop and off-canvas navigation on mobile
- Keep the landing page, sidebar, and editor views especially polished
- Use the Stitch MCP server in this workspace as a UI starting point

Color palette:

- Background: `#FFFFFF` or `#F8F9FA`
- Text: `#212529`
- Neutral: `#4B5563`
- Primary: `#312E81`
- Secondary: `#6366F1`
- Destructive action: `#9a1919`

Typography direction:

- Distinct heading font such as `Oswald` or `Poppins`
- Clean body font in either serif or sans-serif

## Tech Stack

Initial suggested stack from `Agents.md`:

- Next.js
- TypeScript
- shadcn/ui
- Resend
- Supabase
- Stripe
- Render

Current stance:

- The stack is still open for debate
- We should validate each choice against product needs, developer experience, pricing, and deployment constraints before locking it in
- Next.js + TypeScript is still the strongest default unless we decide otherwise
- Supabase Auth should use email OTP over SMTP, following the pattern from `../Week8`
- Render does not need a separate static frontend plus API service for this version; a single Next.js web service is enough because App Router pages and API routes can live together

## Data Model

High-level relationships:

- Users have many newsletters
- Newsletters have many subscribers
- Newsletters have many forms
- Newsletters have many segments
- Newsletters have many campaigns
- Campaigns have many email deliveries
- Subscribers belong to a newsletter and track `source_list_id`
- Segments store rules as JSON and resolve subscribers dynamically

## Workspace Conventions

- `README.md`: shared project brief, decisions, and session log
- `Notes.md`: reserved for your own notes
- `Agents.md`: source prompt, UI guidance, and MCP-related instructions

## Testing Reset Queries

Use these only for test users when you want a clean auth and onboarding retry in Supabase.

Inspect a user first:

```sql
select id, email, created_at
from auth.users
where email = 'you@example.com';
```

Delete a test user by email:

```sql
begin;

delete from auth.users
where email = 'you@example.com';

commit;
```

Delete by explicit user id:

```sql
begin;

delete from auth.users
where id = 'USER_UUID_HERE';

commit;
```

Verify cleanup:

```sql
select *
from auth.users
where email = 'you@example.com';

select *
from public.profiles
where email = 'you@example.com';
```

Why this works in the current schema:

- `public.profiles.id` references `auth.users(id)` with `on delete cascade`
- `public.newsletters.owner_user_id` references `public.profiles(id)` with `on delete cascade`
- newsletter-owned rows cascade from there

## Billing Test Queries

Use these to bulk-create dummy subscribers for a newsletter when you want to test crossing free-tier usage limits.

Find your newsletter id first:

```sql
select id, name, slug
from public.newsletters
order by created_at desc;
```

Insert 150 dummy subscribed users for one newsletter:

```sql
insert into public.subscribers (
  newsletter_id,
  email,
  first_name,
  last_name,
  status,
  subscribed_at
)
select
  'NEWSLETTER_UUID_HERE',
  'testuser' || gs || '@example.com',
  'Test',
  'User ' || gs,
  'subscribed',
  now()
from generate_series(1, 150) as gs
on conflict (newsletter_id, email) do nothing;
```

Delete those dummy users later:

```sql
delete from public.subscribers
where newsletter_id = 'NEWSLETTER_UUID_HERE'
  and email like 'testuser%@example.com';
```

## Open Questions

- Should we keep Supabase Auth or use another auth provider
- Should campaign editing use a block editor, rich text editor, or HTML-first workflow
- How should usage-based billing be measured: subscribers, sends, active newsletters, or a hybrid model
- Do we want Resend as the first implementation only, or do we want an email-provider abstraction from day one
- Should dark mode ship in v1 or immediately as a first-class design constraint during the build

## Render Deployment Prep

Recommended production shape:

- One Render `web` service for the Next.js app
- Supabase hosted separately
- Resend webhooks pointed directly at the Render app URL
- Stripe webhooks pointed directly at the Render app URL

Required Render environment variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_FROM_EMAIL`
- `RESEND_REPLY_TO`
- `RESEND_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Production URL replacements after deploy:

- Resend webhook: `https://YOUR-RENDER-DOMAIN/api/webhooks/resend`
- Stripe webhook: `https://YOUR-RENDER-DOMAIN/api/webhooks/stripe`
- App base URL: `NEXT_PUBLIC_APP_URL=https://YOUR-RENDER-DOMAIN`

Supabase settings to review before go-live:

- Keep email OTP enabled
- If Supabase email templates or redirects rely on a site URL, update them to the Render domain
- Add the Render domain to any allowed redirect/site URL settings you are using

Deployment notes:

- `render.yaml` is already set up for a single Node web service
- `RESEND_WEBHOOK_SECRET` is reserved for future webhook signature verification hardening
- Stripe checkout and portal flows already return to the origin that initiated the request, which is safer for local and production auth sessions

## Session Details

### 2026-05-02

Current status:

- Git sync issue resolved
- Repository currently contains planning documents only
- No application scaffold exists yet
- README created as the shared project source of truth

What we know:

- The product is a newsletter SaaS called `What's new`
- The interface should be polished, minimal, and document-like
- The app needs subscriber management, forms, segmentation, campaigns, sending, analytics, billing, and widgets
- The tech stack is suggested but not finalized

Recommended next step:

- Decide whether you want me to first create the app scaffold and architecture, or first turn this into a tighter product and technical plan

### 2026-05-03

Current status:

- Next.js application scaffold created
- Dependencies installed and verified with `npm run lint` and `npm run build`
- Supabase OTP auth routes scaffolded
- Dashboard shell, marketing page, dark mode, and command palette scaffolded
- Render blueprint added for a single Node web service deployment
- Initial Supabase schema stub created
- Profile auto-creation migration and first-pass onboarding flow added
- RLS policy migration added after onboarding hit a `profiles` policy error during testing
- `/app` dashboard wired to live Supabase counts and recent campaigns

Important decisions:

- Supabase Auth will use email OTP via SMTP
- We are starting with one Render web service, not a split static site plus API setup
- Next.js was updated to `15.5.9` after official security advisories for earlier `15.5.x` releases

Scaffolded areas:

- Marketing homepage
- Login and OTP verification routes
- Onboarding flow for first newsletter creation
- App shell with desktop sidebar and mobile menu
- Newsletter subroutes for subscribers, forms, segments, campaigns, and settings
- Healthcheck and widget bootstrap API routes
- Initial schema for profiles, newsletters, forms, subscribers, segments, campaigns, deliveries, billing, and usage
- Backfill + trigger migration for `profiles` from `auth.users`

Recommended next step:

- Run the new Supabase migration, then test the full sign-in -> onboarding -> first newsletter creation flow

### 2026-05-04

Current status:

- OTP sign-in, onboarding, and first newsletter creation are working
- Dashboard overview now reads live data from Supabase
- Recent campaigns and aggregate counts no longer rely only on mock placeholders
- Hosted signup form creation and public subscription flow are scaffolded
- Subscribers page now reads live subscriber rows with source form attribution
- Campaign draft creation is now live with optional segment targeting
- Segment creation is now live with first-pass JSON rules and audience estimates
- Campaign send preparation is now live with delivery record creation
- Resend-backed campaign sending is now wired for queued deliveries
- Resend webhook ingestion is now scaffolded for delivery event updates
- Campaign delivery reporting is now visible inside the app UI
- Billing and usage settings are now live with seeded plan tiers and overage projections
- First-pass Stripe checkout and Stripe webhook scaffolding are now live

What changed:

- `/app` now queries real newsletter-owned counts for subscribers, forms, and campaigns
- Recent campaigns are loaded from the `campaigns` table for the signed-in user’s newsletters
- The dashboard still keeps some planning-oriented sections, but the core overview is now data-backed
- `/app/newsletters/[newsletterSlug]/forms` can now create signup forms
- Public hosted form routes now exist at `/forms/[newsletterSlug]/[formSlug]`
- Public submissions insert or update `subscribers` with the correct `source_list_id`
- `/app/newsletters/[newsletterSlug]/subscribers` now shows real subscribers and their source form names
- `/app/newsletters/[newsletterSlug]/campaigns` can now create real draft campaigns
- `NULL` `segment_id` currently means “all subscribers”; selecting a segment targets that segment
- `/app/newsletters/[newsletterSlug]/segments` can now create simple rule-based segments
- First-pass segment rules support source form, subscriber status, and signup date filters
- Campaigns can now resolve recipients and create `email_deliveries` rows through a prepare step
- Prepared campaigns transition from `draft` to `queued`
- Queued campaigns can now send through Resend and update `email_deliveries.provider_message_id`
- Sent campaigns transition to `sent` and stamp `campaigns.sent_at`
- `/api/webhooks/resend` now maps Resend events back onto `email_deliveries`
- Campaign cards now show delivered/opened/clicked/bounced counts from `email_deliveries`
- Newsletter settings now surface current plan, included limits, current usage, and projected overages
- Billing test SQL now exists for adding dummy subscribers to exceed a tier locally
- Newsletter settings now include upgrade actions that create Stripe Checkout sessions
- Stripe webhook handling now updates `newsletter_subscriptions` from Checkout and subscription events

Recommended next step:

- Register the Resend webhook URL and test delivered/opened/clicked/bounced events against real sends

### 2026-05-05

Current status:

- Resend webhook testing worked
- `email_deliveries` are updating to delivered after webhook callbacks
- Campaign reporting is now surfaced in the campaigns UI

What changed:

- Campaign queries now aggregate delivery outcomes per campaign
- The campaign cards now show counts for delivered, opened, clicked, and bounced emails
- The app is now reflecting infrastructure events in product UI rather than only in Supabase tables

Recommended next step:

- Add a deeper campaign detail/report view or start billing and usage metering work

### 2026-05-05 Billing

Current status:

- Billing plans can be seeded and backfilled for existing newsletters
- Settings now show plan, usage, overage, and recommendation data
- Local billing-tier testing can be done with dummy subscribers through SQL

What changed:

- Added [supabase/004_seed_billing_plans.sql](/Users/pattyharris/Documents/FlavioCopesBootcamp/AIBootcamp/Week10/supabase/004_seed_billing_plans.sql:1)
- Wired billing usage calculations into [src/lib/newsletters.ts](/Users/pattyharris/Documents/FlavioCopesBootcamp/AIBootcamp/Week10/src/lib/newsletters.ts:1)
- Replaced the placeholder settings page with a live billing and usage view

Recommended next step:

- Run the billing seed migration, test the free-tier threshold with dummy subscribers, then decide whether to wire Stripe checkout or usage-event metering next

### 2026-05-05 Stripe

Current status:

- Stripe checkout session creation is scaffolded
- Stripe webhook ingestion is scaffolded
- Upgrade buttons are visible in the settings page
- A Stripe customer portal flow is now available once a newsletter is linked to a Stripe customer

Important setup note:

- The seeded billing plans still use `stripe_price_id = null`
- Before checkout can work for Starter or Growth, you must create Stripe Prices and save their ids into `public.billing_plans.stripe_price_id`

Recommended next step:

- Test Checkout, then use `Manage billing` to confirm the Stripe customer portal opens and returns cleanly to the settings page

### 2026-05-07 Campaign Reporting

Current status:

- Campaigns now have a dedicated reporting page inside the app
- Recipient-level delivery rows can be filtered by status
- Delivery, open, click, and bounce rates are visible without leaving the product

Recommended next step:

- Test the report page with a sent campaign, then decide whether to deepen campaign editing or move toward deployment polish

### 2026-05-08 Segment Rules

Current status:

- Segment creation now supports both `signed up after` and `signed up before` date rules
- Date-based audience narrowing is easier for testing and future targeting work

### 2026-05-10 Billing Reliability

Current status:

- New newsletters now ensure a default `newsletter_subscriptions` row exists
- Stripe checkout completion now upserts subscription state by `newsletter_id`
- Billing no longer depends on an older seed migration having backfilled every later newsletter

### 2026-05-10 Identity Clarity

Current status:

- The app shell now shows the signed-in account clearly
- The current newsletter identity is visible in both sidebar and top bar
- A sign-out action now exists directly in the app shell

### 2026-05-11 Page Polish

Current status:

- Campaign compose and reporting surfaces have been tightened up
- Billing/settings now uses a cleaner summary strip and quieter support copy
- Repetitive helper text is being reduced in favor of denser, calmer product language

### 2026-05-11 Audience Surface Cleanup

Current status:

- Forms, subscribers, and segments pages now use tighter intros and calmer status messaging
- Topbar identity chip tooltips are less likely to clip and now support multi-line content

## Local Test Flow

To test the new hosted signup form loop locally:

1. Run `npm run dev`
2. Sign in with OTP
3. Finish onboarding if needed
4. Open the `Forms` section in the app
5. Create a hosted form
6. Click `Open public page`
7. Submit a subscriber email on that public page
8. Confirm the subscriber row exists in Supabase with:
   - the correct `newsletter_id`
   - the correct `source_list_id`
