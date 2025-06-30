import { logger } from '../utils/logger.js';
import { handleApiError, handleHttpError, withRetry } from '../utils/error-handler.js';
import { API_CONFIG, RUBYGEMS_API } from '../config/constants.js';
import {
  RubyGemsGemInfo,
  RubyGemsSearchResponse,
  RubyGemsVersionsResponse,
  GemNotFoundError,
  VersionNotFoundError,
} from '../types/index.js';

export class RubyGemsApiClient {
  private readonly baseUrl = RUBYGEMS_API.BASE_URL;
  private readonly timeout: number;

  constructor(timeout?: number) {
    this.timeout = timeout || API_CONFIG.TIMEOUT;
  }

  async getGemInfo(gemName: string): Promise<RubyGemsGemInfo> {
    const url = `${this.baseUrl}${RUBYGEMS_API.ENDPOINTS.GEM_INFO(gemName)}`;
    
    return withRetry(async () => {
      logger.debug(`Fetching gem info from RubyGems: ${gemName}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': API_CONFIG.USER_AGENT,
        };

        const response = await fetch(url, {
          signal: controller.signal,
          headers,
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new GemNotFoundError(gemName);
          }
          handleHttpError(response.status, response, `RubyGems gem info for ${gemName}`);
        }

        const gemInfo = await response.json() as RubyGemsGemInfo;
        logger.debug(`Successfully fetched gem info from RubyGems: ${gemName}`);
        return gemInfo;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          handleApiError(new Error('Request timeout'), `RubyGems gem info for ${gemName}`);
        }
        handleApiError(error, `RubyGems gem info for ${gemName}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }, API_CONFIG.MAX_RETRIES, API_CONFIG.RETRY_DELAY, `RubyGems API getGemInfo(${gemName})`);
  }

  async getGemVersions(gemName: string): Promise<RubyGemsVersionsResponse[]> {
    const url = `${this.baseUrl}${RUBYGEMS_API.ENDPOINTS.GEM_VERSIONS(gemName)}`;
    
    return withRetry(async () => {
      logger.debug(`Fetching gem versions from RubyGems: ${gemName}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': API_CONFIG.USER_AGENT,
        };

        const response = await fetch(url, {
          signal: controller.signal,
          headers,
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new GemNotFoundError(gemName);
          }
          handleHttpError(response.status, response, `RubyGems gem versions for ${gemName}`);
        }

        const versions = await response.json() as RubyGemsVersionsResponse[];
        logger.debug(`Successfully fetched gem versions from RubyGems: ${gemName}`);
        return versions;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          handleApiError(new Error('Request timeout'), `RubyGems gem versions for ${gemName}`);
        }
        handleApiError(error, `RubyGems gem versions for ${gemName}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }, API_CONFIG.MAX_RETRIES, API_CONFIG.RETRY_DELAY, `RubyGems API getGemVersions(${gemName})`);
  }

  async getSpecificVersion(gemName: string, version: string): Promise<RubyGemsGemInfo> {
    const url = `${this.baseUrl}${RUBYGEMS_API.ENDPOINTS.SPECIFIC_VERSION(gemName, version)}`;
    
    return withRetry(async () => {
      logger.debug(`Fetching specific gem version from RubyGems: ${gemName}@${version}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': API_CONFIG.USER_AGENT,
        };

        const response = await fetch(url, {
          signal: controller.signal,
          headers,
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new VersionNotFoundError(gemName, version);
          }
          handleHttpError(response.status, response, `RubyGems gem ${gemName}@${version}`);
        }

        const gemInfo = await response.json() as RubyGemsGemInfo;
        logger.debug(`Successfully fetched specific gem version from RubyGems: ${gemName}@${version}`);
        return gemInfo;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          handleApiError(new Error('Request timeout'), `RubyGems gem ${gemName}@${version}`);
        }
        handleApiError(error, `RubyGems gem ${gemName}@${version}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }, API_CONFIG.MAX_RETRIES, API_CONFIG.RETRY_DELAY, `RubyGems API getSpecificVersion(${gemName}@${version})`);
  }

  async searchGems(query: string, limit?: number): Promise<RubyGemsSearchResponse[]> {
    const url = new URL(`${this.baseUrl}${RUBYGEMS_API.ENDPOINTS.SEARCH}`);
    url.searchParams.set('query', query);
    
    return withRetry(async () => {
      logger.debug(`Searching gems on RubyGems: ${query}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': API_CONFIG.USER_AGENT,
        };

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers,
        });

        if (!response.ok) {
          handleHttpError(response.status, response, `RubyGems search for "${query}"`);
        }

        let results = await response.json() as RubyGemsSearchResponse[];
        
        // Apply limit if specified
        if (limit && limit > 0) {
          results = results.slice(0, limit);
        }
        
        logger.debug(`Successfully searched gems on RubyGems: ${query} (${results.length} results)`);
        return results;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          handleApiError(new Error('Request timeout'), `RubyGems search for "${query}"`);
        }
        handleApiError(error, `RubyGems search for "${query}"`);
      } finally {
        clearTimeout(timeoutId);
      }
    }, API_CONFIG.MAX_RETRIES, API_CONFIG.RETRY_DELAY, `RubyGems API searchGems("${query}")`);
  }

  async getGemDependencies(gemName: string, version?: string): Promise<{ runtime: any[]; development: any[] }> {
    const gemInfo = version ? 
      await this.getSpecificVersion(gemName, version) :
      await this.getGemInfo(gemName);
    
    return gemInfo.dependencies || { runtime: [], development: [] };
  }

  parseRepositoryFromMetadata(gemInfo: RubyGemsGemInfo): { type: string; url: string } | null {
    // Try to extract repository info from various metadata fields
    if (gemInfo.source_code_uri) {
      return { type: 'git', url: gemInfo.source_code_uri };
    }
    
    if (gemInfo.metadata?.source_code_uri) {
      return { type: 'git', url: gemInfo.metadata.source_code_uri };
    }
    
    if (gemInfo.homepage_uri && gemInfo.homepage_uri.includes('github.com')) {
      return { type: 'git', url: gemInfo.homepage_uri };
    }
    
    return null;
  }

  isValidGemName(gemName: string): boolean {
    // Ruby gem name validation
    return /^[a-zA-Z0-9][a-zA-Z0-9\-_.]*[a-zA-Z0-9]$/.test(gemName) || /^[a-zA-Z0-9]$/.test(gemName);
  }
}

export const rubygemsApi = new RubyGemsApiClient();