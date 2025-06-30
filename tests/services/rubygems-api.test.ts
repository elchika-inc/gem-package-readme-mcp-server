import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RubyGemsApiClient } from '../../src/services/rubygems-api.js';
import { GemNotFoundError, NetworkError } from '../../src/types/index.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RubyGemsApiClient', () => {
  let client: RubyGemsApiClient;

  beforeEach(() => {
    client = new RubyGemsApiClient();
    vi.clearAllMocks();
  });

  describe('getGemInfo', () => {
    it('should fetch gem info successfully', async () => {
      const mockGemInfo = {
        name: 'rails',
        downloads: 500000000,
        version: '7.0.0',
        authors: 'David Heinemeier Hansson',
        info: 'Full-stack web application framework.',
        licenses: ['MIT'],
        metadata: {},
        yanked: false,
        sha: 'abc123',
        project_uri: 'https://rubyonrails.org',
        gem_uri: 'https://rubygems.org/gems/rails',
        homepage_uri: 'https://rubyonrails.org',
        wiki_uri: null,
        documentation_uri: 'https://api.rubyonrails.org',
        mailing_list_uri: null,
        source_code_uri: 'https://github.com/rails/rails',
        bug_tracker_uri: 'https://github.com/rails/rails/issues',
        changelog_uri: null,
        funding_uri: null,
        dependencies: {
          development: [],
          runtime: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGemInfo),
      });

      const result = await client.getGemInfo('rails');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://rubygems.org/api/v1/gems/rails.json',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': 'gem-package-readme-mcp/1.0.0',
          }),
        })
      );

      expect(result).toEqual(mockGemInfo);
    });

    it('should throw GemNotFoundError for 404 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(client.getGemInfo('nonexistent-gem')).rejects.toThrow(GemNotFoundError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getGemInfo('rails')).rejects.toThrow();
    });
  });

  describe('searchGems', () => {
    it('should search gems successfully', async () => {
      const mockSearchResponse = [
        {
          name: 'rails',
          downloads: 500000000,
          version: '7.0.0',
          authors: 'David Heinemeier Hansson',
          info: 'Full-stack web application framework.',
          licenses: ['MIT'],
          metadata: {},
          yanked: false,
          sha: 'abc123',
          project_uri: 'https://rubyonrails.org',
          gem_uri: 'https://rubygems.org/gems/rails',
          homepage_uri: 'https://rubyonrails.org',
          wiki_uri: null,
          documentation_uri: 'https://api.rubyonrails.org',
          mailing_list_uri: null,
          source_code_uri: 'https://github.com/rails/rails',
          bug_tracker_uri: 'https://github.com/rails/rails/issues',
          changelog_uri: null,
          funding_uri: null,
          dependencies: {
            development: [],
            runtime: []
          }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      });

      const result = await client.searchGems('web framework');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://rubygems.org/api/v1/search.json?query=web+framework',
        expect.any(Object)
      );

      expect(result).toEqual(mockSearchResponse);
    });

    it('should handle empty search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await client.searchGems('nonexistent-query');

      expect(result).toEqual([]);
    });
  });

  describe('getGemVersions', () => {
    it('should fetch gem versions successfully', async () => {
      const mockVersions = [
        {
          authors: 'David Heinemeier Hansson',
          built_at: '2021-12-15T00:00:00.000Z',
          created_at: '2021-12-15T00:00:00.000Z',
          description: 'Full-stack web application framework.',
          downloads_count: 1000000,
          metadata: {},
          number: '7.0.0',
          summary: 'Full-stack web application framework.',
          platform: 'ruby',
          ruby_version: '>= 2.7.0',
          prerelease: false,
          licenses: ['MIT'],
          requirements: [],
          sha: 'abc123'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVersions),
      });

      const result = await client.getGemVersions('rails');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://rubygems.org/api/v1/gems/rails/versions.json',
        expect.any(Object)
      );

      expect(result).toEqual(mockVersions);
    });

    it('should throw GemNotFoundError for unknown gems', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(client.getGemVersions('nonexistent-gem')).rejects.toThrow(GemNotFoundError);
    });
  });
});