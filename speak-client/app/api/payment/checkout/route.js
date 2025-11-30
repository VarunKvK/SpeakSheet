import { Checkout } from "@polar-sh/nextjs";

export async function GET(req) {
  console.log("Checkout request received");
  console.log(req);
  const url = new URL(req.url);
  const origin = url.origin;

  return Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    successUrl: `${origin}/success`, // Polar will append checkout_id
    returnUrl: origin,
    server: "sandbox",
    theme: "dark",
  })(req);
}