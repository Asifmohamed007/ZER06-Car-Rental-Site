import { connect } from "./db";
import { defaultSettings } from "../src/lib/settings-schema";

/**
 * Safe seed: only fills empty tables. It never overwrites real vehicles or settings.
 * The cars below are SAMPLE listings based on brands shown on the ZER06 Instagram page.
 * Prices, years, specs and photos are placeholders: edit or archive them in /admin/vehicles.
 */
const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

const vehicles = [
  {
    slug: "suzuki-wagon-r", brand: "Suzuki", model: "Wagon R", year: 2023, category: "economy", transmission: "automatic", seats: 5,
    fuel_type: "Petrol", daily_rate: 90, deposit: 500, is_featured: true,
    summary: "Compact, easy to park and light on fuel. A practical pick for city driving.",
    description: "A tall, roomy hatchback that makes short work of city errands and daily commutes. Easy to drive, simple to park and economical on fuel.",
    features: ["Air conditioning", "Bluetooth audio", "Rear parking sensors", "Five doors"],
    images: [U("photo-1549399542-7e3f8b79c341"), U("photo-1502877338535-766e1452684a")],
  },
  {
    slug: "honda-city", brand: "Honda", model: "City", year: 2023, category: "sedan", transmission: "automatic", seats: 5,
    fuel_type: "Petrol", daily_rate: 130, deposit: 750, is_featured: false,
    summary: "A comfortable sedan with a generous boot for airport runs and longer trips.",
    description: "Smooth, quiet and spacious for its size. A comfortable sedan for business trips, airport transfers and family days out.",
    features: ["Air conditioning", "Apple CarPlay / Android Auto", "Reversing camera", "Cruise control"],
    images: [U("photo-1555215695-3004980ad54e"), U("photo-1511919884226-fd3cad34687c")],
  },
  {
    slug: "toyota-camry", brand: "Toyota", model: "Camry", year: 2024, category: "sedan", transmission: "automatic", seats: 5,
    fuel_type: "Hybrid", daily_rate: 180, deposit: 1000, is_featured: true,
    summary: "Executive comfort and hybrid efficiency for business and family travel.",
    description: "A refined midsize sedan with a quiet cabin, plenty of rear legroom and hybrid efficiency.",
    features: ["Hybrid engine", "Leather seats", "Adaptive cruise control", "Wireless charging"],
    images: [U("photo-1552519507-da3b142c6e3d"), U("photo-1525609004556-c46c7d6cf023")],
  },
  {
    slug: "mahindra-thar", brand: "Mahindra", model: "Thar", year: 2024, category: "suv", transmission: "automatic", seats: 4,
    fuel_type: "Diesel", daily_rate: 250, deposit: 1500, is_featured: true,
    summary: "Rugged 4x4 with presence. Popular for photoshoots, events and weekend adventures.",
    description: "A head-turning off-roader with real 4x4 ability. A favourite for wedding entries, photoshoots and weekend escapes.",
    features: ["4x4", "Convertible hard top", "Touchscreen infotainment", "Hill descent control"],
    images: [U("photo-1519641471654-76ce0107ad1b"), U("photo-1533473359331-0135ef1b58bf")],
  },
  {
    slug: "toyota-land-cruiser", brand: "Toyota", model: "Land Cruiser", year: 2024, category: "luxury", transmission: "automatic", seats: 7,
    fuel_type: "Petrol", daily_rate: 650, deposit: 3000, is_featured: true,
    summary: "Full-size luxury SUV with seven seats. Made for occasions and long desert drives.",
    description: "The full-size SUV that does everything: seven seats, a premium cabin and the capability to leave the tarmac behind.",
    features: ["Seven seats", "Premium leather interior", "360° camera", "Four-zone climate control"],
    images: [U("photo-1503376780353-7e6692767b70"), U("photo-1494976388531-d1058494cdd8")],
  },
];

async function main() {
  const sql = connect();
  const [{ n: settingsCount }] = await sql<{ n: string }[]>`SELECT count(*) AS n FROM settings WHERE key = 'site'`;
  if (Number(settingsCount) === 0) {
    await sql`INSERT INTO settings (key, value) VALUES ('site', ${sql.json(defaultSettings)})`;
    console.log("seeded default settings");
  }
  const [{ n }] = await sql<{ n: string }[]>`SELECT count(*) AS n FROM vehicles`;
  if (Number(n) > 0) {
    console.log("vehicles already present, skipping vehicle seed");
  } else {
    for (const { images, features, ...v } of vehicles) {
      const [{ id }] = await sql<{ id: string }[]>`INSERT INTO vehicles ${sql({ ...v, features: sql.json(features) })} RETURNING id`;
      for (const [i, url] of images.entries()) {
        await sql`INSERT INTO vehicle_images (vehicle_id, external_url, alt, sort_order) VALUES (${id}, ${url}, ${`${v.year} ${v.brand} ${v.model}`}, ${i})`;
      }
    }
    console.log(`seeded ${vehicles.length} sample vehicles`);
  }
  await sql.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
