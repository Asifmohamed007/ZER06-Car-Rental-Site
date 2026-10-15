import "server-only";
import { sql } from "./db";

export async function createEnquiry(e: { name: string; email: string; phone: string; subject: string; message: string }) {
  await sql()`INSERT INTO enquiries ${sql()(e)}`;
}

export async function listEnquiries(handled?: boolean) {
  return sql()<{ id: string; name: string; email: string; phone: string; subject: string; message: string; is_handled: boolean; created_at: Date }[]>`
    SELECT * FROM enquiries ${handled === undefined ? sql()`` : sql()`WHERE is_handled = ${handled}`} ORDER BY created_at DESC LIMIT 300`;
}

export async function setEnquiryHandled(id: number, handled: boolean) {
  await sql()`UPDATE enquiries SET is_handled = ${handled} WHERE id = ${id}`;
}
