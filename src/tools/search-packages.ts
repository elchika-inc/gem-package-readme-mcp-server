import { logger } from '../utils/logger.js';
import { validateSearchQuery, validateLimit, validateScore } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { rubygemsApi } from '../services/rubygems-api.js';
import {
  SearchPackagesParams,
  SearchPackagesResponse,
  PackageSearchResult,
  RubyGemsSearchResponse,
} from '../types/index.js';

// Score calculation constants
const MAX_DOWNLOADS_FOR_SCORE = 10_000_000;
const BASE_QUALITY_SCORE = 0.5;
const QUALITY_BONUS = 0.1;

function calculatePopularityScore(downloads: number): number {
  return downloads > 0 ? Math.min(downloads / MAX_DOWNLOADS_FOR_SCORE, 1) : 0;
}

function calculateQualityScore(gem: RubyGemsSearchResponse): number {
  let score = BASE_QUALITY_SCORE;
  
  if (gem.documentation_uri) score += QUALITY_BONUS;
  if (gem.source_code_uri) score += QUALITY_BONUS;
  if (gem.homepage_uri) score += QUALITY_BONUS;
  if (gem.licenses?.length > 0) score += QUALITY_BONUS;
  if (gem.info?.length > 50) score += QUALITY_BONUS;
  
  return Math.min(score, 1);
}

export async function searchPackages(params: SearchPackagesParams): Promise<SearchPackagesResponse> {
  const { 
    query, 
    limit = 20, 
    quality,
    popularity 
  } = params;

  logger.info(`Searching gems: "${query}" (limit: ${limit})`);

  // Validate inputs
  validateSearchQuery(query);
  validateLimit(limit);
  
  if (quality !== undefined) {
    validateScore(quality, 'Quality');
  }
  
  if (popularity !== undefined) {
    validateScore(popularity, 'Popularity');
  }

  // Check cache first
  const cacheKey = createCacheKey.searchResults(query, limit, popularity, quality);
  const cached = cache.get<SearchPackagesResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for search: "${query}"`);
    return cached;
  }

  try {
    // Search gems using RubyGems API
    const searchResults = await rubygemsApi.searchGems(query, limit);
    
    // Transform results to our format
    let packages: PackageSearchResult[] = searchResults.map(gem => ({
      name: gem.name,
      version: gem.version,
      description: gem.info || 'No description available',
      authors: gem.authors,
      licenses: gem.licenses || [],
      downloads: gem.downloads,
      version_downloads: gem.version_downloads,
      homepage_uri: gem.homepage_uri,
      project_uri: gem.project_uri,
      gem_uri: gem.gem_uri,
      documentation_uri: gem.documentation_uri,
      source_code_uri: gem.source_code_uri,
      score: calculatePopularityScore(gem.downloads),
      quality_score: calculateQualityScore(gem),
    }));

    // Filter results based on quality if specified
    if (quality !== undefined) {
      packages = packages.filter(pkg => (pkg.quality_score || 0) >= quality);
    }

    // Filter results based on popularity if specified
    if (popularity !== undefined) {
      packages = packages.filter(pkg => (pkg.score || 0) >= popularity);
    }

    // Sort by downloads (popularity) in descending order
    packages.sort((a, b) => b.downloads - a.downloads);

    // Limit results
    packages = packages.slice(0, limit);

    // Create response
    const response: SearchPackagesResponse = {
      query,
      total: packages.length,
      packages,
    };

    // Cache the response with default search TTL
    cache.set(cacheKey, response);

    logger.info(`Successfully searched gems: "${query}", found ${response.total} results`);
    return response;

  } catch (error) {
    logger.error(`Failed to search gems: "${query}"`, { error });
    throw error;
  }
}