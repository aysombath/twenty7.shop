import { Redis } from '@upstash/redis'

/**
 * High-End Redis Context Initialization
 * Leveraging Upstash for low-latency state caching across the Atelier infrastructure.
 */
export const redis = new Redis({
  url: process.env.REDIS_ENDPOINT || '',
  token: process.env.REDIS_TOKEN || '',
})

// Global Cache Key Management
export const CACHE_KEYS = {
  CATEGORIES_LIST: 'atelier:categories:list',
  PARENT_CATEGORIES_LIST: 'atelier:parent_categories:list',
  PRODUCTS_LIST: 'atelier:products:list',
  BRANDS_LIST: 'atelier:brands:list',
  CUSTOMERS_LIST: 'atelier:customers:list',
  CUSTOMERS_STATS: 'atelier:customers:stats',
  ORDERS_LIST: 'atelier:orders:list',
  ORDERS_STATS: 'atelier:orders:stats',
} as const
