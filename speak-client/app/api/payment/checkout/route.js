import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  successUrl: process.env.POLAR_SUCCESS_URL,
  returnUrl: process.env.NEXT_PUBLIC_APP_URL, // optional back button
//   server: "production", // use 'sandbox' for testing, omit or 'production' for live
  server: "sandbox", // use 'sandbox' for testing, omit or 'production' for live
  theme: "dark",     // optional theme override
});