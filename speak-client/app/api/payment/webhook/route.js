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

    console.log("Webhook payload received:", payload.type);

    if (payload.type === "subscription.active" || payload.type === "order.created" || payload.type === "order.paid") {
      const customer = payload.data.customer;
      // Polar uses snake_case for API responses
      const userId = customer.externalId;
      const customerEmail = customer.email;
      const customerId = customer.id;

      console.log("Processing webhook for user:", userId);

      if (!userId) {
        console.error("No userId found in webhook payload. Customer data:", customer);
        return;
      }

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