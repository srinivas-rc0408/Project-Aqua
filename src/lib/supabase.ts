/// <reference types="vite/client" />
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client-side Supabase client. Reads the public anon key (safe to expose).
// Preference order:
//   1. Build-time VITE_SUPABASE_* (fastest — inlined by Vite when present).
//   2. Runtime /api/config from our backend (works even if the host's env vars are
//      named without the VITE_ prefix, so no rebuild/rename is needed on the deploy).
// Until one of those resolves, the client is null so the app still runs (guest works).

const AUTH_OPTS = {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
} as const;

const buildUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const buildKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// `let` exports are live bindings — importers see these update once runtime config resolves.
export let supabase: SupabaseClient | null =
    buildUrl && buildKey ? createClient(buildUrl, buildKey, AUTH_OPTS) : null;
export let isSupabaseConfigured = Boolean(supabase);

// Where OAuth / magic-link providers redirect back to.
export const authRedirectTo = `${window.location.origin}/auth/callback`;

// Resolves the client, fetching public config from the backend if VITE_ vars weren't provided.
// main.jsx awaits this before rendering so the client is ready before the first component mounts.
export const supabaseReady: Promise<SupabaseClient | null> = (async () => {
    if (supabase) return supabase;
    try {
        const res = await fetch("/api/config", { headers: { Accept: "application/json" } });
        if (res.ok) {
            const cfg = await res.json();
            if (cfg?.supabaseUrl && cfg?.supabaseAnonKey) {
                supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, AUTH_OPTS);
                isSupabaseConfigured = true;
            }
        }
    } catch {
        /* leave null — guest-only until configured */
    }
    return supabase;
})();
