import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ==========================================================================
  // HTML MUST NOT BE CDN-CACHED. Measured 2026-08-22.
  //
  // Next emits `Cache-Control: s-maxage=31536000` on statically prerendered
  // pages — a year, aimed at shared caches. That is correct on Vercel, which
  // purges its CDN on every deploy. Self-hosted behind Cloudflare, nothing
  // purges, so the edge can keep serving HTML from the previous build that
  // references JS chunks the new build no longer has. Caught exactly that on
  // explorer minutes after a deploy: three chunks 404 at the edge while the
  // origin served all twelve correctly.
  //
  // The document is the one thing that must stay fresh. Everything it points at
  // is content-hashed under /_next/static and IS safe to cache forever, which is
  // why this rule excludes it — capturing static here would undo the immutable
  // caching that makes the site fast.
  //
  // Cloudflare-CDN-Cache-Control is not redundant with Cache-Control: Cloudflare
  // reads it in preference to Cache-Control for its own edge, and explorer is
  // proof the plain header is not enough on its own — it already sent
  // `no-store` and the edge still returned HIT with age=38.
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  // Brandkit ships source .tsx — no build step in the package, so no stale
  // artifact. Next compiles it like first-party code.
  transpilePackages: ['@bitfinitechain/brandkit'],
};

export default nextConfig;
