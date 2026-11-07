import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const WIFE_EMAIL = "ridika@ibadah.app";
const HUSBAND_EMAIL = "husband@ibadah.app";
const WIFE_PASSWORD = "Ibadah2026!Ridika";
const HUSBAND_PASSWORD = "Ibadah2026!Admin";
const WIFE_NAME = "Ridika Rimi";
const HUSBAND_NAME = "Abdullah";

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function exec(sql, params) {
  return client.query(sql, params);
}

async function execIgnore(sql, ignorable = []) {
  try {
    await exec(sql);
  } catch (err) {
    if (ignorable.includes(err.code) || ignorable.some((x) => err.message?.includes?.(x))) {
      console.log(`skip: ${err.message.split("\n")[0]}`);
      return;
    }
    throw err;
  }
}

async function main() {
  await client.connect();
  console.log("Connected to Supabase Postgres");

  await exec(`create extension if not exists "pgcrypto"`);

  await execIgnore(
    `create type public.user_role as enum ('wife', 'husband')`,
    ["42710", "already exists"],
  );
  await execIgnore(
    `create type public.activity_status as enum ('yes', 'no', 'unanswered')`,
    ["42710", "already exists"],
  );

  await exec(`
    create table if not exists public.profiles (
      id uuid primary key references auth.users (id) on delete cascade,
      display_name text not null,
      role public.user_role not null default 'wife',
      preferred_locale text not null default 'bn' check (preferred_locale in ('bn', 'en')),
      theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
      reminder_enabled boolean not null default false,
      quran_reminder_enabled boolean not null default false,
      created_at timestamptz not null default now()
    )
  `);

  await exec(`
    create table if not exists public.daily_records (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.profiles (id) on delete cascade,
      record_date date not null,
      fajr_status public.activity_status not null default 'unanswered',
      dhuhr_status public.activity_status not null default 'unanswered',
      asr_status public.activity_status not null default 'unanswered',
      maghrib_status public.activity_status not null default 'unanswered',
      isha_status public.activity_status not null default 'unanswered',
      quran_status public.activity_status not null default 'unanswered',
      quran_minutes integer check (quran_minutes is null or quran_minutes >= 0),
      notes text,
      fajr_notes text,
      dhuhr_notes text,
      asr_notes text,
      maghrib_notes text,
      isha_notes text,
      quran_notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (user_id, record_date)
    )
  `);

  await exec(`
    create index if not exists daily_records_user_date_idx
      on public.daily_records (user_id, record_date desc)
  `);

  await exec(`
    create or replace function public.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$
  `);

  await exec(`drop trigger if exists daily_records_set_updated_at on public.daily_records`);
  await exec(`
    create trigger daily_records_set_updated_at
    before update on public.daily_records
    for each row execute function public.set_updated_at()
  `);

  await exec(`
    create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    declare
      chosen_role public.user_role;
    begin
      chosen_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'wife');
      insert into public.profiles (id, display_name, role)
      values (
        new.id,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        chosen_role
      );
      return new;
    end;
    $fn$
  `);

  await exec(`drop trigger if exists on_auth_user_created on auth.users`);
  await exec(`
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user()
  `);

  await exec(`alter table public.profiles enable row level security`);
  await exec(`alter table public.daily_records enable row level security`);

  const policies = [
    [
      "profiles",
      "profiles_select_own",
      `create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id)`,
    ],
    [
      "profiles",
      "profiles_update_own",
      `create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id)`,
    ],
    [
      "profiles",
      "profiles_husband_read_wife",
      `create policy "profiles_husband_read_wife" on public.profiles for select using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'husband')
        and role = 'wife'
      )`,
    ],
    [
      "daily_records",
      "records_select_own",
      `create policy "records_select_own" on public.daily_records for select using (auth.uid() = user_id)`,
    ],
    [
      "daily_records",
      "records_insert_own",
      `create policy "records_insert_own" on public.daily_records for insert with check (
        auth.uid() = user_id
        and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'wife')
      )`,
    ],
    [
      "daily_records",
      "records_update_own",
      `create policy "records_update_own" on public.daily_records for update using (
        auth.uid() = user_id
        and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'wife')
      ) with check (auth.uid() = user_id)`,
    ],
    [
      "daily_records",
      "records_delete_own",
      `create policy "records_delete_own" on public.daily_records for delete using (
        auth.uid() = user_id
        and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'wife')
      )`,
    ],
    [
      "daily_records",
      "records_husband_read",
      `create policy "records_husband_read" on public.daily_records for select using (
        exists (select 1 from public.profiles viewer where viewer.id = auth.uid() and viewer.role = 'husband')
        and exists (select 1 from public.profiles owner where owner.id = daily_records.user_id and owner.role = 'wife')
      )`,
    ],
  ];

  for (const [table, name, createSql] of policies) {
    await exec(`drop policy if exists "${name}" on public.${table}`);
    await exec(createSql);
  }

  await execIgnore(
    `alter publication supabase_realtime add table public.daily_records`,
    ["42710", "already member"],
  );

  console.log("Schema migration applied");

  async function ensureUser({ email, password, displayName, role }) {
    const existing = await exec(`select id from auth.users where email = $1`, [email]);
    if (existing.rows[0]) {
      const id = existing.rows[0].id;
      await exec(
        `update auth.users
         set encrypted_password = crypt($2, gen_salt('bf')),
             email_confirmed_at = coalesce(email_confirmed_at, now()),
             raw_user_meta_data = jsonb_build_object('display_name', $3::text, 'role', $4::text),
             updated_at = now()
         where id = $1`,
        [id, password, displayName, role],
      );
      await exec(
        `insert into public.profiles (id, display_name, role, preferred_locale)
         values ($1, $2, $3::public.user_role, $4)
         on conflict (id) do update
         set display_name = excluded.display_name,
             role = excluded.role,
             preferred_locale = excluded.preferred_locale`,
        [id, displayName, role, role === "wife" ? "bn" : "en"],
      );
      console.log(`Updated existing user ${email} (${role})`);
      return id;
    }

    const id = (await exec(`select gen_random_uuid() as id`)).rows[0].id;

    await exec(
      `insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000',
        $1, 'authenticated', 'authenticated', $2,
        crypt($3, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('display_name', $4::text, 'role', $5::text),
        now(), now(), '', '', '', ''
      )`,
      [id, email, password, displayName, role],
    );

    await exec(
      `insert into public.profiles (id, display_name, role, preferred_locale)
       values ($1, $2, $3::public.user_role, $4)
       on conflict (id) do update
       set display_name = excluded.display_name,
           role = excluded.role,
           preferred_locale = excluded.preferred_locale`,
      [id, displayName, role, role === "wife" ? "bn" : "en"],
    );

    const identityCols = await exec(`
      select column_name
      from information_schema.columns
      where table_schema = 'auth' and table_name = 'identities'
    `);
    const cols = new Set(identityCols.rows.map((r) => r.column_name));

    if (cols.has("provider_id")) {
      await exec(
        `insert into auth.identities (
          id, user_id, identity_data, provider, provider_id,
          last_sign_in_at, created_at, updated_at
        ) values (
          $1::uuid, $1::uuid,
          jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
          'email', $2,
          now(), now(), now()
        )`,
        [id, email],
      );
    } else {
      await exec(
        `insert into auth.identities (
          id, user_id, identity_data, provider,
          last_sign_in_at, created_at, updated_at
        ) values (
          $1::uuid, $1::uuid,
          jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
          'email',
          now(), now(), now()
        )`,
        [id, email],
      );
    }

    console.log(`Created user ${email} (${role})`);
    return id;
  }

  await ensureUser({
    email: WIFE_EMAIL,
    password: WIFE_PASSWORD,
    displayName: WIFE_NAME,
    role: "wife",
  });
  await ensureUser({
    email: HUSBAND_EMAIL,
    password: HUSBAND_PASSWORD,
    displayName: HUSBAND_NAME,
    role: "husband",
  });

  const check = await exec(
    `select p.display_name, p.role::text, u.email
     from public.profiles p
     join auth.users u on u.id = p.id
     order by p.role`,
  );
  console.log("Profiles:");
  console.table(check.rows);

  console.log("\nLOGIN CREDENTIALS");
  console.log(`Wife:    ${WIFE_EMAIL} / ${WIFE_PASSWORD}`);
  console.log(`Husband: ${HUSBAND_EMAIL} / ${HUSBAND_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
