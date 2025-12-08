// import { useEffect } from 'react';
// import { analytics } from '@/lib/firebase';
// import { logEvent } from 'firebase/analytics';
// import { useApolloClient } from '@apollo/client';

// interface GraphQLMetrics {
//   totalQueries: number;
//   totalMutations: number;
//   totalSubscriptions: number;
//   averageQueryTime: number;
//   cacheHitRate: number;
//   errorRate: number;
// }

// export const useGraphQLAnalytics = () => {
//   const client = useApolloClient();

//   useEffect(() => {
//     if (!analytics) return;

//     // Track Apollo Client cache size periodically
//     const trackCacheMetrics = () => {
//       const cacheSize = JSON.stringify(client.cache.extract()).length;
      
//       logEvent(analytics, 'apollo_cache_metrics', {
//         cache_size_bytes: cacheSize,
//         timestamp: new Date().toISOString()
//       });
//     };

//     // Track cache metrics every 5 minutes
//     const cacheInterval = setInterval(trackCacheMetrics, 5 * 60 * 1000);
    
//     // Initial cache metrics
//     trackCacheMetrics();

//     return () => {
//       clearInterval(cacheInterval);
//     };
//   }, [client]);

//   // Manual tracking functions
//   const trackQueryPerformance = (queryName: string, variables: any, duration: number, fromCache: boolean) => {
//     if (!analytics) return;

//     logEvent(analytics, 'manual_query_tracking', {
//       query_name: queryName,
//       duration: Math.round(duration),
//       from_cache: fromCache,
//       has_variables: Object.keys(variables || {}).length > 0,
//       timestamp: new Date().toISOString()
//     });
//   };

//   const trackMutationPerformance = (mutationName: string, variables: any, duration: number, success: boolean) => {
//     if (!analytics) return;

//     logEvent(analytics, 'manual_mutation_tracking', {
//       mutation_name: mutationName,
//       duration: Math.round(duration),
//       success,
//       has_variables: Object.keys(variables || {}).length > 0,
//       timestamp: new Date().toISOString()
//     });
//   };

//   const trackCacheOperation = (operation: 'read' | 'write' | 'evict', key: string, success: boolean) => {
//     if (!analytics) return;

//     logEvent(analytics, 'apollo_cache_operation', {
//       operation,
//       cache_key: key,
//       success,
//       timestamp: new Date().toISOString()
//     });
//   };

//   const trackSubscriptionMetrics = (subscriptionName: string, eventType: 'start' | 'data' | 'error' | 'complete') => {
//     if (!analytics) return;

//     logEvent(analytics, 'apollo_subscription', {
//       subscription_name: subscriptionName,
//       event_type: eventType,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Get current cache metrics
//   const getCacheMetrics = () => {
//     const cache = client.cache.extract();
//     return {
//       totalKeys: Object.keys(cache).length,
//       sizeInBytes: JSON.stringify(cache).length
//     };
//   };

//   // Clear cache and track it
//   const clearCacheWithTracking = (reason: string) => {
//     const beforeSize = getCacheMetrics().sizeInBytes;
    
//     client.cache.reset();
    
//     if (analytics) {
//       logEvent(analytics, 'apollo_cache_cleared', {
//         reason,
//         cache_size_before: beforeSize,
//         timestamp: new Date().toISOString()
//       });
//     }
//   };

//   return {
//     trackQueryPerformance,
//     trackMutationPerformance,
//     trackCacheOperation,
//     trackSubscriptionMetrics,
//     getCacheMetrics,
//     clearCacheWithTracking
//   };
// };
