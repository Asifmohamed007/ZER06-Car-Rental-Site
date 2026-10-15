import "./env";
import postgres from "postgres";
export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return postgres(url, { max: 1, ssl: process.env.DATABASE_SSL === "true" ? "require" : false, onnotice: () => {} });
}
