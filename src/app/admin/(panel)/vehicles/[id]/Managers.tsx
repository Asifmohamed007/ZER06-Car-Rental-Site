"use client";
import { useFormState } from "react-dom";
import { addBlockAction, addImageUrlAction, deleteVehicleAction, uploadImageAction } from "@/app/admin/actions";
import { Submit, Message } from "@/components/admin/forms";

export function UploadForm({ vehicleId }: { vehicleId: number }) {
  const [state, action] = useFormState(uploadImageAction, {});
  return (
    <form action={action} className="space-y-3" key={state.ok ? String(Date.now()) : "upload"}>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div><label className="label" htmlFor="up-f">Upload a photo</label><input id="up-f" name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="input py-2.5" /><p className="hint">JPEG, PNG or WebP, up to 5 MB. Landscape photos look best.</p></div>
      <div><label className="label" htmlFor="up-a">Description for screen readers</label><input id="up-a" name="alt" className="input" maxLength={200} placeholder="White SUV parked outside a hotel" /></div>
      <Submit pending="Uploading…">Upload</Submit>
      <Message state={state} />
    </form>
  );
}

export function UrlForm({ vehicleId }: { vehicleId: number }) {
  const [state, action] = useFormState(addImageUrlAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div><label className="label" htmlFor="u-u">Or add an Unsplash / Pexels image link</label><input id="u-u" name="url" type="url" className="input" placeholder="https://images.unsplash.com/…" /></div>
      <input name="alt" className="input" maxLength={200} placeholder="Image description" aria-label="Image description" />
      <Submit className="btn-ghost btn-sm">Add link</Submit>
      <Message state={state} />
    </form>
  );
}

export function BlockForm({ vehicleId, today }: { vehicleId: number; today: string }) {
  const [state, action] = useFormState(addBlockAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div><label className="label" htmlFor="bl-sd">From</label><input id="bl-sd" name="startDate" type="date" min={today} required className="input" /></div>
      <div><label className="label" htmlFor="bl-st">Time</label><input id="bl-st" name="startTime" type="time" defaultValue="00:00" className="input" /></div>
      <div><label className="label" htmlFor="bl-ed">Until</label><input id="bl-ed" name="endDate" type="date" min={today} required className="input" /></div>
      <div><label className="label" htmlFor="bl-et">Time</label><input id="bl-et" name="endTime" type="time" defaultValue="23:59" className="input" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="bl-r">Reason (internal)</label><input id="bl-r" name="reason" className="input" maxLength={200} placeholder="Service, private hire…" /></div>
      <div className="sm:col-span-2 flex items-center gap-4"><Submit>Block these dates</Submit><Message state={state} /></div>
    </form>
  );
}

export function DeleteForm({ vehicleId }: { vehicleId: number }) {
  const [state, action] = useFormState(deleteVehicleAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={vehicleId} />
      <Submit className="btn-danger btn-sm" confirm="Delete this car permanently? This can't be undone." pending="Deleting…">Delete permanently</Submit>
      <div className="mt-3"><Message state={state} /></div>
    </form>
  );
}
