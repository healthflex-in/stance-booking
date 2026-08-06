/**
 * Public / service URL helpers for the booking app.
 *
 * Features and Next config should import from here instead of reading env inline.
 */

const stripTrailingSlash = (url: string) => url.replace(/\/$/, "");

/**
 * Origin of the Stance API that serves GET /r/:code redirects.
 */
export function getApiOrigin(): string {
  if (process.env.SHORT_LINK_API_ORIGIN) {
    return stripTrailingSlash(process.env.SHORT_LINK_API_ORIGIN);
  }

  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_API_URL;
  if (graphqlUrl) {
    try {
      return new URL(graphqlUrl).origin;
    } catch {
      // fall through
    }
  }

  if (process.env.NEXT_PUBLIC_ENVIRONMENT === "production") {
    return "https://api.stance.health";
  }
  return "http://localhost:3000";
}

export function getBookingOrigin(): string {
  return stripTrailingSlash(
    process.env.NEXT_PUBLIC_BOOKING_APP_URL || "https://book.stance.health",
  );
}

/** Next.js rewrite: /r/:code → API short-link redirect */
export function getShortLinkRewrite() {
  return {
    source: "/r/:code",
    destination: `${getApiOrigin()}/r/:code`,
  };
}
