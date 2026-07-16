// Public Supabase configuration.
//
// The project URL and anon/publishable key are PUBLIC by design — they ship in
// the client bundle and are protected by Row Level Security. We read them from
// the NEXT_PUBLIC_* env (baked into the bundle at `next build` time) and fall
// back to the known public values so the app never hard-fails if the Docker
// build args were not passed. The Edge-runtime middleware cannot read container
// runtime env, so this fallback is what keeps auth working after a bad build.
//
// NOTE: the SECRET service_role key is never placed here — it stays env-only
// (see lib/supabase/admin.ts) and must never be hardcoded.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bvaykkygqxbbrfxbnyhv.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_jshGnyOjWqN1qFPYIEWn_A_v4hzS45S";
