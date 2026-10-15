import "server-only";
import { sql } from "./db";

export async function audit(adminId: number, action: string, entity: string, entityId?: string | number, detail: Record<string, unknown> = {}) {
  try {
    await sql()`INSERT INTO audit_log (admin_id, action, entity, entity_id, detail) VALUES (${adminId}, ${action}, ${entity}, ${entityId == null ? null : String(entityId)}, ${sql().json(detail as Record<string, string>)})`;
  } catch {
    /* auditing must never break the admin action */
  }
}
