import "server-only";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";

export const SESSION_COOKIE = "z6_admin";
const SESSION_HOURS = 12;
// Pre-computed hash used when an email doesn't exist, so login timing doesn't reveal valid accounts.
const DUMMY_HASH = "$2a$12$cF4fgFE5YS6RZpZG3nFKGO87/ssDPCGAAQrQle2SljXZo0LCVPA.q";

export type Admin = { id: number; email: string; name: string; role: "owner" | "staff" };

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyCredentials(email: string, password: string): Promise<Admin | null> {
  const rows = await sql()<{ id: string; email: string; name: string; role: Admin["role"]; password_hash: string; disabled: boolean }[]>`
    SELECT id, email, name, role, password_hash, disabled FROM admins WHERE email = ${email.trim().toLowerCase()}`;
  const row = rows[0];
  const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok || row.disabled) return null;
  return { id: Number(row.id), email: row.email, name: row.name, role: row.role };
}

export async function startSession(adminId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_HOURS * 3_600_000);
  await sql()`INSERT INTO admin_sessions (token_hash, admin_id, expires_at) VALUES (${hashToken(token)}, ${adminId}, ${expires})`;
  await sql()`DELETE FROM admin_sessions WHERE expires_at < now()`;
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires,
  });
}

export async function endSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await sql()`DELETE FROM admin_sessions WHERE token_hash = ${hashToken(token)}`;
  cookies().delete(SESSION_COOKIE);
}

/** Validates the session against the database on every call. Never trust the cookie's mere presence. */
export async function currentAdmin(): Promise<Admin | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const rows = await sql()<{ id: string; email: string; name: string; role: Admin["role"] }[]>`
    SELECT a.id, a.email, a.name, a.role FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now() AND NOT a.disabled`;
  return rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null;
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(role?: "owner"): Promise<Admin> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  if (role === "owner" && admin.role !== "owner") throw new ForbiddenError();
  return admin;
}

export class ForbiddenError extends Error {
  constructor() { super("Only the owner account can do this."); }
}
