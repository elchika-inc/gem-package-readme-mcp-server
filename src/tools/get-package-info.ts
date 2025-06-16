import { logger } from '../utils/logger.js';
import { validateGemName } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { rubygemsApi } from '../services/rubygems-api.js';
import {
  GetPackageInfoParams,
  PackageInfoResponse,
  RepositoryInfo,
  DownloadStats,
  GemDependency,
} from '../types/index.js';

export async function getPackageInfo(params: GetPackageInfoParams): Promise<PackageInfoResponse> {
  const { 
    package_name, 
    include_dependencies = true, 
    include_dev_dependencies = false 
  } = params;

  logger.info(`Fetching gem info: ${package_name}`);

  // Validate inputs
  validateGemName(package_name);

  // Check cache first
  const cacheKey = createCacheKey.gemInfo(package_name, 'latest');
  const cached = cache.get<PackageInfoResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for gem info: ${package_name}`);
    return cached;
  }

  try {
    // Get gem info from RubyGems
    const gemInfo = await rubygemsApi.getGemInfo(package_name);
    
    // Extract author information
    const authorsArray: string[] = Array.isArray(gemInfo.authors) 
      ? gemInfo.authors 
      : [gemInfo.authors];

    // Extract repository information
    let repository: RepositoryInfo | undefined;
    const repoInfo = rubygemsApi.parseRepositoryFromMetadata(gemInfo);
    if (repoInfo) {
      repository = {
        type: repoInfo.type,
        url: repoInfo.url,
        directory: undefined,
      };
    }

    // Create download stats
    const downloadStats: DownloadStats = {
      total_downloads: gemInfo.downloads || 0,
      version_downloads: 0, // RubyGems API doesn't provide version-specific downloads in the main endpoint
    };

    // Prepare dependencies
    let dependencies: GemDependency[] | undefined;
    let devDependencies: GemDependency[] | undefined;

    if (include_dependencies && gemInfo.dependencies?.runtime) {
      dependencies = gemInfo.dependencies.runtime;
    }

    if (include_dev_dependencies && gemInfo.dependencies?.development) {
      devDependencies = gemInfo.dependencies.development;
    }

    // Create response
    const response: PackageInfoResponse = {
      package_name,
      latest_version: gemInfo.version,
      description: gemInfo.description || gemInfo.info || 'No description available',
      authors: authorsArray,
      licenses: gemInfo.licenses || [],
      platform: gemInfo.platform || 'ruby',
      dependencies: dependencies || undefined,
      dev_dependencies: devDependencies || undefined,
      download_stats: downloadStats,
      repository: repository || undefined,
      homepage: gemInfo.homepage_uri || gemInfo.metadata?.homepage_uri || undefined,
      documentation_uri: gemInfo.documentation_uri || gemInfo.metadata?.documentation_uri || undefined,
      source_code_uri: gemInfo.source_code_uri || gemInfo.metadata?.source_code_uri || undefined,
    };

    // Cache the response
    cache.set(cacheKey, response);

    logger.info(`Successfully fetched gem info: ${package_name}@${gemInfo.version}`);
    return response;

  } catch (error) {
    logger.error(`Failed to fetch gem info: ${package_name}`, { error });
    throw error;
  }
}