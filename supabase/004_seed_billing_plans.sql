insert into public.billing_plans (
  name,
  stripe_price_id,
  monthly_base_price_cents,
  included_emails,
  included_subscribers,
  overage_email_price_cents,
  overage_subscriber_price_cents
)
select *
from (
  values
    ('Free', null, 0, 500, 100, 0, 0),
    ('Starter', null, 2900, 5000, 1000, 1, 2),
    ('Growth', null, 9900, 25000, 10000, 1, 1)
) as seed(
  name,
  stripe_price_id,
  monthly_base_price_cents,
  included_emails,
  included_subscribers,
  overage_email_price_cents,
  overage_subscriber_price_cents
)
where not exists (
  select 1
  from public.billing_plans
  where public.billing_plans.name = seed.name
);

insert into public.newsletter_subscriptions (
  newsletter_id,
  billing_plan_id,
  status,
  current_period_start,
  current_period_end
)
select
  newsletters.id,
  billing_plans.id,
  'active',
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month'
from public.newsletters
cross join public.billing_plans
left join public.newsletter_subscriptions
  on public.newsletter_subscriptions.newsletter_id = newsletters.id
where billing_plans.name = 'Free'
  and public.newsletter_subscriptions.id is null;
