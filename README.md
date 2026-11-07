# Rimi · রিমি

A private, mobile-first Islamic daily prayer & Quran tracker for Ridika (family use).

- **Wife:** track five prayers + 60 minutes of Quran with Yes / No / unanswered
- **Husband:** secure read-only admin dashboard with live updates
- **Default language:** Bengali (Bangla), with English toggle
- **Timezone:** Asia/Dhaka
- **Stack:** Next.js App Router · TypeScript · Tailwind · Supabase · Recharts · Framer Motion · PWA

---

## Quick start (Demo Mode)

No Supabase credentials required.

```bash
npm install
cp .env.example .env.local
# keep NEXT_PUBLIC_DEMO_MODE=true
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Wife | `wife@demo.local` | `demo1234` |
| Husband (admin) | `husband@demo.local` | `demo1234` |

Demo data is stored in the browser (`localStorage`) and syncs across tabs on the same device.

---

## Project structure

```
src/
  app/                  # App Router pages
  components/           # UI, layout, tracker, charts, providers
  hooks/                # Record + date hooks
  lib/                  # types, dates, i18n, demo store, supabase, data API
  proxy.ts              # Session refresh for Supabase (skipped in demo mode)
supabase/migrations/    # PostgreSQL schema + RLS
public/                 # PWA manifest, service worker, icons
```

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/login` | Secure / demo login |
| `/dashboard` | Wife daily tracker |
| `/calendar` | Monthly history + edit past days |
| `/quran` | Quran focus + history |
| `/statistics` | Charts + CSV export |
| `/settings` | Locale, theme, reminders |
| `/admin` | Husband live dashboard |
| `/admin/history` | Calendar history (read-only) |
| `/admin/reports` | Weekly/monthly reports |

---

## Supabase setup (production)

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run:
   - `supabase/migrations/001_initial_schema.sql`
3. Create two Auth users in Supabase Auth (email/password):
   - Wife user — after signup, set `profiles.role = 'wife'`
   - Husband user — set `profiles.role = 'husband'`
4. Or register with metadata:

```sql
-- Example: promote an existing user to husband
update public.profiles
set role = 'husband', display_name = 'Abdullah'
where id = '<husband-user-uuid>';

update public.profiles
set role = 'wife', display_name = 'Ayesha'
where id = '<wife-user-uuid>';
```

5. Enable **Realtime** for `daily_records` (included in the migration publication statement).
6. Copy project URL + anon key into `.env.local`:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### Row Level Security

- Wife can insert/update/delete her own `daily_records`
- Husband can **read** wife profiles and records (read-only)
- No public access to personal records

---

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
npm start
```

### Testing checklist

1. Login as wife → mark Fajr **Yes**, Maghrib **No**, leave Isha unanswered
2. Confirm only Yes counts toward completion percentage
3. Add Quran minutes and note auto-save confirmation
4. Open calendar → edit a previous day → refresh → data persists
5. Login as husband (another browser/profile) → admin shows live statuses
6. Toggle language BN/EN and light/dark theme
7. Export CSV from Statistics / Admin Reports
8. Install as PWA from mobile browser

---

## Vercel deployment

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set environment variables:
   - `NEXT_PUBLIC_DEMO_MODE=false`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
5. Add your Vercel domain to Supabase Auth → URL configuration

---

## Design notes

- Emerald / cream / soft gold Islamic visual language
- Large mutually exclusive Yes/No controls (tap again to clear → unanswered)
- Bangladesh timezone date rollover after midnight
- Offline-friendly shell caching via service worker
- Motivational messages, progress ring, and soft motion

---

## Privacy

This is a private family application. There are no public rankings, social feeds, or shared leaderboards.
