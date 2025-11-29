import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Admin client to bypass RLS and update user profile
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const text = await req.text();
    const hmac = crypto.createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
    const digest = Buffer.from(hmac.update(text).digest("hex"), "utf8");
    const signature = Buffer.from(req.headers.get("x-signature") || "", "utf8");

    // 1. Verify Signature (Security)
    if (!crypto.timingSafeEqual(digest, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(text);
    const { meta, data } = payload;
    const eventName = meta.event_name;
    
    // 2. Extract User ID we sent in Task 3
    const userId = meta.custom_data?.user_id; 
    
    if (!userId) {
        return NextResponse.json({ message: "No user ID found in webhook" }, { status: 200 });
    }

    // 3. Handle Events
    if (eventName === "order_created") {
      const customerId = data.attributes.customer_id;
      const variantId = data.attributes.first_order_item.variant_id;

      // Update Supabase
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ 
            is_pro: true, 
            customer_id: customerId.toString(),
            variant_id: variantId.toString(),
            credits: 9999 // Or whatever your logic is
        })
        .eq("id", userId);
        
      if(error) console.error("Supabase Update Error:", error);
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}