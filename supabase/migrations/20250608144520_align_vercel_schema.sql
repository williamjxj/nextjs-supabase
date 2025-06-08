drop policy "Can only view own customer data." on "public"."customers";

drop policy "Can only view own subscription data." on "public"."subscriptions";

drop index if exists "public"."customers_stripe_customer_id_key";

drop index if exists "public"."subscriptions_status_idx";

drop index if exists "public"."subscriptions_user_id_idx";

alter table "public"."customers" drop column "avatar_url";

alter table "public"."customers" drop column "billing_address";

alter table "public"."customers" drop column "full_name";

alter table "public"."customers" drop column "payment_method";

alter table "public"."subscriptions" alter column "cancel_at" set default timezone('utc'::text, now());

alter table "public"."subscriptions" alter column "canceled_at" set default timezone('utc'::text, now());

alter table "public"."subscriptions" alter column "ended_at" set default timezone('utc'::text, now());

alter table "public"."subscriptions" alter column "trial_end" set default timezone('utc'::text, now());

alter table "public"."subscriptions" alter column "trial_start" set default timezone('utc'::text, now());

create policy "Can only view own subs data."
on "public"."subscriptions"
as permissive
for select
to public
using ((auth.uid() = user_id));




