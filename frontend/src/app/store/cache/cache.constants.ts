/**
 * Cache TTL (Time To Live) configuration in milliseconds
 * These values should match the backend Redis TTL configuration
 */
export const CACHE_TTL = {
  TRUCKS: 5 * 60 * 1000,      // 5 minutes
  DRIVERS: 5 * 60 * 1000,     // 5 minutes
  GROUPS: 10 * 60 * 1000,     // 10 minutes
  STATS: 1 * 60 * 1000,       // 1 minute
} as const;

/**
 * Cache entity types for type-safe cache operations
 */
export type CacheEntityType = keyof typeof CACHE_TTL;

/**
 * Get TTL for a specific entity type
 */
export function getCacheTTL(entityType: CacheEntityType): number {
  return CACHE_TTL[entityType];
}
