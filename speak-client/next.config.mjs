/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.ngrok-free.app"],
    },
  },
};

export default nextConfig;
