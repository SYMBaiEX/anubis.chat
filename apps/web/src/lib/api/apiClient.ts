import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('apiClient');

interface ApiConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * API client with automatic retry and exponential backoff
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig = {}) {
    this.baseUrl = config.baseUrl || '/api';
    this.timeout = config.timeout || 30_000;
    this.defaultRetries = config.retries || 3;
    this.defaultRetryDelay = config.retryDelay || 1000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Execute request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw error;
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * 2 ** attempt;
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, 30_000); // Cap at 30 seconds
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(status: number): boolean {
    // Retry on network errors and specific status codes
    return (
      status === 0 || // Network error
      status === 408 || // Timeout
      status === 429 || // Too many requests
      status === 502 || // Bad gateway
      status === 503 || // Service unavailable
      status === 504 // Gateway timeout
    );
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    url: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    const maxRetries = options.retries ?? this.defaultRetries;
    const retryDelay = options.retryDelay ?? this.defaultRetryDelay;
    const timeout = options.timeout ?? this.timeout;

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        log.debug(`Attempting request (${attempt + 1}/${maxRetries + 1})`, {
          url,
        });

        const response = await this.fetchWithTimeout(url, options, timeout);

        // Parse response
        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // Check for errors
        if (!response.ok) {
          // Check if retryable
          if (this.isRetryable(response.status) && attempt < maxRetries) {
            const delay = this.calculateBackoff(attempt, retryDelay);
            log.warn(
              `Request failed with status ${response.status}, retrying in ${delay}ms`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          throw new ApiError(
            data?.message || `Request failed with status ${response.status}`,
            response.status,
            data
          );
        }

        return {
          data,
          status: response.status,
          ok: true,
        };
      } catch (error) {
        lastError =
          error instanceof ApiError
            ? error
            : new ApiError(
                error instanceof Error ? error.message : 'Unknown error',
                0
              );

        // If not retryable or last attempt, throw
        if (!this.isRetryable(lastError.status) || attempt === maxRetries) {
          log.error('Request failed after retries', {
            url,
            attempts: attempt + 1,
            error: lastError.message,
          });
          break;
        }

        // Calculate delay and retry
        const delay = this.calculateBackoff(attempt, retryDelay);
        log.warn(`Request error, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Return error response
    return {
      error: lastError?.message || 'Request failed',
      status: lastError?.status || 0,
      ok: false,
    };
  }

  /**
   * Build full URL
   */
  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  /**
   * GET request
   */
  async get<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'PATCH',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'DELETE',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });
  }
}

// Create default instance
export const apiClient = new ApiClient();

// Export for custom instances
export default ApiClient;
