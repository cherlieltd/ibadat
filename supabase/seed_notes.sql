-- Optional post-setup helpers for My Daily Ibadah
-- Run AFTER creating Auth users in the Supabase dashboard.

-- 1) Promote roles by email (replace emails)
update public.profiles p
set role = 'wife',
    display_name = 'আয়েশা',
    preferred_locale = 'bn'
from auth.users u
where p.id = u.id
  and u.email = 'wife@yourdomain.com';

update public.profiles p
set role = 'husband',
    display_name = 'আব্দুল্লাহ',
    preferred_locale = 'en'
from auth.users u
where p.id = u.id
  and u.email = 'husband@yourdomain.com';

-- 2) Confirm RLS is enabled
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'daily_records');
