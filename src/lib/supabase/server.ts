import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env, hasSupabaseBrowserEnv } from "@/lib/config/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  if (!hasSupabaseBrowserEnv) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookieList) {
        cookieList.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Next.js only allows cookie mutation in route handlers and server actions.
            // Server components can still read cookies, so we safely no-op here.
          }
        });
      },
    },
  });
}
