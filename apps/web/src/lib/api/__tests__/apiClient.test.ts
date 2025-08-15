import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../apiClient';

// Mock fetch
global.fetch = vi.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 2,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should retry on network failure', async () => {
      const mockData = { success: true };

      // First call fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');

      expect(result.ok).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await apiClient.get('/test');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Network error');
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle timeout', async () => {
      // Mock a fetch that never resolves within timeout
      (global.fetch as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10_000))
      );

      const client = new ApiClient({ timeout: 100 });
      const result = await client.get('/test');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(408);
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with body', async () => {
      const requestBody = { name: 'New Item' };
      const responseData = { id: 1, ...requestBody };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
      });

      const result = await apiClient.post('/items', requestBody);

      expect(result.ok).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data).toEqual(responseData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });
  });

  describe('Retry logic', () => {
    it('should retry on 503 Service Unavailable', async () => {
      const mockData = { success: true };

      // First call returns 503
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Service Unavailable' }),
      });

      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');

      expect(result.ok).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 400 Bad Request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Bad Request' }),
      });

      const result = await apiClient.get('/test');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff', async () => {
      const startTime = Date.now();

      // All calls fail
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Service Unavailable' }),
      });

      const client = new ApiClient({
        retries: 2,
        retryDelay: 100,
      });

      await client.get('/test');

      const elapsedTime = Date.now() - startTime;

      // Should have delays: ~100ms (first retry) + ~200ms (second retry)
      // Adding buffer for test execution time
      expect(elapsedTime).toBeGreaterThan(250);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: async () => '',
      });

      const result = await apiClient.delete('/items/1');

      expect(result.ok).toBe(true);
      expect(result.status).toBe(204);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
