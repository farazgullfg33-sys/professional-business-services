"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/Button";

export function LoginForm() {
  const [error, setError] = useState("");
  return (
    <main className="min-h-[calc(100vh-260px)] bg-mist py-20">
      <div className="section-shell max-w-md">
        <div className="rounded-lg border border-navy/10 bg-white p-7 shadow-soft">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-gold/15 text-gold"><LockKeyhole /></div>
          <h1 className="text-3xl font-semibold text-navy">Staff Login</h1>
          <p className="mt-2 text-sm text-ink/60">Use seeded credentials such as admin@professionalbs.local / Password123!</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              const form = new FormData(event.currentTarget);
              const result = await signIn("credentials", {
                email: form.get("email"),
                password: form.get("password"),
                redirect: true,
                callbackUrl: "/admin"
              });
              if (result?.error) setError("Invalid email or password");
            }}
          >
            <input name="email" type="email" required placeholder="Email" className="w-full rounded-md border border-navy/15 px-4 py-3" />
            <input name="password" type="password" required placeholder="Password" className="w-full rounded-md border border-navy/15 px-4 py-3" />
            <Button type="submit" className="w-full">Login</Button>
            {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          </form>
        </div>
      </div>
    </main>
  );
}
