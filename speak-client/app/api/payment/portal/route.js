import { CustomerPortal } from "@polar-sh/nextjs";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  getCustomerId: async (req) => {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch the customer_id from the profiles table
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: {} } // No cookies needed for admin client
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    return profile?.customer_id || null;
  },
  returnUrl: process.env.NEXT_PUBLIC_APP_URL,
  server: "sandbox",
});