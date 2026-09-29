import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

/**
 * Creates an administrative Supabase client using the service role key.
 * Used exclusively for server-to-server webhook ingestion and background synchronization.
 * NEVER expose this client to frontend components or public API responses.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
