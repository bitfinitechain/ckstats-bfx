import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Brandkit ships source .tsx — no build step in the package, so no stale
  // artifact. Next compiles it like first-party code.
  transpilePackages: ['@bitfinitechain/brandkit'],
};

export default nextConfig;
