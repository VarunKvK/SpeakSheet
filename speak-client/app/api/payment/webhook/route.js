import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// Use the service role key here, not the anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role key from Supabase settings
);

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
  onPayload: async (payload) => {

    if (payload.type === "subscription.active" || payload.type === "order.paid") {
      const userId = payload.data.customer?.externalId;
      const customerEmail = payload.data.customer?.email;
      const customerId = payload.data.customer?.id;


      if (!userId) return;

      // Instead of insert (which may violate RLS if row already exists),
      // update the existing profile row
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          is_pro: true,
          customer_id: customerId,
          email: customerEmail,
        })
        .eq("id", userId);

      if (error) console.error("Supabase update error:", error);
    }
  },
});