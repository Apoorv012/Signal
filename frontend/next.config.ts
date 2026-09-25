import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-only route indicator overlaps the composer's + button on mobile widths.
  devIndicators: false,
};

export default nextConfig;
