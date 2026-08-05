import type { NextConfig } from "next";

/**
 * Origin of the Stance API that serves GET /r/:code redirects.
 * Derived from GraphQL URL when SHORT_LINK_API_ORIGIN is unset.
 */
function getShortLinkApiOrigin(): string {
  if (process.env.SHORT_LINK_API_ORIGIN) {
    return process.env.SHORT_LINK_API_ORIGIN.replace(/\/$/, "");
  }

  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_API_URL;
  if (graphqlUrl) {
    try {
      const url = new URL(graphqlUrl);
      return url.origin;
    } catch {
      // fall through
    }
  }

  if (process.env.NEXT_PUBLIC_ENVIRONMENT === "production") {
    return "https://api.stance.health";
  }

  return "http://localhost:3000";
}

const shortLinkApiOrigin = getShortLinkApiOrigin();

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Public short links: https://book.stance.health/r/:code → API redirect
        source: "/r/:code",
        destination: `${shortLinkApiOrigin}/r/:code`,
      },
    ];
  },
};

export default nextConfig;
