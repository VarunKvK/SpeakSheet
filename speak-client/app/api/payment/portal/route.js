import { CustomerPortal } from "@polar-sh/nextjs";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  getCustomerId: (req) => {
    console.log("req", req);
    // Resolve Polar Customer ID from your user/session
    return "cus_123"; 
  },
  returnUrl: process.env.NEXT_PUBLIC_APP_URL,
  server: "production",//production
});