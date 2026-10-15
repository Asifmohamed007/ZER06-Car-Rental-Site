import { createInterface } from "readline";
import bcrypt from "bcryptjs";
import { connect } from "./db";

/**
 * Creates or resets an admin account. There is no default password.
 *   npm run admin:create -- owner@yourdomain.com            (prompts for password)
 *   ADMIN_PASSWORD='...' npm run admin:create -- owner@... --role staff
 */
function ask(q: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a); }));
}

async function main() {
  const args = process.argv.slice(2);
  const email = (args.find((a) => a.includes("@")) ?? (await ask("Admin email: "))).trim().toLowerCase();
  const role = args.includes("--role") ? args[args.indexOf("--role") + 1] : "owner";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email");
  if (!["owner", "staff"].includes(role)) throw new Error("--role must be owner or staff");
  const password = process.env.ADMIN_PASSWORD ?? (await ask("Password (min 12 characters): "));
  if (password.length < 12) throw new Error("Password must be at least 12 characters");
  const hash = await bcrypt.hash(password, 12);
  const sql = connect();
  await sql`
    INSERT INTO admins (email, password_hash, role) VALUES (${email}, ${hash}, ${role}::admin_role)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, disabled = FALSE`;
  await sql`DELETE FROM admin_sessions WHERE admin_id = (SELECT id FROM admins WHERE email = ${email})`;
  console.log(`Admin ${email} (${role}) is ready. Sign in at /admin/login`);
  await sql.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
