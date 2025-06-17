import { logger } from '../utils/logger.js';
import { validateGemName, validateVersion } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { rubygemsApi } from '../services/rubygems-api.js';
import { githubApi } from '../services/github-api.js';
import { readmeParser } from '../services/readme-parser.js';
import {
  GetPackageReadmeParams,
  PackageReadmeResponse,
  InstallationInfo,
  PackageBasicInfo,
  RepositoryInfo,
} from '../types/index.js';

export async function getPackageReadme(params: GetPackageReadmeParams): Promise<PackageReadmeResponse> {
  const { package_name, version = 'latest', include_examples = true } = params;

  logger.info(`Fetching gem README: ${package_name}@${version}`);

  // Validate inputs
  validateGemName(package_name);
  if (version !== 'latest') {
    validateVersion(version);
  }

  // Check cache first
  const cacheKey = createCacheKey.gemReadme(package_name, version);
  const cached = cache.get<PackageReadmeResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for gem README: ${package_name}@${version}`);
    return cached;
  }

  try {
    // Get gem info from RubyGems directly
    let gemInfo;
    
    try {
      logger.debug(`Getting gem info for: ${package_name}@${version}`);
      if (version === 'latest') {
        gemInfo = await rubygemsApi.getGemInfo(package_name);
      } else {
        gemInfo = await rubygemsApi.getSpecificVersion(package_name, version);
      }
    } catch (error) {
      // If gem not found, return a response indicating non-existence
      logger.debug(`Gem not found: ${package_name}`);
      return {
        package_name,
        version: version || 'latest',
        description: 'Gem not found',
        readme_content: '',
        usage_examples: [],
        installation: {
          gem: `gem install ${package_name}`,
          bundler: `bundle add ${package_name}`,
          gemfile: `gem '${package_name}'`,
        },
        basic_info: {
          name: package_name,
          version: version || 'latest',
          description: 'Gem not found',
          platform: 'ruby',
          homepage: undefined,
          documentation_uri: undefined,
          source_code_uri: undefined,
          bug_tracker_uri: undefined,
          license: 'Unknown',
          authors: [],
          licenses: [],
        },
        exists: false,
      };
    }
    
    logger.debug(`Gem info retrieved for: ${package_name}@${gemInfo.version}`);

    const actualVersion = gemInfo.version;

    // Try to get README content
    let readmeContent = '';
    let readmeSource = 'none';

    // Try to get README from GitHub (RubyGems doesn't store README content directly)
    const repository = rubygemsApi.parseRepositoryFromMetadata(gemInfo);
    if (repository) {
      const githubReadme = await githubApi.getReadmeFromRepository(repository);
      if (githubReadme) {
        readmeContent = githubReadme;
        readmeSource = 'github';
        logger.debug(`Got README from GitHub: ${package_name}`);
      }
    }

    // If no GitHub README found, use description as fallback
    if (!readmeContent && gemInfo.description) {
      readmeContent = `# ${gemInfo.name}\n\n${gemInfo.description}`;
      readmeSource = 'description';
      logger.debug(`Using gem description as README: ${package_name}`);
    }

    // Clean and process README content
    const cleanedReadme = readmeParser.cleanMarkdown(readmeContent);
    
    // Extract usage examples
    const usageExamples = readmeParser.parseUsageExamples(readmeContent, include_examples);

    // Create installation info
    const installation: InstallationInfo = {
      gem: `gem install ${package_name}`,
      bundler: `bundle add ${package_name}`,
      gemfile: `gem '${package_name}'`,
    };

    // Create basic info
    const authors = Array.isArray(gemInfo.authors) ? gemInfo.authors : [gemInfo.authors];
    const basicInfo: PackageBasicInfo = {
      name: gemInfo.name,
      version: actualVersion,
      description: gemInfo.description || gemInfo.info || 'No description available',
      platform: gemInfo.platform || 'ruby',
      homepage: gemInfo.homepage_uri || gemInfo.metadata?.homepage_uri || undefined,
      documentation_uri: gemInfo.documentation_uri || gemInfo.metadata?.documentation_uri || undefined,
      source_code_uri: gemInfo.source_code_uri || gemInfo.metadata?.source_code_uri || undefined,
      bug_tracker_uri: gemInfo.bug_tracker_uri || gemInfo.metadata?.bug_tracker_uri || undefined,
      license: gemInfo.licenses?.length > 0 ? gemInfo.licenses[0] : 'Unknown',
      authors: authors.length > 0 ? authors : ['Unknown'],
      licenses: gemInfo.licenses || [],
    };

    // Create repository info
    let repositoryInfo: RepositoryInfo | undefined;
    if (repository) {
      repositoryInfo = {
        type: repository.type,
        url: repository.url,
        directory: undefined,
      };
    }

    // Create response
    const response: PackageReadmeResponse = {
      package_name,
      version: actualVersion,
      description: basicInfo.description,
      readme_content: cleanedReadme,
      usage_examples: usageExamples,
      installation,
      basic_info: basicInfo,
      repository: repositoryInfo || undefined,
      exists: true,
    };

    // Cache the response
    cache.set(cacheKey, response);

    logger.info(`Successfully fetched gem README: ${package_name}@${actualVersion} (README source: ${readmeSource})`);
    return response;

  } catch (error) {
    logger.error(`Failed to fetch gem README: ${package_name}@${version}`, { error });
    throw error;
  }
}