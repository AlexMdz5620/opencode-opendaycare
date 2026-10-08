-- Corrective migration (spec 08 verification): restore the seed email
-- to the value recorded in the spec and in the original migration
-- (create_users_table): 'alex@googl.com'.
update public.users
set email = 'alex@google.com'
where full_name = 'Alex'
  and email = 'alex@google.com';
