"use client";

import { createBrowserClient } from "@supabase/ssr";

import { env, hasSupabaseBrowserEnv } from "@/lib/config/env";

export function createSupabaseBrowserClient() {
  if (!hasSupabaseBrowserEnv) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
