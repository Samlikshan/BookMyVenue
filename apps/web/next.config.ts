import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oeoippdlelmzapfihkgu.supabase.co",
        pathname: "/storage/v1/object/public/venue-images/**",
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
