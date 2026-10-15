"use client";
import { useState } from "react";

export function ContactForm({ defaultSubject = "" }: { defaultSubject?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    setState("sending"); setError(null); setFields({});
    try {
      const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setState("sent"); form.reset(); return; }
      setFields(data.fields ?? {}); setError(data.error ?? "Your message wasn't sent. Please try again."); setState("idle");
    } catch {
      setError("Your message wasn't sent because we couldn't reach the server. Check your connection and try again."); setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="cut panel p-8">
        <p className="h3">Message sent</p>
        <p className="mt-3 text-cream/75">Thanks. We&apos;ll reply by email or phone, usually within our business hours.</p>
        <button type="button" className="btn-ghost btn-sm mt-6" onClick={() => setState("idle")}>Send another message</button>
      </div>
    );
  }
  const f = (k: string) => ({ "aria-invalid": fields[k] ? true : undefined, "aria-describedby": fields[k] ? `c-${k}-err` : undefined });
  const err = (k: string) => fields[k] && <p id={`c-${k}-err`} className="err">{fields[k]}</p>;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2" aria-label="Contact form">
      <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" name="name" className="input" autoComplete="name" required maxLength={120} {...f("name")} />{err("name")}</div>
      <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" className="input" autoComplete="email" required maxLength={200} {...f("email")} />{err("email")}</div>
      <div><label className="label" htmlFor="c-phone">Phone (optional)</label><input id="c-phone" name="phone" type="tel" className="input" autoComplete="tel" maxLength={30} {...f("phone")} />{err("phone")}</div>
      <div><label className="label" htmlFor="c-subj">Subject (optional)</label><input id="c-subj" name="subject" className="input" maxLength={150} defaultValue={defaultSubject} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" className="input" rows={6} required maxLength={4000} {...f("message")} />{err("message")}</div>
      <div className="hidden" aria-hidden><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p role="alert" className="text-bad sm:col-span-2">{error}</p>}
      <button className="btn-primary sm:col-span-2 sm:justify-self-start" disabled={state === "sending"} aria-busy={state === "sending"}>{state === "sending" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
