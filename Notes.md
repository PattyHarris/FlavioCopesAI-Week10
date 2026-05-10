# A Complete Project - A Newsletter Tool

Build a newsletter platform with subscriber management, signup forms, audience segments, a campaign editor, delivery tracking, embeddable widgets, and usage-based pricing. This is the week where everything comes together into one polished, ship-ready application.

## Agent Scaffolding

he application scaffold is in place and builds cleanly.

I created a real Next.js App Router foundation with a polished marketing page, OTP auth routes, an app shell with desktop sidebar and mobile menu, dark mode, a keyboard command palette, newsletter subroutes, a widget bootstrap API route, Render deployment config, and an initial Supabase schema. The main project brief and session log now live in README.md (line 1), the app entry is package.json (line 1), the UI starts in src/app/(marketing)/page.tsx (line 1) and src/app/app/page.tsx (line 1), and the first schema pass is in supabase/001_initial_schema.sql (line 1).

I also locked in two decisions from your note: Supabase auth is set up around email OTP, and for this version Render can be a single Node web service rather than a split static site plus API. I verified the scaffold with npm run lint and npm run build.

One important adjustment: I upgraded Next.js to 15.5.9 because earlier 15.5.x releases were covered by official security advisories from Next.js. Sources: https://nextjs.org/blog/CVE-2025-66478 and https://nextjs.org/blog/security-update-2025-12-11

The best next move is wiring the real Supabase auth and data layer into this scaffold.

## Supabase

Don't forget to turn off the "Confirm Email" setting when using OTP's and non-production.

Otherwise, use the steps as indicated in ../Week8.

## Test User Cleanup

See Readme - in essence:
Why this usually works cleanly in your schema:

public.profiles.id references auth.users(id) with on delete cascade
public.newsletters.owner_user_id references public.profiles(id) with on delete cascade
the rest of your newsletter tables cascade from newsletters

## Next Step Testing Onboarding

- Run the 002 SQL
- Signin with OTP
- Go through onboarding and create a newsletter
- Confirm that you land in the app successfully

## Next Step After Testing Onboarding

If you want, the next time you come back from testing I can help you add RLS policies and switch the dashboard from mock data to live Supabase queries.

## General Approach

The order I’d recommend is:

Replace mock dashboard data with live Supabase queries.
This proves the signed-in user, profile, and newsletter context are all wired correctly.

Build newsletter creation/read plumbing fully.
Right now onboarding creates the first newsletter. Next we should make sure the app can load that newsletter cleanly across /app, /subscribers, /forms, /segments, and /campaigns.

Add form creation and hosted public signup flow.
This is the first true end-to-end product loop: create a form, visit its public page, submit a signup, and store a subscriber.

Add subscriber listing and source attribution.
Once signups work, we should confirm subscribers appear in the dashboard and track source_list_id correctly.

Then move to segments and campaigns.
Those depend on the subscriber/form model being solid first.

So in short: yes, I’d keep validating the paths and data model first, then deepen the UI once the flows are real.

If you want, I can take the next concrete step now and wire the /app dashboard to live Supabase newsletter data.

### Testing Dashboard to Live Supabase Newsletter Data

The /app dashboard is now wired to live Supabase data.

I replaced the placeholder overview counts with real queries for the signed-in user’s newsletters in src/lib/newsletters.ts (line 1), and updated src/app/app/page.tsx (line 1) to show:

live subscriber count
live form count
live campaign count
recent campaigns from the campaigns table
the user’s actual newsletters instead of sample newsletter cards
I verified it with npm run lint and npm run build.

The best next feature is the hosted signup form flow: create a form in-app, render it on a public route, submit it, and store a subscriber with source_list_id. That gives us the first real end-to-end product loop.

### Testing Signup Form Flow

And to your deployment question: you do not need Render yet for this part. Test it locally first with npm run dev. A “public URL” here just means “a route that works without signing in,” not “must already be deployed.”

Local test steps are now also in README.md (line 1), but the short version is:

Run npm run dev
Sign in
Go to Forms
Create a form
Open its public page
Submit an email
Check Supabase and confirm the subscribers row has the correct source_list_id

Next Feature: Wiring subscriber page to live subscriber rows.

## Campaigns and Segments

When you create a campaign you can select all subscribers, for example, or a segment that was created. That targets the emails to a given set of users.

## Exposing App with HTTPS

The webhook side is now scaffolded and ready.

I added:

a webhook processor at src/lib/email/webhooks.ts (line 1)
a public route at src/app/api/webhooks/resend/route.ts (line 1)
What it does:

accepts Resend webhook JSON
finds the matching email_deliveries row by provider_message_id = data.email_id
updates delivery state for:
email.delivered
email.opened
email.clicked
email.bounced
email.failed
email.complained
stores the latest raw Resend event in email_deliveries.metadata

I also added RESEND_WEBHOOK_SECRET to .env.example (line 1) as a placeholder for future verification, though this first pass does not yet validate webhook signatures.

I verified everything with npm run lint and npm run build.

What you need to do next in Resend:

- Expose your local app over HTTPS with a tunnel if testing locally.
- Register a webhook URL pointing to:
  - https://YOUR-PUBLIC-URL/api/webhooks/resend

- Subscribe it to at least:
  - email.delivered
  - email.opened
  - email.clicked
  - email.bounced

- Send a campaign again and watch email_deliveries update after Resend calls back.

If you want, the next step after you wire the dashboard webhook is to make the UI surface delivery states directly, not just store them in the database.

### Tunneling

Yes. The easiest way is ngrok.

Quick Setup

Keep your app running locally:
npm run dev

Install ngrok on your Mac:
brew install ngrok

Create a free ngrok account and copy your auth token:
https://ngrok.com/download

Add your token:
ngrok config add-authtoken YOUR_TOKEN_HERE

Start a tunnel to your Next app on port 3000:
ngrok http 3000

ngrok will give you a public HTTPS URL like:
https://abc123.ngrok.app

That URL forwards to your local http://localhost:3000.

What To Do With That URL:
Use it in Resend for the webhook endpoint:

    https://abc123.ngrok.app/api/webhooks/resend

If you want to test public form pages through the tunnel too, you can open:

https://abc123.ngrok.app/forms/YOUR_NEWSLETTER_SLUG/YOUR_FORM_SLUG
Important Notes

Keep both npm run dev and ngrok http 3000 running.
The free ngrok URL usually changes each time you restart it.
If the URL changes, update the Resend webhook URL.

How To Test

Start local app.
Start ngrok.
Copy the https://...ngrok.app URL.
Put this into Resend webhook settings:
https://YOUR-NGROK-URL/api/webhooks/resend
Send a campaign.
Check whether email_deliveries updates when Resend calls back.

### Resend Webhook

Select these Resend webhook events first:

email.sent
email.delivered
email.opened
email.clicked
email.bounced
email.complained
email.failed

Why these:

email.delivered, opened, clicked, bounced, complained, and failed are the lifecycle events we want for email_deliveries
email.sent is also useful for debugging, even though the current webhook code mostly cares about the later states
Paste this URL into the webhook destination:

Webhook Destination:
https://grafting-animation-craftsman.ngrok-free.dev/api/webhooks/resend

One small note: the current code already handles:

email.delivered
email.opened
email.clicked
email.bounced
email.failed
email.complained

If Resend sends email.sent, the current webhook will just ignore it safely.

After you save the webhook, the next test is:

keep npm run dev running
keep ngrok http 3000 running
prepare and send a campaign

check email_deliveries in Supabase for status/timestamp changes

optionally open http://127.0.0.1:4040 to inspect incoming webhook requests

### Status

What we’ve now proven:

auth/onboarding works
forms collect subscribers
segments and campaigns save correctly
prepare-send creates delivery rows
Resend sends emails
webhook updates delivery state
That means the core system is now behaving like a real product backend.

## Billing and Testing

The billing/usage phase is now in place.

I added a seed migration for plans in supabase/004_seed_billing_plans.sql (line 1), a live billing calculator in src/lib/newsletters.ts (line 1), and replaced the placeholder settings page with a real usage/billing view in src/app/app/newsletters/[newsletterId]/settings/page.tsx (line 1).

What the settings page now shows:

current plan
active subscriber count
sent-email count for the current billing period
included limits
overage counts and projected monthly total
recommended plan based on current usage
testing guidance for crossing the free tier
I also added dummy-subscriber SQL to README.md (line 1) so you can test tier crossings without hand-entering subscribers.

Before testing, run this migration in Supabase:

supabase/004_seed_billing_plans.sql (line 1)
Then the simplest test flow is:

Open the settings page for your newsletter.
Note the included subscriber limit on the free plan.
Use the README SQL to insert enough dummy subscribers to go past that limit.
Refresh the settings page and confirm the usage/overage numbers and recommended plan update.
Everything passes npm run lint and npm run build.

After you test this, the next big choice is:

Stripe checkout/subscription wiring
finer-grained usage metering with usage_events
My recommendation is Stripe next if you want the billing system to become actionable, not just visible.

### Insert Dummy Users

This checks the current count and adds enough users to reach the >100 limit:

with current_count as (
select count(\*)::int as total
from public.subscribers
where newsletter_id = '60c2cc1c-58df-420c-b92f-48ceeac5e52d'
and status = 'subscribed'
),
needed as (
select greatest(0, 101 - total) as rows_to_add
from current_count
)
insert into public.subscribers (
newsletter_id,
email,
first_name,
last_name,
status,
subscribed_at
)
select
'60c2cc1c-58df-420c-b92f-48ceeac5e52d',
'billingtest' || gs || '@example.com',
'Billing',
'Test ' || gs,
'subscribed',
now()
from needed, generate_series(1, (select rows_to_add from needed)) as gs
on conflict (newsletter_id, email) do nothing;

### Clean up Dummy Users

delete from public.subscribers
where newsletter_id = '60c2cc1c-58df-420c-b92f-48ceeac5e52d'
and email like 'billingtest%@example.com';

## Stripe Integration

One important caveat: your seeded plans still have stripe_price_id = null, so Checkout won’t actually start for Starter or Growth until you create Stripe Prices in test mode and save those IDs into public.billing_plans.stripe_price_id.

What you need to do next for testing:

In Stripe test mode, create recurring Prices for Starter and Growth.
Update public.billing_plans.stripe_price_id for those rows.
If you want webhook syncing too, register a Stripe webhook to:
/api/webhooks/stripe

Test clicking an upgrade button from the settings page.

Suggested Stripe events to register:

checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
Everything passes npm run lint and npm run build.

If you want, the next thing I can do is give you the exact Stripe dashboard steps for creating the test Prices and the exact SQL update statements to paste into Supabase.

### Steps

Absolutely. Here’s the cleanest way to finish the Stripe setup for this project.

What You Need
You need two things from Stripe test mode:

recurring Prices for Starter and Growth
a webhook endpoint for Stripe events

Part 1: Create Stripe Prices
In Stripe Dashboard, make sure you are in Test mode.

Go to Product catalog or Products.
Create a product for Starter.
Add a Recurring price:
amount: $29.00
billing period: Monthly
Save it.
Open the created price and copy the Price ID.
It looks like:
price\_...

Repeat for Growth:

Create product Growth
Add recurring monthly price:
amount: $99.00
Copy that Price ID
Stripe’s product/price docs:

https://support.stripe.com/questions/how-to-create-products-and-prices
https://docs.stripe.com/api/checkout/sessions

Part 2: Save Those Price IDs In Supabase

Update your billing_plans rows:

    update public.billing_plans
    set stripe_price_id = 'price_STARTER_HERE'
    where name = 'Starter';

    update public.billing_plans
    set stripe_price_id = 'price_GROWTH_HERE'
    where name = 'Growth';

To verify the above data is correct:

    select name, stripe_price_id
    from public.billing_plans
    order by monthly_base_price_cents;

Part 3: Set Up Stripe Webhook

You already have the app route ready:

/api/webhooks/stripe
If you’re testing locally through ngrok, use:

    https://YOUR-NGROK-URL/api/webhooks/stripe

In Stripe:

Go to Developers → Webhooks
Click Add destination or Create an event destination
Choose Webhook endpoint
Paste your ngrok URL + /api/webhooks/stripe

Select these events:

    checkout.session.completed
    customer.subscription.created
    customer.subscription.updated
    customer.subscription.deleted
    invoice.paid
    invoice.payment_failed

Stripe webhook docs:

https://docs.stripe.com/webhooks
https://docs.stripe.com/billing/subscriptions/webhooks

Part 4: Copy The Webhook Secret

After creating the Stripe webhook:

Open the webhook endpoint in Stripe
Reveal the signing secret
Copy the secret that looks like:
whsec\_...

Put that in your local .env:
STRIPE*WEBHOOK_SECRET=whsec*...

You should already also have:
STRIPE*SECRET_KEY=sk_test*...

Then restart your dev server.

Part 5: Test The Upgrade Flow

Once the prices are stored in Supabase:

    Open the newsletter Settings page
    Click Choose Starter or Choose Growth
    Stripe Checkout should open
    Complete the test checkout
    Stripe should call your webhook
    Your newsletter_subscriptions row should update

Good SQL Checks After Checkout
Check plan linkage

    select
    ns.id,
    ns.newsletter_id,
    ns.status,
    ns.stripe_customer_id,
    ns.stripe_subscription_id,
    bp.name as plan_name
    from public.newsletter_subscriptions ns
    left join public.billing_plans bp on bp.id = ns.billing_plan_id
    order by ns.created_at desc;

### Bugs

1. Make sure, when using ngrok that you also include the /api/webhooks/stripe portion to the webhook. In addition, when the ngrok URL changes, this Stripe URL must change as well.
2. In .env, the NEXT_PUBLIC_APP_URL must refer to the ngrok URL when it's being used. Otherwise, it points to the actual website URL.
3. Mismatch between URLs and auth:
   - What happened:

     you signed into Supabase on one origin, likely http://localhost:3000
     Stripe sent you back to the ngrok origin
     Supabase auth cookies for localhost are not available on ngrok
     the dashboard loaded without a session and threw Auth session missing
     I fixed the checkout route in route.ts (line 1) so Stripe now returns to the same origin the checkout started from, instead of always using NEXT_PUBLIC_APP_URL. That means:

     use localhost for the app UI
     keep ngrok for the webhook URLs
     start checkout from localhost
     Stripe should now return to localhost and keep your auth session intact

## Next Steps - Subscription Management and Billing

The next step I’d recommend is subscription management and billing guardrails, not a brand-new feature area.

You’ve now proven the core SaaS loop works:

auth and onboarding
forms and subscriber capture
segments and campaigns
Resend sending and webhook tracking
usage metering
Stripe checkout and webhook sync
So the highest-value next work is making billing feel like a real product by adding:

a billing portal / manage subscription flow
clearer upgrade/downgrade state in the settings page
guardrails like disabling invalid billing actions
better plan-change feedback after Stripe returns
After that, I’d move to campaign detail/reporting UI, since the backend data is already there and it will make the product feel much more complete.

If you want, I can take the next concrete step and build the Stripe customer portal / manage billing flow now.

### Testing

The next thing to test is simple:

Open the newsletter settings page on localhost.
Click Manage billing.
Confirm Stripe’s portal opens.
Exit the portal and make sure you land back on the settings page with the return notice.

## Next Steps - Campaign Details Page

The best next step is a campaign detail/reporting view.

Why this one next:

- the backend is already doing real work
- you now have delivery rows, webhook updates, and aggregate stats
- what’s missing is a better place in the app to inspect one campaign clearly

I’d recommend building:

- a campaign detail page
- recipient-level delivery table for that campaign
- status filters like sent, delivered, opened, clicked, bounced
- a quick summary block with totals and rates
- links back to the selected segment or “all subscribers” audience

That would make the product feel much more complete from a user perspective, and it uses infrastructure we’ve already proven.

After that, the next likely branch is either:

- richer campaign editing with a better editor and preview
- stronger billing/product guardrails
- deployment polish for Render

The campaign reporting page is live.

I added a dedicated report route at src/app/app/newsletters/[newsletterId]/campaigns/[campaignId]/page.tsx (line 1), backed by a new server query in src/lib/newsletters.ts (line 1). It now shows:

campaign summary metrics and rates
audience/segment context
recipient-level delivery rows
status filters for queued, sent, delivered, opened, clicked, bounced, complained, and failed

I also added a View report link from each campaign card in create-campaign.tsx (line 1), updated shared styles in globals.css (line 1), and logged it in README.md (line 1).

### Testing

The best test is:

Open a sent campaign.
Click View report.
Verify the counts match Supabase.
Try a few status filters and make sure the recipient rows narrow correctly.

#### Issues

Worked pretty well except for 2 items:

1. Resend doesn't allow for 100 emails to be sent all at once, for example. Changed some code around "prepare all" as well as an additional Segment filter ("before date").
2. Testing for whether an email has been opened is tricky and Gmail isn't reliable. In Resend, steps for setting up tracking:

Use these steps in Resend.

**Enable Open Tracking**

1. Log into Resend.
2. Open `Domains`.
3. Click the domain you’re using as the sender for this app.
4. Go to the domain’s configuration/tracking area.
5. Find `Open and Click Tracking`.
6. Turn on `Open Tracking`.
7. Give the tracking subdomain a name, usually something like:
   - `links`
   - or `track`

That makes Resend want a tracking host such as:

- `links.yourdomain.com`

**Add The DNS Record**
After you enable tracking, Resend will show you the DNS record it needs.
It will usually be a `CNAME` for the tracking subdomain.

1. Go to wherever your DNS is managed.
   Examples:
   - GoDaddy
   - Cloudflare
   - Namecheap
   - your registrar or DNS host
2. Add the exact `CNAME` record Resend shows.
3. Save it.

Important:

- copy the values exactly from Resend
- if Resend also shows an extra `CAA` record requirement, add that too

**Verify In Resend**

1. Go back to Resend.
2. Click the verify/check button for the tracking subdomain.
3. Wait until Resend shows it as verified/active.

Resend says tracking is only active when both are true:

- tracking is enabled
- the tracking subdomain is verified  
  Source: https://resend.com/docs/dashboard/domains/tracking

**Make Sure Your Webhook Already Includes Open Events**
In your Resend webhook settings, keep:

- `email.delivered`
- `email.opened`
- `email.clicked`
- `email.bounced`
- `email.complained`
- `email.failed`

**Retest**

1. Send a fresh campaign.
2. Open one of the emails.
3. Wait a bit.
4. Check:
   - Resend webhook deliveries
   - `email_deliveries.opened_at`
   - campaign report page

**One Small Expectation Setter**
Even after setup, open tracking is never perfect because it depends on image loading behavior in the mailbox client, and Gmail can be inconsistent.  
Source: https://resend.com/docs/knowledge-base/why-are-my-open-rates-not-accurate

If you want, once you’ve enabled the tracking subdomain, I can help you sanity-check whether the Resend webhook and DNS setup look right before you send another test campaign.

### Verification

That looks good to me.

What you listed is consistent with a working tracking setup:

- tracking subdomain is `verified`
- GoDaddy has a plausible CNAME mapping
- webhook URL includes `/api/webhooks/resend`
- `email.opened` is selected

So you’re in a good place to run the real test.

**What I’d do next**

1. Keep `npm run dev` running.
2. Keep `ngrok http 3000` running.
3. Send a brand-new campaign.
   Important: use a fresh send after tracking was verified, not an older already-sent message.
4. Open the email in Gmail.
5. Wait a minute or two.
6. Check:
   - `http://127.0.0.1:4040`
   - Supabase `email_deliveries.opened_at`
   - the campaign report page

**What You Want To See**
In ngrok inspector:

- a webhook request from Resend for an open event

In Supabase:

```sql
select status, delivered_at, opened_at, clicked_at, bounced_at
from public.email_deliveries
where campaign_id = 'YOUR_CAMPAIGN_UUID';
```

Expected:

- `delivered_at` populated
- `opened_at` populated for the opened recipient
- status may move to `opened`

**One tiny note**
Your GoDaddy host `links.auth` suggests the tracking host may be something like:

- `links.auth.yourdomain.com`

That may be exactly what Resend asked for, which is fine. It only matters that it matches Resend’s requested host exactly.

So from what you’ve shown, I do not see an obvious setup problem. The next step is really just a fresh campaign test.

If you want, once you run it, send me either:

- whether `email.opened` showed up in ngrok, or
- the updated `email_deliveries` row values

and I’ll help confirm whether the last mile is working.

## Render Deployment

Use this order for the first Render deploy.

**Create The Service**

1. Push your latest code to GitHub.
2. Log into Render.
3. Click `New +` → `Web Service`.
4. Connect the GitHub repo for this project.
5. Use the existing [render.yaml](/Users/pattyharris/Documents/FlavioCopesBootcamp/AIBootcamp/Week10/render.yaml:1) blueprint if Render offers it.
6. Confirm:
   - service type: `web`
   - runtime: `node`
   - build command: `npm install && npm run build`
   - start command: `npm run start`

**Set Environment Variables**
In Render, add these env vars:

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

For `NEXT_PUBLIC_APP_URL`, use your Render app URL once Render gives it to you, for example:

- `https://whats-new.onrender.com`

For now, `RESEND_WEBHOOK_SECRET` can be set if Resend gives you one, but the current codebase is not yet enforcing signature verification for Resend. Keep it populated anyway for future hardening.

**Deploy**

1. Save the env vars.
2. Trigger the first deploy.
3. Wait for Render to finish building.

**Update Supabase**
In Supabase, check the Auth URL settings you’re using and make sure the Render domain is allowed.
That usually means updating:

- site URL
- redirect URLs

Add your Render domain there, for example:

- `https://whats-new.onrender.com`

If you still use local auth too, keep localhost alongside it.

**Update Resend**
After Render gives you the real URL:

1. Open Resend webhook settings.
2. Replace the ngrok webhook with:
   - `https://YOUR-RENDER-DOMAIN/api/webhooks/resend`
3. Keep these events selected:
   - `email.delivered`
   - `email.opened`
   - `email.clicked`
   - `email.bounced`
   - `email.complained`
   - `email.failed`

**Update Stripe**

1. Open Stripe webhook settings.
2. Replace the ngrok webhook with:
   - `https://YOUR-RENDER-DOMAIN/api/webhooks/stripe`
3. Keep these events selected:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

If Stripe gives you a new webhook signing secret for the Render endpoint, update:

- `STRIPE_WEBHOOK_SECRET`

in Render env vars, then redeploy if needed.

**Smoke Test In Production**
After deploy, test this order:

1. Open the Render app URL.
2. Sign in with OTP.
3. Confirm onboarding/dashboard loads.
4. Open a hosted signup form and submit a test subscriber.
5. Confirm the subscriber appears in the app.
6. Create a segment if needed.
7. Create and prepare a campaign.
8. Send the campaign.
9. Confirm:
   - `email_deliveries` updates
   - campaign reporting updates
   - Resend webhook data continues to arrive
10. Test billing:

- open settings
- run upgrade flow
- confirm Stripe redirect returns correctly
- test `Manage billing`

**Important Notes**

- Render free/starter services can sleep or feel a bit slow on cold start.
- If anything auth-related breaks in production, the first thing to check is Supabase redirect/site URL config.
- If webhook updates stop, the first thing to check is whether Resend/Stripe still point to the old ngrok URL.

**Best Practical Approach**
Do the first deploy, then send me:

- the Render app URL
- whether login works
- whether the dashboard loads
- whether one webhook test works

and I can help you troubleshoot the first production pass quickly.

### Environment Setup Supabase

The site URL is located under Authentication, URL configuration, and is by default set to the local host path: http://localhost:3000 For remote deployment, change this to the Render URL.

As of this writing, I had no redirect URLs setup.

Need to verify this: If you still use local auth too, keep localhost alongside it.

NOTE: the .env email type values cannot be quoted when used in Render.
