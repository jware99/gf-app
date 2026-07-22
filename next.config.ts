import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Google account profile photos, shown next to the sign-out button.
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
