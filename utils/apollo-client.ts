import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import {
  DEFAULT_CENTER_ID,
  DEFAULT_ORGANIZATION_ID,
} from '@/utils/account-utils';
import {
  gql,
  from,
  NextLink,
  Operation,
  Observable,
  ApolloLink,
  FetchResult,
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from '@apollo/client';
import { handleTokenExpiration } from '@/utils/auth-utils';

// Define the REFRESH_TOKEN mutation
const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(token: $refreshToken)
  }
`;

// Define our own error type instead of extending GraphQLError
interface GraphQLAuthErrorType {
  name?: string;
  message: string;
  extensions?: { code?: string; name?: string; };
}

/**
 * Analytics Link for tracking GraphQL operations
 */
const analyticsLink = new ApolloLink(
  (operation: Operation, forward: NextLink) => {
    const startTime = performance.now();
    const operationName = operation.operationName || 'Unknown';
    const operationType =
      operation.query.definitions[0]?.kind === 'OperationDefinition'
        ? operation.query.definitions[0].operation
        : 'query';

    return new Observable((observer) => {
      const subscription = forward(operation).subscribe({
        next: (result: FetchResult) => {
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Track successful GraphQL operation
          if (typeof window !== 'undefined') {
            trackGraphQLOperation({
              duration,
              operationName,
              operationType,
              cacheHit: false,
              success: !result.errors,
              variables: operation.variables,
              errorMessage: result.errors?.[0]?.message,
            });
          }

          observer.next(result);
        },
        error: (error) => {
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Track failed GraphQL operation
          if (typeof window !== 'undefined') {
            trackGraphQLOperation({
              duration,
              operationName,
              operationType,
              success: false,
              cacheHit: false,
              errorMessage: error.message,
              variables: operation.variables,
            });
          }

          observer.error(error);
        },
        complete: () => {
          observer.complete();
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    });
  }
);

// Function to track GraphQL operations
function trackGraphQLOperation(data: {
  duration: number;
  success: boolean;
  cacheHit: boolean;
  operationName: string;
  errorMessage?: string;
  variables?: Record<string, any>;
  operationType: 'query' | 'mutation' | 'subscription';
}): void {
  // Dynamic import to avoid SSR issues
  import('@/lib/firebase')
    .then(({ analytics }) => {
      if (!analytics) return;

      import('firebase/analytics').then(({ logEvent }) => {
        // Track general GraphQL performance
        logEvent(analytics, 'graphql_operation', {
          operation_name: data.operationName,
          operation_type: data.operationType,
          duration: Math.round(data.duration),
          success: data.success,
          error_message: data.errorMessage,
          cache_hit: data.cacheHit,
          timestamp: new Date().toISOString(),
        });

        // Track slow operations (> 2 seconds)
        if (data.duration > 2000) {
          logEvent(analytics, 'slow_graphql_operation', {
            operation_name: data.operationName,
            operation_type: data.operationType,
            duration: Math.round(data.duration),
            timestamp: new Date().toISOString(),
          });
        }

        // Track GraphQL errors separately
        if (!data.success) {
          logEvent(analytics, 'graphql_error', {
            operation_name: data.operationName,
            operation_type: data.operationType,
            error_message: data.errorMessage,
            timestamp: new Date().toISOString(),
          });
        }

        // Track hospital-specific operations
        if (data.operationName.toLowerCase().includes('patient')) {
          logEvent(analytics, 'hospital_patient_operation', {
            operation_name: data.operationName,
            operation_type: data.operationType,
            duration: Math.round(data.duration),
            success: data.success,
            timestamp: new Date().toISOString(),
          });
        }
      });
    })
    .catch(() => {
      // Firebase not available
    });
}

// Use a function to create the Apollo Client
export function createApolloClient(initialState = {}) {
  const httpLink = createHttpLink({
    uri:
      process.env.NEXT_PUBLIC_GRAPHQL_API_URL ||
      'https://devapi.stance.health/graphql',
    // Ensure fetch works on both client and server
    fetch: fetch,
  });

  // Auth link to add the token and organization headers to requests
  const authLink = setContext(async (operation, { headers }) => {
    // Check if this is a mobile booking route
    const { isMobileBookingRoute, getMobileCenterId, getMobileOrganizationId, getMobileApiKey } = await import('@/utils/mobile-config');
    
    if (isMobileBookingRoute()) {
      const isGetCentersQuery = operation.operationName === 'Centers';

      // For mobile booking routes, check localStorage first, then fallback to hardcoded
      const mobileOrgId = localStorage.getItem('mobile-organizationID') || getMobileOrganizationId();
      const mobileCenterId = localStorage.getItem('mobile-centreID') || getMobileCenterId();

      return {
        headers: {
          ...headers,
          'x-api-key': getMobileApiKey(),
          ...(isGetCentersQuery
            ? {} // Skip organization ID for GET_CENTERS
            : {
              'x-organization-id': mobileOrgId,
              'x-center-id': mobileCenterId,
            }),
        },
      };
    }

    let token = null;
    let organizationId = DEFAULT_ORGANIZATION_ID; // Default value for SSR
    let centerId = null;
    
    if (typeof window !== 'undefined') {
      // Use the new center utilities for consistency
      const { getCenterIdForHeaders } = await import('@/utils/center-utils');
      centerId = getCenterIdForHeaders();
    }

    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
      organizationId =
        localStorage.getItem('stance-organizationID') || organizationId;
    }

    return {
      headers: {
        ...headers,
        ...(centerId && { 'x-center-id': centerId }),
        'x-organization-id': organizationId,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });


  // Enhanced error handling link with analytics
  const errorLink = onError(
    ({ graphQLErrors, networkError, operation, forward }) => {
      // Track network errors
      if (networkError && typeof window !== 'undefined') {
        import('@/lib/firebase')
          .then(({ analytics }) => {
            if (analytics) {
              import('firebase/analytics').then(({ logEvent }) => {
                logEvent(analytics, 'graphql_network_error', {
                  error_message: networkError.message,
                  operation_name: operation.operationName || 'Unknown',
                  timestamp: new Date().toISOString(),
                });
              });
            }
          })
          .catch(() => { });
      }

      // Track detailed GraphQL errors
      if (graphQLErrors && typeof window !== 'undefined') {
        graphQLErrors.forEach(({ message, locations, path }) => {
          import('@/lib/firebase')
            .then(({ analytics }) => {
              if (analytics) {
                import('firebase/analytics').then(({ logEvent }) => {
                  logEvent(analytics, 'graphql_detailed_error', {
                    error_message: message,
                    operation_name: operation.operationName || 'Unknown',
                    error_path: path?.join('.') || 'Unknown',
                    timestamp: new Date().toISOString(),
                  });
                });
              }
            })
            .catch(() => { });
        });
      }

      // Original auth error handling
      if (!graphQLErrors || typeof window === 'undefined') return;

      for (const err of graphQLErrors) {
        // Cast to our custom error type
        const authErr = err as unknown as GraphQLAuthErrorType;

        // Check if the error is a GraphQLAuthError
        if (
          authErr.name === 'GraphQLAuthError' ||
          (authErr.extensions &&
            authErr.extensions.code === 'GRAPHQL_ERROR' &&
            authErr.extensions.name === 'GraphQLAuthError')
        ) {
          // Track authentication failures
          import('@/lib/firebase')
            .then(({ analytics }) => {
              if (analytics) {
                import('firebase/analytics').then(({ logEvent }) => {
                  logEvent(analytics, 'auth_token_expired', {
                    operation_name: operation.operationName || 'Unknown',
                    timestamp: new Date().toISOString(),
                  });
                });
              }
            })
            .catch(() => { });

          // Get the refresh token from localStorage
          const refreshToken = localStorage.getItem('refreshToken');

          if (!refreshToken) {
            // If no refresh token is available, call logout and redirect
            handleTokenExpiration();
            return;
          }

          // Try to refresh the token
          return new Observable((observer) => {
            refreshAuthToken(refreshToken)
              .then((newToken) => {
                if (newToken) {
                  // Track successful token refresh
                  import('@/lib/firebase')
                    .then(({ analytics }) => {
                      if (analytics) {
                        import('firebase/analytics').then(({ logEvent }) => {
                          logEvent(analytics, 'auth_token_refreshed', {
                            operation_name:
                              operation.operationName || 'Unknown',
                            timestamp: new Date().toISOString(),
                          });
                        });
                      }
                    })
                    .catch(() => { });

                  // If successful, update the token in localStorage
                  localStorage.setItem('token', newToken);

                  // Update the authorization header for the current operation
                  operation.setContext(({ headers = {} }) => ({
                    headers: {
                      ...headers,
                      authorization: `Bearer ${newToken}`,
                    },
                  }));

                  // Retry the operation with the new token
                  forward(operation).subscribe({
                    next: observer.next.bind(observer),
                    error: observer.error.bind(observer),
                    complete: observer.complete.bind(observer),
                  });
                } else {
                  // Track failed token refresh
                  import('@/lib/firebase')
                    .then(({ analytics }) => {
                      if (analytics) {
                        import('firebase/analytics').then(({ logEvent }) => {
                          logEvent(analytics, 'auth_token_refresh_failed', {
                            reason: 'invalid_refresh_token',
                            timestamp: new Date().toISOString(),
                          });
                        });
                      }
                    })
                    .catch(() => { });

                  // If refresh token is invalid, call logout and redirect
                  handleTokenExpiration();
                  observer.error(new Error('Failed to refresh token'));
                }
              })
              .catch((error) => {
                // Track refresh token request failure
                import('@/lib/firebase')
                  .then(({ analytics }) => {
                    if (analytics) {
                      import('firebase/analytics').then(({ logEvent }) => {
                        logEvent(analytics, 'auth_token_refresh_failed', {
                          reason: 'request_failed',
                          error_message: error.message,
                          timestamp: new Date().toISOString(),
                        });
                      });
                    }
                  })
                  .catch(() => { });

                // If refresh token request fails, call logout and redirect
                handleTokenExpiration();
                observer.error(new Error('Failed to refresh token'));
              });
          });
        }
      }
    }
  );

  return new ApolloClient({
    ssrMode: typeof window === 'undefined', // Set to true for SSR
    link: from([errorLink, analyticsLink, authLink, httpLink]),
    cache: new InMemoryCache().restore(initialState as any),
  });
}



// Function to handle token refresh
const refreshAuthToken = async (
  refreshToken: string
): Promise<string | null> => {
  try {
    // Create a temporary client just for the refresh token request
    const tempClient = new ApolloClient({
      cache: new InMemoryCache(),
      link: createHttpLink({
        uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL || 'https://devapi.stance.health/graphql',
      }),
    });

    const { data } = await tempClient.mutate({
      mutation: REFRESH_TOKEN,
      variables: { refreshToken },
    });

    if (data && data.refreshToken) {
      return data.refreshToken;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

/**
 * Create and export the client
 */
export const client = createApolloClient();
