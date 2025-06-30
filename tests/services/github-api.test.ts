import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubApiClient } from '../../src/services/github-api.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GitHubApiClient', () => {
  let client: GitHubApiClient;

  beforeEach(() => {
    client = new GitHubApiClient();
    vi.clearAllMocks();
  });

  describe('getReadme', () => {
    it('should fetch README successfully', async () => {
      const mockReadmeContent = '# Test README\n\nThis is a test.';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockReadmeContent),
      });

      const result = await client.getReadme('owner', 'repo');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/readme',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'gem-package-readme-mcp/1.0.0',
          }),
        })
      );

      expect(result).toBe('# Test README\n\nThis is a test.');
    });

    it('should throw GemNotFoundError for 404 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(client.getReadme('owner', 'repo')).rejects.toThrow('not found');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.getReadme('owner', 'repo')).rejects.toThrow();
    });

    it('should use GitHub token if provided', () => {
      const clientWithToken = new GitHubApiClient('token123');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('test'),
      });

      clientWithToken.getReadme('owner', 'repo');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/readme',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token123',
          }),
        })
      );
    });
  });

  describe('parseRepositoryUrl', () => {
    it('should parse standard GitHub URLs', () => {
      const result = client.parseRepositoryUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URLs with .git suffix', () => {
      const result = client.parseRepositoryUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse git+https URLs', () => {
      const result = client.parseRepositoryUrl('git+https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return null for invalid URLs', () => {
      expect(client.parseRepositoryUrl('https://example.com')).toBeNull();
      expect(client.parseRepositoryUrl('not-a-url')).toBeNull();
      expect(client.parseRepositoryUrl('')).toBeNull();
    });

    it('should handle URLs with additional paths', () => {
      const result = client.parseRepositoryUrl('https://github.com/owner/repo/tree/main');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });
  });
});