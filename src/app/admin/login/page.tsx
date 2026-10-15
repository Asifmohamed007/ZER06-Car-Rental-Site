import Image from "next/image";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/server/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await currentAdmin().catch(() => null)) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="glass cut w-full max-w-sm p-8">
        <Image src="/brand/logo-192.png" alt="" width={64} height={64} className="rounded-full" />
        <h1 className="h2 mt-5 text-4xl">Admin sign in</h1>
        <div className="mt-6"><LoginForm /></div>
      </div>
    </main>
  );
}
