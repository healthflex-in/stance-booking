import type { NextConfig } from "next";
import { getShortLinkRewrite } from "./lib/urls";

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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
