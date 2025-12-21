/**
 * HTTP Infrastructure
 * 
 * Shared utilities for HTTP requests with:
 * - Retry logic with exponential backoff
 * - TTL-based caching
 * - Network status monitoring
 */

// Retryable HTTP Client
export {
  RetryableHttpClient,
  getHttpClient,
  isNetworkError,
  getUserFriendlyError,
  type RetryConfig,
  type HttpRequestOptions,
  type HttpResponse,
  type UserFriendlyError,
  HttpError,
} from "./RetryableHttpClient";

// TTL Cache
export {
  TTLCache,
  TTL,
  getApiCache,
  getMetadataCache,
  clearAllCaches,
  disposeAllCaches,
  generateCacheKey,
  generateQueryCacheKey,
  type TTLCacheConfig,
} from "./TTLCache";

// Network Monitor
export {
  NetworkMonitor,
  getNetworkMonitor,
  initializeNetworkMonitor,
  type NetworkMonitorConfig,
  type NetworkStatus,
} from "./NetworkMonitor";

