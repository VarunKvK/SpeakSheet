// app/api/payment/checkout/route.js
import { Checkout } from "@polar-sh/nextjs";

export async function GET(req) {
  const url = new URL(req.url);
  const origin = url.origin;

  // Polar will append ?checkout_id=... to successUrl
  return Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    successUrl: `${origin}/success`,
    returnUrl: origin,
    server: "sandbox",
    theme: "dark",
  })(req);
}