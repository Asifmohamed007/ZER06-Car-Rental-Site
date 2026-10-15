# ZER06 Rental Cars

Car rental website for the Qatar market: public site, online booking requests, WhatsApp enquiries and a protected admin dashboard.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · PostgreSQL (via `postgres.js`, plain parameterised SQL, no ORM binary) · Zod validation · bcrypt password hashing · Vitest.

---

## 1. What you need

| Account / tool | Why | Free option |
|---|---|---|
| Node.js 20 or newer | Run and build the app | — |
| PostgreSQL 14+ database | Stores cars, bookings, settings, admins | Neon, Supabase or Railway free tiers |
| Hosting that runs Next.js | Serves the website | Vercel or Netlify |
| A domain name (optional) | Your own web address | — |

No other services are required. Images you upload in the admin are stored in the database, so there is no separate storage account.

---

## 2. Run it on your computer

```bash
npm install
cp .env.example .env          # then edit .env (see below)
npm run db:migrate            # creates the tables
npm run db:seed               # adds default settings and 5 SAMPLE cars (only if the tables are empty)
npm run admin:create -- you@yourdomain.com   # prompts for a password (min 12 characters)
npm run dev                   # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

### Environment variables (`.env`)

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgres://user:pass@host:5432/zer06` | From your database provider. **Never commit this.** |
| `DATABASE_SSL` | `true` | `true` for hosted databases, `false` for a local one |
| `NEXT_PUBLIC_SITE_URL` | `https://www.zer06rentals.qa` | Your live address, no trailing slash. Used in the sitemap, canonical links and social previews |
| `TRUST_PROXY` | `1` | Leave at 1 on Vercel/Netlify. Used to read visitor IPs for rate limiting |
| `DATABASE_POOL_MAX` | `5` | Optional. Lower it (e.g. 3) on small free database plans |

---

## 3. Deploy

### Database (example: Neon)
1. Create a project at neon.tech and copy the **pooled** connection string.
2. On your computer, point `.env` at it and run `npm run db:migrate`, `npm run db:seed`, then `npm run admin:create -- you@yourdomain.com`.

### Website (example: Vercel)
1. Push this folder to a private GitHub repository (`.env` is already git-ignored).
2. Import the repository in Vercel. Framework: Next.js (auto-detected).
3. Add the environment variables from the table above in **Project → Settings → Environment Variables**.
4. Deploy. Build command `npm run build`, start command `npm start` (Vercel handles both).
5. Add your domain in Vercel, then update `NEXT_PUBLIC_SITE_URL` and redeploy.

Netlify works the same way with its Next.js runtime. Any host that runs `npm run build && npm start` on Node 20 also works.

### After every schema change
Run `npm run db:migrate` against the production database. Migrations are plain SQL in `migrations/`, applied once each, in order, inside a transaction.

---

## 4. Admin accounts

- There is **no default admin or password**. Accounts are only created with `npm run admin:create`, run by someone with database access.
- Roles: `owner` (everything, including Settings and permanent deletion) and `staff` (bookings, enquiries, cars, photos, blocked dates).
  `npm run admin:create -- staff@yourdomain.com --role staff`
- Re-running the command for an existing email resets the password and signs that account out everywhere.
- Sessions last 12 hours. Sign-in is limited to 6 attempts per email and 20 per IP every 15 minutes.

---

## 5. Changing content

Almost everything is edited in **/admin**, with no code changes:

| What | Where |
|---|---|
| Phone, email, WhatsApp number, address, opening hours, Instagram | Admin → Settings → Business and contact |
| Pickup/return locations and fees, grace period, minimum/maximum days, approval on/off, extra-driver fee, tax | Admin → Settings → Booking rules |
| Rental policies (deposit, fuel, mileage, cancellation, insurance, licence, etc.) | Admin → Settings → Rental policies |
| Hero headline and image, weddings section, FAQ, reviews | Admin → Settings → Homepage |
| About page text | Admin → Settings → About page |
| Cars, prices, specs, photos, blocked dates | Admin → Vehicles |

**Replacing the logo:** replace `public/brand/logo.jpeg`, `logo-192.png` and `logo-512.png`, plus `src/app/icon.png` (96×96) and `src/app/apple-icon.png` (180×180), keeping the same file names. Then redeploy.

**Brand colours and fonts:** `tailwind.config.ts` (colours) and `src/app/layout.tsx` (fonts, self-hosted via `@fontsource`).

**Business name:** the default spelling is "ZER06 Rental Cars" (with a zero). Your Instagram handle uses "zero6" (letter O). Change it in Settings → Business name if you want them to match.

---

## 6. How booking works

1. The customer picks dates, times and locations. The page asks the server for a live price and availability check.
2. They submit their details. The server:
   - validates every field again (never trusting the browser),
   - locks the car's database row so simultaneous requests are handled one at a time,
   - re-checks overlaps with active bookings and blocked dates,
   - recalculates the price from the database rate and settings (any price sent by the browser is ignored),
   - saves the booking with a unique reference like `Z6-7KQ3MPA`.
3. A PostgreSQL exclusion constraint (`bookings_no_overlap`) makes overlapping *pending* or *confirmed* bookings for the same car impossible, even if the application code were bypassed.
4. With **"Review each request"** on (default), new bookings are **pending** and the customer is told plainly that this is not a confirmation. Staff confirm or cancel from Admin → Bookings. Turn it off to confirm automatically.
5. Cancelled bookings free the dates. Status rules: pending → confirmed or cancelled; confirmed → completed or cancelled; cancelled and completed are final.
6. Resubmitting the same form (double click, refresh, flaky connection) returns the original booking instead of creating a duplicate.
7. The customer's confirmation page link contains a private token. Without it, booking details aren't shown.

**Billing rule:** one day per started 24 hours from pickup, after a configurable grace period (default 60 minutes). With the default, 25h00 is 1 day and 25h01 is 2 days. Minimum rental is configurable. All times use the `Asia/Qatar` timezone and are stored in UTC.

**WhatsApp:** buttons open a prefilled message (car, dates, location, estimated price). These are enquiries, not bookings, and the site says so. Set the number in Settings; leave it empty to hide all WhatsApp buttons (they fall back to the contact page).

---

## 7. Payments

Currently offered: **pay on arrival** and **arrange payment with the team after confirmation**. No card details are collected anywhere on the site. Admins record payment status manually per booking (unpaid, pending, paid, failed, refunded).

**Adding online payments later** needs a merchant account with a provider that supports Qatar (for example a local bank gateway, or an international provider such as Stripe where available to you). The integration should:
- create the payment on the server with the booking's stored total,
- mark a booking **paid only from the provider's server-to-server webhook**, after verifying its signature, never from the browser redirect,
- store the provider's payment ID, never card numbers or CVV.
The `payment_status` column and admin controls are already in place for this.

---

## 8. Testing

```bash
npm run typecheck                 # TypeScript
npm run lint                      # ESLint
npm test                          # 46 unit tests: pricing, dates/timezones, booking rules, validation, WhatsApp links, upload checks, settings
npm run test:integration          # 14 tests against a real PostgreSQL test database (see below)
npm run build && npm start        # production build
npm run test:smoke                # 40 HTTP checks against the running site
```

- **Integration tests** need an empty database whose name contains `test`. Default: `postgres://zero6:devpass@localhost:5432/zero6_test`, or set `TEST_DATABASE_URL`. They **drop and recreate** that database's schema. They cover price calculation from database values, duplicate submissions, overlap rejection, back-to-back bookings, **20 simultaneous attempts on the same car (exactly one succeeds)**, the database-level overlap constraint, cancellation freeing dates, status transitions, blocked dates, paused/archived cars and rate limiting.
- **Smoke tests** create one booking and one enquiry (both marked as test data and cancelled/handled afterwards) in whichever database `.env` points to. Use a local or staging database, not production. They check every public page, SEO tags, sitemap, 404s, security headers, the quote/booking/enquiry APIs, duplicate and overlapping bookings, token-protected confirmation pages, cross-site request blocking, and that admin pages reject missing or forged sessions and load with a valid one.

### Results at handover
All of the above passed: typecheck, lint, 46/46 unit, 14/14 integration, production build, 40/40 smoke (run twice to confirm repeatability). Pages were also checked in a headless browser at 1440px and 390px wide: no horizontal overflow, scroll-reveal content appears, header stays pinned.

### Not tested
- **Placeholder car photos.** The sample cars use Unsplash links that could not be reached from the build environment, so they were never seen loading. If a photo fails, the site shows a branded placeholder instead of a broken image. Replace them with your own photos in Admin → Vehicles.
- **Admin sign-in form submission, clicking through the admin UI, and photo upload through the browser.** The underlying logic is tested (sessions, protection, upload type/size checks); the browser forms themselves were not clicked through end to end.
- **Screen readers and real phones.** Semantic HTML, labels, focus outlines, keyboard access and reduced-motion support are built in, but haven't been tested with assistive technology or on physical devices.
- **Online payments.** Not built (see section 7).

---

## 9. Before you launch

- [ ] Replace all policy text ("To be confirmed by ZER06 before launch.") and check it against current Qatar regulations.
- [ ] Replace or archive the 5 sample cars. Their years, specs and prices are placeholders.
- [ ] Set real phone, email, WhatsApp number, address and opening hours.
- [ ] Upload your own car photos.
- [ ] Edit the About page story.
- [ ] Only add customer reviews that are genuine and that you have permission to publish (the section stays hidden while empty).
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your real domain, then submit `/sitemap.xml` in Google Search Console.
- [ ] Turn on automatic backups with your database provider.

---

## 10. Backups

Most hosted providers (Neon, Supabase) include automatic backups or point-in-time restore. Turn this on. For a manual copy:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=zer06-$(date +%F).dump      # back up
pg_restore --clean --no-owner --dbname="$DATABASE_URL" zer06-2026-10-14.dump   # restore
```

Uploaded photos are inside the database, so one dump contains everything.

---

## 11. Project layout

```
migrations/            SQL schema (tables, overlap constraint)
scripts/               migrate, seed, create-admin, smoke-test
src/app/(site)/        public pages: home, fleet, car pages, booking, about, contact, policies
src/app/admin/         login, dashboard, bookings, vehicles, enquiries, settings + server actions
src/app/api/           quote, bookings, availability, enquiries, images
src/components/        UI components (booking panel, calendar, cards, motion)
src/lib/               pure logic: pricing, booking rules, timezones, validation, WhatsApp, settings
src/server/            database access, auth, rate limiting, logging (server-only)
tests/                 unit and integration tests
```

## 12. Security summary

- Every admin page and action validates the session against the database. The middleware cookie check is only a first redirect.
- Passwords hashed with bcrypt (cost 12). Session tokens are random and stored hashed. Cookies are HttpOnly, SameSite=Lax, and Secure in production.
- All input validated with Zod on the server. All SQL is parameterised.
- Rate limits stored in the database, so they work across serverless instances: bookings 10/hour per IP, enquiries 5/hour, price checks 120/10 min, sign-in as above.
- Public POST endpoints reject cross-site requests. Forms include a hidden honeypot field against bots.
- Uploads are checked by file signature (JPEG, PNG, WebP only, 5 MB max) and served with `nosniff` and a locked-down content security policy.
- Security headers: HSTS, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy.
- Cars with bookings can only be archived, never deleted. Admin actions are written to `audit_log`.
- Logs never include customer names, phones, emails or tokens.
