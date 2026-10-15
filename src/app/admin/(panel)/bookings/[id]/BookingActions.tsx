"use client";
import { useFormState } from "react-dom";
import { bookingStatusAction, bookingDetailsAction } from "@/app/admin/actions";
import { Submit, Message } from "@/components/admin/forms";

const LABEL: Record<string, [string, string, string?]> = {
  confirmed: ["Confirm booking", "btn-primary btn-sm"],
  completed: ["Mark completed", "btn-ghost btn-sm"],
  cancelled: ["Cancel booking", "btn-danger btn-sm", "Cancel this booking? The car will become available for these dates again."],
};

export function StatusButtons({ id, next }: { id: number; next: string[] }) {
  const [state, action] = useFormState(bookingStatusAction, {});
  if (next.length === 0) return <p className="text-cream/60">This booking is closed. No further status changes.</p>;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {next.map((n) => (
          <form key={n} action={action}>
            <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={n} />
            <Submit className={LABEL[n][1]} confirm={LABEL[n][2]} pending="Updating…">{LABEL[n][0]}</Submit>
          </form>
        ))}
      </div>
      <div className="mt-3"><Message state={state} /></div>
    </div>
  );
}

export function DetailsForm({ id, paymentStatus, adminNotes }: { id: number; paymentStatus: string; adminNotes: string }) {
  const [state, action] = useFormState(bookingDetailsAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <div><label className="label" htmlFor="ps">Payment status</label>
        <select id="ps" name="paymentStatus" defaultValue={paymentStatus} className="input">
          {["unpaid", "pending", "paid", "failed", "refunded"].map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
        <p className="hint">Only mark &ldquo;paid&rdquo; once you have actually received the money.</p>
      </div>
      <div><label className="label" htmlFor="an">Internal notes</label><textarea id="an" name="adminNotes" defaultValue={adminNotes} rows={4} className="input" /></div>
      <Submit>Save</Submit>
      <Message state={state} />
    </form>
  );
}
