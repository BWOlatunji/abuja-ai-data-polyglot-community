# Abuja AI and Data Polyglot Community — Website

A production-oriented community website built with **Astro + TypeScript**, **Tailwind CSS**, **Supabase** (Postgres + Auth), and **Netlify**. It implements a public site (home, about, member directory, profiles, spotlights, blog, events, projects, join, contact, privacy), database-backed registration/consent/moderation workflows, and a server-authorized admin area — per `Project Brief.md`.

## Contents

- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Supabase setup](#supabase-setup)
- [Environment variables](#environment-variables)
- [Security model](#security-model)
- [First administrator](#first-administrator)
- [Local development](#local-development)
- [Testing](#testing)
- [Deploying to Netlify](#deploying-to-netlify)
- [Updating the site after deployment](#updating-the-site-after-deployment)
- [Troubleshooting](#troubleshooting)
- [Known limitations & recommended follow-ups](#known-limitations--recommended-follow-ups)
- [Implementation notes by phase](#implementation-notes-by-phase)

## Quick start

```bash
npm install
cp .env.example .env         # fill in Supabase values once you have a project
npm run dev                  # http://localhost:4321
```

Without any Supabase environment variables set, the site still runs and every content page renders **clearly-labelled sample data** (see `src/lib/sample-data.ts` and the amber "Sample data" banners) so you can review layout and design immediately. Forms will respond with a "not configured yet" message until Supabase is connected.

## Project structure

```
src/
  components/        Reusable Astro components (cards, header/footer, SEO, share buttons, forms)
  layouts/            BaseLayout (public) and AdminLayout (protected admin shell)
  lib/
    data/             Read-only data-access functions (Supabase query + sample-data fallback per domain)
    supabase.ts* ...  Three distinct Supabase clients - see "Security model"
    validation.ts     zod schemas shared by client forms and server endpoints
    markdown.ts       Sanitized Markdown rendering for admin-authored content
  middleware.ts       Server-enforced /admin and /api/admin authorization (runs on every request)
  pages/
    *.astro           Public pages
    admin/            Protected admin pages (list + create/edit forms per content type)
    api/               Server endpoints: public form submissions + admin mutations
supabase/
  migrations/         Numbered SQL migrations: schema, then RLS policies + grants
  seed.sql            Optional, local/dev-only placeholder data
scripts/
  create-first-admin.mjs   One-time CLI to bootstrap the first admin account
tests/                 Vitest unit tests (validation, utils, sample-data fallback)
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor (or via the Supabase CLI), run the migrations **in order**:
   ```
   supabase/migrations/0001_schema.sql
   supabase/migrations/0002_rls_and_grants.sql
   ```
   Using the CLI instead: `supabase link --project-ref <ref>` then `supabase db push`.
3. (Optional, local/dev only) Run `supabase/seed.sql` to get a few placeholder rows to click through. **Never run this against production** — it is fictional sample content only.
4. Under **Authentication → Providers**, email/password sign-in is enabled by default — that's all this project uses (admins only; there is no public member login).
5. Copy your Project URL, anon key, and service-role key into `.env` (see below).
6. (Optional, recommended before scaling the admin UI) Generate typed Supabase clients: `supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`, then wire that `Database` type into `supabase-admin.ts` / `supabase-public.ts` / `supabase-server.ts` in place of the current `any` generics. The code works without this; it just means Supabase queries aren't statically typed yet.

## Environment variables

See `.env.example` for the full list with descriptions. Summary:

| Variable | Where used | Notes |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | browser + server | Safe to expose |
| `PUBLIC_SUPABASE_ANON_KEY` | browser + server | Safe to expose; restricted entirely by RLS + column grants |
| `SUPABASE_SERVICE_ROLE_KEY` | server only (`src/pages/api/**`) | **Never** expose to the browser, logs, or git. Bypasses RLS. |
| `PUBLIC_SITE_URL`, `PUBLIC_COMMUNITY_NAME`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_LINKEDIN_URL`, `PUBLIC_WHATSAPP_URL`, `PUBLIC_GITHUB_URL` | site config | Drives footer/header/CTAs, `src/lib/config.ts` |
| `PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | spam protection | Optional; forms work without it in dev, see below |
| `PUBLIC_PLAUSIBLE_DOMAIN` | analytics | Optional, cookie-free; leave blank for zero analytics |

In Netlify, set these under **Site settings → Environment variables** for both Production and any Preview/Branch contexts you use, with different Supabase projects for prod vs. staging if possible (see "Known limitations").

## Security model

Three separate Supabase clients exist on purpose — using the wrong one in the wrong place is the most common way this kind of app leaks data:

1. **`src/lib/supabase-public.ts`** — anon key, no cookies. Used by `src/lib/data/*.ts` for public page reads. Subject to full RLS + column grants, identical to what a browser could query directly.
2. **`src/lib/supabase-server.ts`** — anon key + the visitor's session cookies (via `@supabase/ssr`). Used by admin pages and admin API routes. Every query is still RLS-checked; admin access works *because* the `is_admin(auth.uid())` policy allows it, not because this code is special.
3. **`src/lib/supabase-admin.ts`** — service-role key, **server-only**. Used exclusively by the four public-intake endpoints (`api/join.ts`, `api/contact.ts`, `api/spotlight-nomination.ts`, `api/project-submission.ts`) to write rows that `anon` is deliberately not granted (registrations, submissions, consent records) — see the comment at the bottom of `0002_rls_and_grants.sql` for why anon has no insert grant on `submissions` at all (defence against bulk scripted spam via the REST API).

Authorization for `/admin/**` and `/api/admin/**` is enforced in **`src/middleware.ts`**, which runs before every request, checks the session against the `admins` table, and redirects/401s unauthenticated or non-admin requests — independent of whether any page or link is hidden in the UI.

Privacy-sensitive columns (`members.email`, `members.full_name`, `members.admin_notes`) are protected **twice**:
- Row-level: the public `SELECT` policy only matches rows where `membership_status='active' AND profile_visibility='public' AND public_profile_approved=true`.
- Column-level: `anon`/`authenticated` are granted `SELECT` on an explicit allow-list of columns only (see `GRANT SELECT (...)` in `0002_rls_and_grants.sql`) — email and full name are never in that list, so even a row-policy mistake can't leak them through the anon key.

Directory visibility, spotlight-publication consent, and communications consent are tracked as three independent rows in `consent_records` (never overwritten — withdrawal adds a new row), matching the brief's requirement to track these separately. A member can be attributed on a published spotlight or project **without** being in the public directory — see the two extra `members` SELECT policies in `0002_rls_and_grants.sql` for how that's scoped narrowly.

**Current auth assumption:** the only Supabase Auth users in this system are admins. There is no public member self-service login. If you add one later, re-audit every `authenticated`-role grant/policy in `0002_rls_and_grants.sql` — several of them currently assume "authenticated = admin."

**Column grants vs. PostgREST embeds:** `src/lib/data/*.ts` deliberately avoids PostgREST relationship-embed syntax (e.g. `.select("*, member_skills(skills(name))")`) against `members`. Verified against a live project: embedding fails with `permission denied for table members` for the `anon` role even when every requested column is on the allow-list — PostgREST's embed resolution needs broader row access than a column-level `GRANT` provides. Each data-access function instead runs a plain explicit-column query plus a second query for the related rows, joined in memory. Keep this pattern for any new query that needs to join through `members`.

## First administrator

There is intentionally **no** public "sign up as admin" page or API route. Create the first admin with the bootstrap script, run locally against your Supabase project:

```bash
# .env with PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY filled in, then:
npm run create-admin -- organiser@example.com "Temporary-Pass-123!" "Organiser Name"
```

This creates a Supabase Auth user and the matching `admins` row in one step. Sign in at `/admin/login` and change the password immediately (Supabase Studio → Authentication, or add a password-change flow later). Additional admins can be added the same way, or by inserting directly into `admins` via Supabase Studio once you trust the requester.

## Local development

```bash
npm run dev       # dev server at http://localhost:4321
npm run build     # astro check (types) + production build
npm run preview   # serve the production build locally
npm test          # vitest, single run
```

## Testing

`tests/` covers the logic that's cheapest to get wrong silently:
- **`validation.test.ts`** — every public form's zod schema (join, contact, spotlight nomination, project submission), including the honeypot and consent-literal checks.
- **`utils.test.ts`** — slugify, initials, WAT-aware date helpers, share-link building.
- **`data-fallback.test.ts`** — confirms the sample-data fallback actually activates (and is labelled) when Supabase isn't configured, rather than silently returning nothing.

`npm run build` also runs `astro check`, which full-project type-checks every `.astro`/`.ts` file, including all page frontmatter.

What's **not** covered by automated tests: the admin login/authorization redirect behavior and the live Supabase-backed data flows were instead verified manually (`curl` against a running dev server, both with Supabase unconfigured and against the live `abuja-ai-data-polyglot` project) — login → session → `/admin` dashboard, and the member directory/detail pages against real seeded data. Worth adding as proper integration tests later: exercise the full join → admin-approve → public-directory flow against a disposable Supabase project or the local Supabase CLI stack in CI.

## Deploying to Netlify

1. Push this repository to GitHub.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build settings (also captured in `netlify.toml`, so these should autofill):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add all environment variables from `.env.example` under **Site settings → Environment variables** (Production context at minimum). Do **not** add a real `SUPABASE_SERVICE_ROLE_KEY` value to any file in git — Netlify's env var UI is the only place it should live.
5. Deploy. The `@astrojs/netlify` adapter (configured with `output: "server"`) builds this as Netlify Functions, so all SSR pages and `/api/**` routes work without further redirect configuration.
6. **Smoke test after deploy**: load `/`, `/members`, `/join` (submit a test registration), `/admin/login` (sign in as the bootstrap admin), approve that test registration in `/admin/members`, then confirm it appears at `/members` once you also set its visibility/consent appropriately. Check `/sitemap.xml` and `/robots.txt` resolve. Delete the test registration afterward via Supabase Studio.

## Updating the site after deployment

- **Content** (members, spotlights, articles, events, projects, submissions): handled entirely through `/admin` — no code change or redeploy needed. Pages read from Supabase at request time (`output: "server"`), so publishing is immediate.
- **Code/design**: push to the branch Netlify is watching; it rebuilds and redeploys automatically. Use a separate Netlify "deploy preview" (automatic on PRs) plus a separate Supabase project for staging if you want to test schema or RLS changes before they hit production.
- **Database schema changes**: add a new numbered file under `supabase/migrations/`, apply it to each environment (`supabase db push` or run it by hand in the SQL editor), and never edit an already-applied migration file in place.

## Troubleshooting

- **`/admin` redirects in a loop, or 500s** — Supabase env vars are missing or wrong. Confirm `PUBLIC_SUPABASE_URL`/`PUBLIC_SUPABASE_ANON_KEY` are set in the exact environment you're testing (local `.env` vs. Netlify).
- **Forms respond with "not configured yet"** — same cause as above; this is deliberate (see `middleware.ts` / each `api/*.ts`'s `isSupabaseConfigured` guard) rather than a raw 500.
- **A new admin can't log in** — confirm there's a matching row in `admins.user_id` for their Supabase Auth user id; auth alone isn't enough, `is_admin()` must also return true.
- **Member doesn't appear in the public directory after admin approval** — both gates must be true: the member's own `profile_visibility='public'` (their consent) **and** `public_profile_approved=true` (admin's separate approval). Check both in `/admin/members`.
- **Build fails on `astro check`** — run it locally (`npm run build` includes it) to see the exact file/line; this project ships with zero type errors as of this commit, so a failure means something changed.

## Known limitations & recommended follow-ups

- **Rate limiting** (`src/lib/rate-limit.ts`) is in-memory and best-effort only — it doesn't survive across Netlify Function cold starts/instances. Turnstile (already wired, just needs keys) is the real spam defence; for stronger rate limiting, add a shared store (e.g. Upstash Redis) or a Netlify/Cloudflare edge rule.
- **Default OG share image** (`public/og-default.svg`) is an SVG placeholder. Replace with a branded 1200×630 PNG/JPG before launch — some platforms (notably WhatsApp) handle SVG Open Graph images unreliably.
- **Project contributor credits**: adding a member as a credited contributor on a project (`project_contributors`) is done directly in Supabase Studio for this first version rather than from the admin UI — flagged in `/admin/projects`. Low effort to add a proper picker later.
- **No generated Supabase types yet** — the three Supabase client files are typed `any` for table rows (see `supabase-admin.ts` comment). Run `supabase gen types typescript` and wire in a `Database` type for full type safety on queries.
- **Privacy policy wording** (`/privacy`) is a structured draft, not legal advice — it's explicitly flagged on the page and needs review by someone qualified on Nigerian data-protection law (NDPA 2023) before being relied on, especially retention periods and any cross-border hosting disclosure.
- **No automated end-to-end test of the Supabase-backed flows** (see "Testing" above) — only unit tests plus manual `curl`/browser verification against the live project during development.

## Implementation notes by phase

**Phase 1 — Spec, schema, security model.** Entities and relationships: `supabase/migrations/0001_schema.sql`. RLS/grants/security model: `0002_rls_and_grants.sql` and "Security model" above. Key decisions: `submissions` as one shared moderation table instead of three; event speakers as JSONB (no independent identity, not worth a join table); directory-listing vs. spotlight/project-attribution consent kept genuinely separable at the RLS-policy level, not just in the UI.

**Phase 2 — Public site.** All pages under `src/pages/*.astro` (excluding `admin/`), `src/components/*`, `src/layouts/BaseLayout.astro`. Every list/detail page has a working empty state, and falls back to explicitly-labelled sample data (`src/lib/sample-data.ts`) when Supabase isn't configured, rather than a blank screen.

**Phase 3 — Supabase integration, registration, directory, search/filter.** `src/lib/data/*.ts`, `src/lib/supabase-public.ts`, `src/pages/api/join.ts`, `src/pages/members/*`. Verified against the live `abuja-ai-data-polyglot` project: migrations applied cleanly (14 tables, RLS on all of them), seeded data renders correctly end-to-end on `/`, `/members`, and `/members/[slug]`. This surfaced a real bug — PostgREST relationship-embed queries against `members` failed with `permission denied` for `anon` despite column grants covering every requested field — fixed by switching `members.ts`/`spotlights.ts`/`projects.ts` to explicit-column queries plus an in-memory join (see "Security model" above). Join form validation was also verified end-to-end via `curl` with Supabase unconfigured (fails gracefully).

**Phase 4 — Admin, spotlights, blog, events, projects.** `src/middleware.ts`, `src/layouts/AdminLayout.astro`, `src/pages/admin/*`, `src/pages/api/admin/**`. Admin content management uses simple list + inline create/edit forms per type rather than a general-purpose CMS, per the brief's "simplest reliable approach" guidance.

**Phase 5 — Security, validation, tests, SEO.** RLS/grants as above; `src/lib/validation.ts` (zod, shared client+server); `src/lib/rate-limit.ts` + `src/lib/turnstile.ts`; `tests/*`; `src/components/Seo.astro`, `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`. Tests: 23 passing (`npm test`); `astro check` passes with 0 errors across 78 files; full `astro build` succeeds; manually smoke-tested all 15 public/admin routes plus all 4 form endpoints against a running dev server with no Supabase configured, which caught and fixed two real bugs (an `/admin` 500 instead of a redirect, and `null`-vs-`undefined` form-field handling breaking the join schema) before this was called done.

**Phase 6 — Deployment & docs.** `netlify.toml`, `.env.example`, `scripts/create-first-admin.mjs`, this README. Supabase side is live: project `abuja-ai-data-polyglot` (West Europe/London) created, both migrations applied, first admin bootstrapped and verified via a full login → session → dashboard round-trip. Source is pushed to GitHub at `BWOlatunji/abuja-ai-data-polyglot-community`. Remaining limitation: no live Netlify deployment has been performed yet — the Netlify steps above are written from the adapter's documented behavior and should be smoke-tested on first real deploy.
