"use client";
import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/admin/actions";

export function Submit({ children, className = "btn-primary btn-sm", pending: pendingLabel = "Saving…", confirm }: { children: React.ReactNode; className?: string; pending?: string; confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}
      onClick={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function Message({ state }: { state: FormState }) {
  if (!state.message) return null;
  return <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-ok" : "text-bad"}>{state.message}</p>;
}

/** Form bound to a server action that returns FormState, with inline field errors. */
export function ActionForm({ action, children, className, fieldsRender }: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode | ((state: FormState) => React.ReactNode);
  className?: string;
  fieldsRender?: boolean;
}) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className={className} encType="multipart/form-data">
      {typeof children === "function" ? children(state) : children}
      {!fieldsRender && <div className="mt-3"><Message state={state} /></div>}
    </form>
  );
}
