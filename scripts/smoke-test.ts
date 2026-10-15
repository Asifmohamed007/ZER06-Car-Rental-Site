/**
 * End-to-end HTTP smoke test against a running server (npm run build && npm start).
 *   BASE_URL=http://localhost:3000 npm run test:smoke
 * Creates real records (one booking, one enquiry, one admin session) in the configured database.
 * Run it against a staging or local database, never production.
 */
import { randomBytes, createHash, randomUUID } from "crypto";
import { connect } from "./db";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let failures = 0;
const check = (name: string, cond: boolean, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra && !cond ? `  (${extra})` : ""}`); if (!cond) failures++; };
const get = (p: string, init: RequestInit = {}) => fetch(BASE + p, { redirect: "manual", ...init });
const post = (p: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(BASE + p, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

function dateIn(days: number) {
  const d = new Date(Date.now() + days * 86_400_000 + 3 * 3_600_000);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const sql = connect();
  const [v] = await sql<{ slug: string }[]>`SELECT slug FROM vehicles WHERE archived_at IS NULL AND is_available ORDER BY id LIMIT 1`;
  if (!v) throw new Error("Seed the database first (npm run db:seed)");
  // Release any slots held by earlier smoke runs so the test is repeatable.
  const cleanup = () => sql`UPDATE bookings SET status = 'cancelled', admin_notes = 'smoke test' WHERE customer_email = 'smoke@example.com' AND status IN ('pending','confirmed')`;
  await cleanup();

  for (const p of ["/", "/fleet", `/fleet/${v.slug}`, "/fleet?category=sedan", "/about", "/contact", "/policies", "/robots.txt", "/sitemap.xml"]) {
    const r = await get(p);
    check(`GET ${p} -> 200`, r.status === 200, String(r.status));
  }
  const home = await (await get("/")).text();
  check("home has title, description and JSON-LD", /<title>[^<]+<\/title>/.test(home) && /name="description"/.test(home) && home.includes("application/ld+json"));
  check("home has one h1", (home.match(/<h1/g) ?? []).length === 1);
  const detail = await (await get(`/fleet/${v.slug}`)).text();
  check("vehicle page has canonical and Car schema", detail.includes(`rel="canonical"`) && detail.includes('"@type":"Car"'));
  const filtered = await (await get("/fleet?transmission=manual&sort=price-asc")).text();
  check("filtered fleet page is noindex", /name="robots" content="noindex/.test(filtered));
  check("sitemap lists vehicle", (await (await get("/sitemap.xml")).text()).includes(`/fleet/${v.slug}`));
  check("unknown page -> 404", (await get("/no-such-page")).status === 404);
  check("unknown car -> 404", (await get("/fleet/no-such-car")).status === 404);
  check("security headers set", (await get("/")).headers.get("x-frame-options") === "DENY");

  // Availability + quote
  const month = dateIn(30).slice(0, 7);
  const av = await get(`/api/availability?vehicle=${v.slug}&month=${month}`);
  check("availability endpoint -> 200", av.status === 200);
  check("availability rejects bad input", (await get(`/api/availability?vehicle=${v.slug}&month=bad`)).status === 400);
  const window = { vehicleSlug: v.slug, pickupDate: dateIn(30), pickupTime: "10:00", returnDate: dateIn(32), returnTime: "10:00", pickupLocation: "office", returnLocation: "office", additionalDriver: false };
  const q = await post("/api/quote", window);
  const qj = await q.json();
  check("quote -> 200 with total", q.status === 200 && typeof qj.quote?.total === "number", JSON.stringify(qj));
  const bad = await post("/api/quote", { ...window, returnDate: dateIn(29) });
  check("quote rejects return before pickup", bad.status === 400);

  // Booking
  const key = randomUUID();
  const booking = { ...window, idempotencyKey: key, customerName: "Smoke Test", customerPhone: "+974 5555 0000", customerEmail: "smoke@example.com", driverAge: 30, notes: "automated smoke test", paymentMethod: "pay_on_arrival", acceptPolicies: true, total: 1 };
  const b1 = await post("/api/bookings", booking);
  const b1j = await b1.json();
  check("booking -> 201 pending", b1.status === 201 && b1j.status === "pending", JSON.stringify(b1j));
  const [stored] = await sql<{ total: number }[]>`SELECT total FROM bookings WHERE reference = ${b1j.reference}`;
  check("server ignored client-submitted total", stored?.total === qj.quote?.total);
  const b2 = await post("/api/bookings", booking);
  check("duplicate submit returns same reference", b2.status === 200 && (await b2.json()).reference === b1j.reference);
  const clash = await post("/api/bookings", { ...booking, idempotencyKey: randomUUID() });
  check("overlapping booking -> 409", clash.status === 409);
  const conf = await (await get(`/booking/${b1j.reference}?t=${key}`)).text();
  check("confirmation page shows reference and pending status", conf.includes(b1j.reference) && conf.includes("not a confirmed booking"));
  check("confirmation page needs the token", !(await (await get(`/booking/${b1j.reference}`)).text()).includes("smoke@example.com"));
  check("invalid booking -> 400", (await post("/api/bookings", { ...booking, customerEmail: "nope" })).status === 400);
  check("cross-site POST -> 403", (await post("/api/bookings", booking, { Origin: "https://evil.example" })).status === 403);

  // Enquiry
  check("enquiry validation -> 400", (await post("/api/enquiries", { name: "A", email: "x", message: "" })).status === 400);
  check("enquiry -> 201", (await post("/api/enquiries", { name: "Smoke Test", email: "smoke@example.com", message: "Automated smoke test message." })).status === 201);

  // Admin protection
  const noCookie = await get("/admin");
  check("admin without session redirects to login", [307, 308].includes(noCookie.status) && noCookie.headers.get("location")?.includes("/admin/login") === true);
  const forged = await get("/admin", { headers: { cookie: "z6_admin=forged-token" } });
  check("admin with forged cookie is rejected", forged.status !== 200 || !(await forged.text()).includes("Overview"));
  check("admin login page -> 200", (await get("/admin/login")).status === 200);

  const [admin] = await sql<{ id: string }[]>`SELECT id FROM admins ORDER BY id LIMIT 1`;
  if (admin) {
    const token = randomBytes(32).toString("base64url");
    await sql`INSERT INTO admin_sessions (token_hash, admin_id, expires_at) VALUES (${createHash("sha256").update(token).digest("hex")}, ${admin.id}, now() + interval '5 minutes')`;
    for (const p of ["/admin", "/admin/bookings", "/admin/vehicles", "/admin/enquiries", "/admin/settings"]) {
      const r = await get(p, { headers: { cookie: `z6_admin=${token}` } });
      check(`admin ${p} with valid session -> 200`, r.status === 200, String(r.status));
    }
    const list = await (await get(`/admin/bookings?q=${b1j.reference}`, { headers: { cookie: `z6_admin=${token}` } })).text();
    check("admin can find the new booking", list.includes(b1j.reference));
    await sql`DELETE FROM admin_sessions WHERE token_hash = ${createHash("sha256").update(token).digest("hex")}`;
  } else {
    console.log("SKIP  admin session checks (no admin account yet; run npm run admin:create)");
  }

  await cleanup();
  await sql`UPDATE enquiries SET is_handled = TRUE WHERE email = 'smoke@example.com'`;
  await sql.end();
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll smoke checks passed");
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
