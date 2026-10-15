"use client";
import { useFormState } from "react-dom";
import { loginAction } from "../actions";
import { Submit } from "@/components/admin/forms";

export function LoginForm() {
  const [state, action] = useFormState(loginAction, {});
  return (
    <form action={action} className="space-y-5">
      <div><label className="label" htmlFor="l-e">Email</label><input id="l-e" name="email" type="email" className="input" autoComplete="username" required /></div>
      <div><label className="label" htmlFor="l-p">Password</label><input id="l-p" name="password" type="password" className="input" autoComplete="current-password" required /></div>
      {state.message && <p role="alert" className="text-bad">{state.message}</p>}
      <Submit className="btn-primary w-full" pending="Signing in…">Sign in</Submit>
    </form>
  );
}
