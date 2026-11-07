import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query(`
  create or replace function public.current_user_role()
  returns public.user_role
  language sql
  stable
  security definer
  set search_path = public
  as $fn$
    select role from public.profiles where id = auth.uid()
  $fn$;
`);

await client.query(`
  create or replace function public.is_wife_user(uid uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $fn$
    select exists (
      select 1 from public.profiles where id = uid and role = 'wife'
    )
  $fn$;
`);

const drops = [
  `drop policy if exists "profiles_select_own" on public.profiles`,
  `drop policy if exists "profiles_update_own" on public.profiles`,
  `drop policy if exists "profiles_husband_read_wife" on public.profiles`,
  `drop policy if exists "records_select_own" on public.daily_records`,
  `drop policy if exists "records_insert_own" on public.daily_records`,
  `drop policy if exists "records_update_own" on public.daily_records`,
  `drop policy if exists "records_delete_own" on public.daily_records`,
  `drop policy if exists "records_husband_read" on public.daily_records`,
];
for (const sql of drops) await client.query(sql);

await client.query(`
  create policy "profiles_select_own"
    on public.profiles for select
    using (auth.uid() = id)
`);

await client.query(`
  create policy "profiles_update_own"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id)
`);

await client.query(`
  create policy "profiles_husband_read_wife"
    on public.profiles for select
    using (
      public.current_user_role() = 'husband'
      and role = 'wife'
    )
`);

await client.query(`
  create policy "records_select_own"
    on public.daily_records for select
    using (auth.uid() = user_id)
`);

await client.query(`
  create policy "records_insert_own"
    on public.daily_records for insert
    with check (
      auth.uid() = user_id
      and public.current_user_role() = 'wife'
    )
`);

await client.query(`
  create policy "records_update_own"
    on public.daily_records for update
    using (
      auth.uid() = user_id
      and public.current_user_role() = 'wife'
    )
    with check (auth.uid() = user_id)
`);

await client.query(`
  create policy "records_delete_own"
    on public.daily_records for delete
    using (
      auth.uid() = user_id
      and public.current_user_role() = 'wife'
    )
`);

await client.query(`
  create policy "records_husband_read"
    on public.daily_records for select
    using (
      public.current_user_role() = 'husband'
      and public.is_wife_user(user_id)
    )
`);

console.log("RLS policies fixed");
await client.end();
