"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-5 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md rounded-lg p-7 shadow-soft"
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-gold/40 bg-gold/15 text-gold">
          <LockKeyhole />
        </div>
        <h1 className="font-heading text-3xl font-semibold text-heading">CEO Login</h1>
        <p className="mt-2 text-sm text-muted">badshahdeking@gmail.com</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setLoading(true);
            const form = new FormData(event.currentTarget);
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
              email: form.get("email") as string,
              password: form.get("password") as string
            });
            setLoading(false);
            if (authError) {
              setError("Invalid email or password");
            } else {
              router.push("/admin");
              router.refresh();
            }
          }}
        >
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted focus:border-gold focus:outline-none" />
          <input name="password" type="password" required placeholder="Password" className="w-full rounded-md border border-edge bg-base px-4 py-3 text-heading placeholder:text-muted focus:border-gold focus:outline-none" />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Login"}</Button>
          {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
        </form>
      </motion.div>
    </main>
  );
}
