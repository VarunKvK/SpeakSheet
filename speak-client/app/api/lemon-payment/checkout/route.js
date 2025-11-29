import { NextResponse } from "next/server";
import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
// Configure LemonSqueezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
  onError: (error) => console.error("Error!", error),
});

export async function POST(req) {
  try {
    const cookieStore = await cookies();

    // ✅ Create Supabase client with SSR helpers
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
              cookiesToSet.forEach(({ name, value }) =>
                cookieStore.set(name, value)
              );
            } catch {
              // Ignore if called from a Server Component
            }
          },
        },
      }
    );

    // ✅ Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("No session found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Creating checkout with:", {
      storeId: process.env.LEMONSQUEEZY_STORE_ID,
      variantId: process.env.LEMONSQUEEZY_VARIANT_ID,
      apiKey: process.env.LEMONSQUEEZY_API_KEY ? "set" : "missing",
    });

    // ✅ Create checkout
    const { data, error } = await createCheckout(
      process.env.LEMONSQUEEZY_STORE_ID,
      process.env.LEMONSQUEEZY_VARIANT_ID,
      {
        checkoutData: {
          email: session.user.email,
          custom: { user_id: session.user.id },
        },
        productOptions: {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/workspace`,
        },
      }
    );
    if (error) {
      console.error("LemonSqueezy error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ url: data.data.attributes.url });
  } catch (err) {
    console.error("Checkout route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

