alter table public.profiles enable row level security;
alter table public.newsletters enable row level security;
alter table public.signup_forms enable row level security;
alter table public.subscribers enable row level security;
alter table public.segments enable row level security;
alter table public.campaigns enable row level security;
alter table public.email_deliveries enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.usage_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "newsletters_select_own" on public.newsletters;
create policy "newsletters_select_own"
on public.newsletters
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "newsletters_insert_own" on public.newsletters;
create policy "newsletters_insert_own"
on public.newsletters
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "newsletters_update_own" on public.newsletters;
create policy "newsletters_update_own"
on public.newsletters
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "newsletters_delete_own" on public.newsletters;
create policy "newsletters_delete_own"
on public.newsletters
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "signup_forms_manage_owner_newsletters" on public.signup_forms;
create policy "signup_forms_manage_owner_newsletters"
on public.signup_forms
for all
to authenticated
using (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = signup_forms.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = signup_forms.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
);

drop policy if exists "subscribers_manage_owner_newsletters" on public.subscribers;
create policy "subscribers_manage_owner_newsletters"
on public.subscribers
for all
to authenticated
using (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = subscribers.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = subscribers.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
);

drop policy if exists "segments_manage_owner_newsletters" on public.segments;
create policy "segments_manage_owner_newsletters"
on public.segments
for all
to authenticated
using (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = segments.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = segments.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
);

drop policy if exists "campaigns_manage_owner_newsletters" on public.campaigns;
create policy "campaigns_manage_owner_newsletters"
on public.campaigns
for all
to authenticated
using (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = campaigns.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = campaigns.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
);

drop policy if exists "email_deliveries_manage_owner_newsletters" on public.email_deliveries;
create policy "email_deliveries_manage_owner_newsletters"
on public.email_deliveries
for all
to authenticated
using (
  exists (
    select 1
    from public.campaigns
    join public.newsletters on newsletters.id = campaigns.newsletter_id
    where campaigns.id = email_deliveries.campaign_id
      and newsletters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.campaigns
    join public.newsletters on newsletters.id = campaigns.newsletter_id
    where campaigns.id = email_deliveries.campaign_id
      and newsletters.owner_user_id = auth.uid()
  )
);

drop policy if exists "newsletter_subscriptions_manage_owner_newsletters" on public.newsletter_subscriptions;
create policy "newsletter_subscriptions_manage_owner_newsletters"
on public.newsletter_subscriptions
for all
to authenticated
using (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = newsletter_subscriptions.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = newsletter_subscriptions.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
);

drop policy if exists "usage_events_manage_owner_newsletters" on public.usage_events;
create policy "usage_events_manage_owner_newsletters"
on public.usage_events
for all
to authenticated
using (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = usage_events.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.newsletters
    where newsletters.id = usage_events.newsletter_id
      and newsletters.owner_user_id = auth.uid()
  )
);
