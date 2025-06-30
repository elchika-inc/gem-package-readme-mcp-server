import { describe, it, expect, vi } from 'vitest';
import {
  handleApiError,
  handleHttpError,
  withRetry,
} from '../../src/utils/error-handler.js';
import {
  NetworkError,
  RateLimitError,
  GemNotFoundError,
  GemReadmeMcpError,
} from '../../src/types/index.js';

describe('error-handler', () => {

  describe('handleApiError', () => {
    it('should wrap generic errors in GemReadmeMcpError', () => {
      const error = new Error('Test error');
      const context = 'test operation';

      expect(() => handleApiError(error, context)).toThrow(GemReadmeMcpError);
    });

    it('should preserve existing GemReadmeMcpError', () => {
      const apiError = new GemReadmeMcpError('API error', 'TEST_API');
      const context = 'test operation';

      expect(() => handleApiError(apiError, context)).toThrow(apiError);
    });

    it('should handle rate limit errors', () => {
      const rateLimitError = new RateLimitError('Rate limited');
      const context = 'test operation';

      expect(() => handleApiError(rateLimitError, context)).toThrow(rateLimitError);
    });
  });

  describe('handleHttpError', () => {
    it('should throw RateLimitError for 429 status', () => {
      const mockResponse = {
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          get: () => '60',
        },
      };

      expect(() => handleHttpError(429, mockResponse as any, 'test')).toThrow(RateLimitError);
    });

    it('should throw NetworkError for network-related status codes', () => {
      expect(() => handleHttpError(500, {} as any, 'test')).toThrow(NetworkError);
      expect(() => handleHttpError(502, {} as any, 'test')).toThrow(NetworkError);
      expect(() => handleHttpError(503, {} as any, 'test')).toThrow(NetworkError);
      expect(() => handleHttpError(504, {} as any, 'test')).toThrow(NetworkError);
    });

    it('should throw GemNotFoundError for 404 status', () => {
      expect(() => handleHttpError(404, {} as any, 'test')).toThrow(GemNotFoundError);
    });

    it('should throw GemReadmeMcpError for other status codes', () => {
      expect(() => handleHttpError(400, {} as any, 'test')).toThrow(GemReadmeMcpError);
      expect(() => handleHttpError(401, {} as any, 'test')).toThrow(GemReadmeMcpError);
      expect(() => handleHttpError(403, {} as any, 'test')).toThrow(GemReadmeMcpError);
    });
  });

  describe('withRetry', () => {
    it('should return result on successful operation', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on rate limit errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new RateLimitError('Rate limited'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, 2);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new NetworkError('Network error'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, 2);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new GemNotFoundError('Not found'));

      await expect(withRetry(operation, 2)).rejects.toThrow(GemNotFoundError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after maximum retries', async () => {
      const operation = vi.fn().mockRejectedValue(new RateLimitError('Rate limited'));

      await expect(withRetry(operation, 2)).rejects.toThrow(RateLimitError);
      expect(operation).toHaveBeenCalledTimes(3); // maxRetries + 1
    });
  });
});