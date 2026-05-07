import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/config/env";

export function createSupabaseAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
