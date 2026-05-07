alter table public.billing_plans enable row level security;

drop policy if exists "billing_plans_read_all" on public.billing_plans;
create policy "billing_plans_read_all"
on public.billing_plans
for select
to authenticated, anon
using (true);
