import { requireAdmin } from "@/server/auth";
import { listEnquiries } from "@/server/enquiries";
import { getSettings } from "@/server/settings";
import { formatDateTime } from "@/lib/format";
import { enquiryHandledAction } from "@/app/admin/actions";

export default async function EnquiriesPage({ searchParams }: { searchParams: { show?: string } }) {
  await requireAdmin();
  const handled = searchParams.show === "all" ? undefined : false;
  const [rows, s] = await Promise.all([listEnquiries(handled), getSettings()]);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h2">Enquiries</h1>
        <a href={handled === false ? "?show=all" : "?"} className="text-sm underline">{handled === false ? "Show all, including answered" : "Show unanswered only"}</a>
      </div>
      {rows.length === 0 ? <p className="mt-8 text-cream/60">No enquiries to show.</p> : (
        <ul className="mt-6 space-y-4">
          {rows.map((e) => (
            <li key={e.id} className={`panel cut cut-sm p-5 ${e.is_handled ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-medium">{e.subject || "General enquiry"}</p>
                  <p className="text-sm text-cream/60">{e.name}, <a className="underline" href={`mailto:${e.email}`}>{e.email}</a>{e.phone && <>, <a className="underline" href={`tel:${e.phone}`}>{e.phone}</a></>}</p>
                </div>
                <p className="text-sm text-cream/55">{formatDateTime(e.created_at, s.regional.timezone)}</p>
              </div>
              <p className="mt-3 whitespace-pre-line text-cream/85">{e.message}</p>
              <form action={enquiryHandledAction} className="mt-4">
                <input type="hidden" name="id" value={e.id} /><input type="hidden" name="handled" value={e.is_handled ? "0" : "1"} />
                <button className="btn-ghost btn-sm">{e.is_handled ? "Mark as unanswered" : "Mark as answered"}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
