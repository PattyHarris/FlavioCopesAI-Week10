# Supabase Notes

This folder holds schema and migration scaffolding for `What's new`.

Current direction:

- Supabase Auth with email OTP over SMTP
- Newsletter-centric data model
- One subscriber pool per newsletter
- Delivery rows per campaign recipient
- Segment rules stored as JSON and resolved dynamically

Suggested migration order:

1. Core newsletter schema
2. Auth-linked profiles and roles
3. Form submissions and widget tracking
4. Campaign deliveries and analytics events
5. Billing and usage metering
