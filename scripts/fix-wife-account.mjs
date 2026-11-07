import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const wife = await client.query(
  "select id from auth.users where email = $1",
  ["rimi26e@gmail.com"],
);
if (!wife.rows[0]) throw new Error("rimi26e@gmail.com not found");
const wifeId = wife.rows[0].id;

await client.query(
  `update auth.users
   set encrypted_password = crypt($2, gen_salt('bf')),
       email_confirmed_at = coalesce(email_confirmed_at, now()),
       raw_user_meta_data = jsonb_build_object('display_name', 'Ridika Rimi', 'role', 'wife'),
       updated_at = now()
   where id = $1`,
  [wifeId, "Ibadah2026!Ridika"],
);

await client.query(
  `update public.profiles
   set display_name = 'Ridika Rimi',
       role = 'wife',
       preferred_locale = 'bn'
   where id = $1`,
  [wifeId],
);

const dup = await client.query(
  "select id from auth.users where email = $1",
  ["ridika@ibadah.app"],
);
if (dup.rows[0]) {
  await client.query("delete from auth.identities where user_id = $1", [
    dup.rows[0].id,
  ]);
  await client.query("delete from public.daily_records where user_id = $1", [
    dup.rows[0].id,
  ]);
  await client.query("delete from public.profiles where id = $1", [
    dup.rows[0].id,
  ]);
  await client.query("delete from auth.users where id = $1", [dup.rows[0].id]);
  console.log("Removed duplicate ridika@ibadah.app");
}

// Ensure husband identity exists for login
const husband = await client.query(
  "select id from auth.users where email = $1",
  ["husband@ibadah.app"],
);
if (husband.rows[0]) {
  const hid = husband.rows[0].id;
  const ident = await client.query(
    "select id from auth.identities where user_id = $1",
    [hid],
  );
  if (!ident.rows[0]) {
    await client.query(
      `insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        $1::uuid, $1::uuid,
        jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
        'email', $2,
        now(), now(), now()
      )`,
      [hid, "husband@ibadah.app"],
    );
    console.log("Added missing husband identity");
  }
}

const wifeIdent = await client.query(
  "select id from auth.identities where user_id = $1",
  [wifeId],
);
if (!wifeIdent.rows[0]) {
  await client.query(
    `insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      $1::uuid, $1::uuid,
      jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
      'email', $2,
      now(), now(), now()
    )`,
    [wifeId, "rimi26e@gmail.com"],
  );
  console.log("Added missing wife identity");
}

const rows = await client.query(
  `select p.display_name, p.role::text, u.email
   from public.profiles p
   join auth.users u on u.id = p.id
   order by p.role`,
);
console.table(rows.rows);
await client.end();
