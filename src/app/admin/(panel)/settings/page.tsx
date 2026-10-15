import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/settings";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const s = await getSettings();
  return (
    <>
      <h1 className="h2">Settings</h1>
      {admin.role !== "owner" ? (
        <p className="mt-6 text-cream/70">Only the owner account can change website settings.</p>
      ) : (
        <div className="mt-8"><SettingsForm s={s} /></div>
      )}
    </>
  );
}
