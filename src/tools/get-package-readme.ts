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

function createNotFoundResponse(package_name: string, version: string): PackageReadmeResponse {
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

async function fetchGemInfo(package_name: string, version: string) {
  logger.debug(`Getting gem info for: ${package_name}@${version}`);
  if (version === 'latest') {
    return await rubygemsApi.getGemInfo(package_name);
  } else {
    return await rubygemsApi.getSpecificVersion(package_name, version);
  }
}

async function fetchReadmeContent(gemInfo: any, package_name: string): Promise<{ content: string; source: string }> {
  const repository = rubygemsApi.parseRepositoryFromMetadata(gemInfo);
  if (repository) {
    const githubReadme = await githubApi.getReadmeFromRepository(repository);
    if (githubReadme) {
      logger.debug(`Got README from GitHub: ${package_name}`);
      return { content: githubReadme, source: 'github' };
    }
  }

  if (gemInfo.description) {
    logger.debug(`Using gem description as README: ${package_name}`);
    return { 
      content: `# ${gemInfo.name}\n\n${gemInfo.description}`, 
      source: 'description' 
    };
  }

  return { content: '', source: 'none' };
}

function createBasicInfo(gemInfo: any): PackageBasicInfo {
  const authors = Array.isArray(gemInfo.authors) ? gemInfo.authors : [gemInfo.authors];
  return {
    name: gemInfo.name,
    version: gemInfo.version,
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
}

function createInstallationInfo(package_name: string): InstallationInfo {
  return {
    gem: `gem install ${package_name}`,
    bundler: `bundle add ${package_name}`,
    gemfile: `gem '${package_name}'`,
  };
}

function createRepositoryInfo(gemInfo: any): RepositoryInfo | undefined {
  const repository = rubygemsApi.parseRepositoryFromMetadata(gemInfo);
  if (repository) {
    return {
      type: repository.type,
      url: repository.url,
      directory: undefined,
    };
  }
  return undefined;
}

export async function getPackageReadme(params: GetPackageReadmeParams): Promise<PackageReadmeResponse> {
  const { package_name, version = 'latest', include_examples = true } = params;

  logger.info(`Fetching gem README: ${package_name}@${version}`);

  validateGemName(package_name);
  if (version !== 'latest') {
    validateVersion(version);
  }

  const cacheKey = createCacheKey.gemReadme(package_name, version);
  const cached = cache.get<PackageReadmeResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for gem README: ${package_name}@${version}`);
    return cached;
  }

  try {
    let gemInfo;
    
    try {
      gemInfo = await fetchGemInfo(package_name, version);
    } catch (error) {
      logger.debug(`Gem not found: ${package_name}`);
      return createNotFoundResponse(package_name, version);
    }
    
    logger.debug(`Gem info retrieved for: ${package_name}@${gemInfo.version}`);

    const { content: readmeContent, source: readmeSource } = await fetchReadmeContent(gemInfo, package_name);
    
    const cleanedReadme = readmeParser.cleanMarkdown(readmeContent);
    const usageExamples = readmeParser.parseUsageExamples(readmeContent, include_examples);
    const installation = createInstallationInfo(package_name);
    const basicInfo = createBasicInfo(gemInfo);
    const repositoryInfo = createRepositoryInfo(gemInfo);

    const response: PackageReadmeResponse = {
      package_name,
      version: gemInfo.version,
      description: basicInfo.description,
      readme_content: cleanedReadme,
      usage_examples: usageExamples,
      installation,
      basic_info: basicInfo,
      repository: repositoryInfo,
      exists: true,
    };

    cache.set(cacheKey, response);

    logger.info(`Successfully fetched gem README: ${package_name}@${gemInfo.version} (README source: ${readmeSource})`);
    return response;

  } catch (error) {
    logger.error(`Failed to fetch gem README: ${package_name}@${version}`, { error });
    throw error;
  }
}