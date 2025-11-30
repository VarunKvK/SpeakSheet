import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  successUrl: process.env.POLAR_SUCCESS_URL,
  returnUrl: process.env.NEXT_PUBLIC_APP_URL, // optional back button
  // server: "sandbox", // use 'production' for live
  server: "production", // use 'sandbox' for testing
  theme: "dark",     // optional theme override
});
