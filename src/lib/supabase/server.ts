import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

import { getSupabaseServerEnv, requireSupabasePublicEnv } from "./env";

async function createCookieClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabasePublicEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may read cookies without being allowed to mutate them.
        }
      }
    }
  });
}

export async function createRlsClient() {
  return createCookieClient();
}

export async function createClient() {
  const serverEnv = getSupabaseServerEnv();

  if (serverEnv) {
    return createSupabaseClient<Database>(serverEnv.url, serverEnv.secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return createCookieClient();
}
