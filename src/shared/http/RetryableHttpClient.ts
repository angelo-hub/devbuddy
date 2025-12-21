/**
 * Retryable HTTP Client
 * 
 * Provides HTTP request functionality with:
 * - Exponential backoff retry logic
 * - Rate limit handling (429 with Retry-After)
 * - Configurable retry strategies
 * - Network error detection
 */

import { getLogger } from "@shared/utils/logger";
import { getNetworkMonitor } from "./NetworkMonitor";

const logger = getLogger();

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelay: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatuses: number[];
  /** Whether to retry on network errors (default: true) */
  retryOnNetworkError: boolean;
}

/**
 * Request options for the HTTP client
 */
export interface HttpRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string | object;
  /** Override default retry configuration */
  retry?: Partial<RetryConfig>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Skip caching for this request */
  skipCache?: boolean;
}

/**
 * Response from the HTTP client
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
  fromCache?: boolean;
}

/**
 * Error thrown by the HTTP client
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: string,
    public readonly retryable: boolean = false,
    public readonly retryAfterHeader?: string | null
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Minimum delay in milliseconds for rate limit retries when no Retry-After header is present.
 * This ensures we wait long enough to avoid immediately hitting the rate limit again.
 */
const MIN_RATE_LIMIT_DELAY_MS = 30000; // 30 seconds

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [429, 500, 502, 503, 504],
  retryOnNetworkError: true,
};

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter (±25% randomization)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delay = Math.min(exponentialDelay + jitter, maxDelay);
  return Math.floor(delay);
}

/**
 * Parse Retry-After header value
 * Can be either a number of seconds or an HTTP date
 */
function parseRetryAfter(retryAfter: string | null): number | null {
  if (!retryAfter) {
    return null;
  }

  // Try parsing as number of seconds
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000; // Convert to milliseconds
  }

  // Try parsing as HTTP date
  const date = Date.parse(retryAfter);
  if (!isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return null;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // fetch throws TypeError for network errors
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("timeout")
    );
  }
  return false;
}

/**
 * User-friendly error messages based on error type
 */
export interface UserFriendlyError {
  /** Short title for UI display */
  title: string;
  /** Longer description for tooltips */
  description: string;
  /** Icon name (VS Code Codicon) */
  icon: string;
  /** Whether the user can retry */
  canRetry: boolean;
  /** Suggested action */
  action?: string;
}

/**
 * Convert an error to a user-friendly message
 */
export function getUserFriendlyError(error: unknown, context?: string): UserFriendlyError {
  // Network/connectivity errors
  if (isNetworkError(error)) {
    return {
      title: "Unable to connect",
      description: "Check your internet connection and try again.",
      icon: "cloud-offline",
      canRetry: true,
      action: "Check your network connection",
    };
  }

  // HTTP errors
  if (error instanceof HttpError) {
    switch (error.status) {
      case 401:
        return {
          title: "Authentication failed",
          description: "Your API token may be invalid or expired. Please reconfigure.",
          icon: "key",
          canRetry: false,
          action: "Reconfigure API token",
        };
      case 403:
        return {
          title: "Access denied",
          description: "You don't have permission to access this resource.",
          icon: "lock",
          canRetry: false,
        };
      case 404:
        return {
          title: "Not found",
          description: "The requested resource could not be found.",
          icon: "search-stop",
          canRetry: false,
        };
      case 429:
        return {
          title: "Rate limited",
          description: "Too many requests. Please wait a moment and try again.",
          icon: "watch",
          canRetry: true,
          action: "Wait and retry",
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          title: "Service temporarily unavailable",
          description: `The ${context || "service"} is experiencing issues. Try again later.`,
          icon: "server",
          canRetry: true,
          action: "Try again later",
        };
      default:
        return {
          title: "Request failed",
          description: `Error ${error.status}: ${error.statusText}`,
          icon: "error",
          canRetry: error.retryable,
        };
    }
  }

  // Generic errors
  return {
    title: "Something went wrong",
    description: error instanceof Error ? error.message : "An unexpected error occurred.",
    icon: "warning",
    canRetry: true,
    action: "Try refreshing",
  };
}

/**
 * Retryable HTTP Client
 * 
 * Singleton instance that handles HTTP requests with retry logic,
 * rate limiting, and network error detection.
 */
export class RetryableHttpClient {
  private static instance: RetryableHttpClient | null = null;
  private defaultConfig: RetryConfig;

  private constructor(config?: Partial<RetryConfig>) {
    this.defaultConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Get the singleton instance
   */
  static getInstance(config?: Partial<RetryConfig>): RetryableHttpClient {
    if (!RetryableHttpClient.instance) {
      RetryableHttpClient.instance = new RetryableHttpClient(config);
    }
    return RetryableHttpClient.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    RetryableHttpClient.instance = null;
  }

  /**
   * Make an HTTP request with retry logic
   */
  async request<T = unknown>(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const retryConfig = { ...this.defaultConfig, ...options.retry };
    const networkMonitor = getNetworkMonitor();

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retryConfig.maxRetries) {
      try {
        const response = await this.executeRequest<T>(url, options);
        
        // Notify network monitor of success
        networkMonitor.recordSuccess();
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        const shouldRetry = this.shouldRetry(error, attempt, retryConfig);
        
        if (!shouldRetry) {
          // Notify network monitor of failure (only for network errors)
          if (isNetworkError(error)) {
            networkMonitor.recordFailure();
          }
          throw error;
        }

        // Calculate delay
        let delay = calculateBackoffDelay(
          attempt,
          retryConfig.baseDelay,
          retryConfig.maxDelay
        );

        // Check for Retry-After header on 429 responses
        if (error instanceof HttpError && error.status === 429) {
          const retryAfter = parseRetryAfter(
            error.retryAfterHeader ?? null
          );
          if (retryAfter !== null) {
            delay = Math.min(retryAfter, retryConfig.maxDelay);
          } else {
            // When no Retry-After header, use minimum delay to avoid immediately re-triggering rate limit
            delay = Math.max(delay, MIN_RATE_LIMIT_DELAY_MS);
          }
        }

        logger.debug(
          `Request to ${url} failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), ` +
          `retrying in ${delay}ms: ${lastError.message}`
        );

        await sleep(delay);
        attempt++;
      }
    }

    // All retries exhausted
    networkMonitor.recordFailure();
    throw lastError || new Error("Request failed after all retries");
  }

  /**
   * Execute a single HTTP request
   */
  private async executeRequest<T>(
    url: string,
    options: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const { method = "GET", headers = {}, body, timeout } = options;

    const requestInit: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
    };

    if (body) {
      requestInit.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    // Add timeout using AbortController
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeout) {
      const controller = new AbortController();
      requestInit.signal = controller.signal;
      timeoutId = setTimeout(() => controller.abort(), timeout);
    }

    try {
      const response = await fetch(url, requestInit);

      if (!response.ok) {
        const errorBody = await response.text();
        const retryAfterHeader = response.status === 429 
          ? response.headers.get("Retry-After") 
          : undefined;
        const error = new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          errorBody,
          this.defaultConfig.retryableStatuses.includes(response.status),
          retryAfterHeader
        );
        
        throw error;
      }

      // Handle empty responses
      const contentLength = response.headers.get("content-length");
      if (response.status === 204 || contentLength === "0") {
        return {
          data: undefined as T,
          status: response.status,
          headers: response.headers,
        };
      }

      const text = await response.text();
      if (!text || text.trim() === "") {
        return {
          data: undefined as T,
          status: response.status,
          headers: response.headers,
        };
      }

      const data = JSON.parse(text) as T;
      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(
    error: unknown,
    attempt: number,
    config: RetryConfig
  ): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= config.maxRetries) {
      return false;
    }

    // Retry on network errors if configured
    if (isNetworkError(error) && config.retryOnNetworkError) {
      return true;
    }

    // Retry on retryable HTTP status codes
    if (error instanceof HttpError) {
      return config.retryableStatuses.includes(error.status);
    }

    return false;
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = unknown>(
    url: string,
    options: Omit<HttpRequestOptions, "method" | "body"> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  /**
   * Convenience method for POST requests
   */
  async post<T = unknown>(
    url: string,
    body: object | string,
    options: Omit<HttpRequestOptions, "method" | "body"> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: "POST", body });
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T = unknown>(
    url: string,
    body: object | string,
    options: Omit<HttpRequestOptions, "method" | "body"> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: "PUT", body });
  }

  /**
   * Convenience method for PATCH requests
   */
  async patch<T = unknown>(
    url: string,
    body: object | string,
    options: Omit<HttpRequestOptions, "method" | "body"> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: "PATCH", body });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T = unknown>(
    url: string,
    options: Omit<HttpRequestOptions, "method"> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

/**
 * Get the singleton HTTP client instance
 */
export function getHttpClient(config?: Partial<RetryConfig>): RetryableHttpClient {
  return RetryableHttpClient.getInstance(config);
}

