export interface UsageExample {
  title: string;
  description?: string | undefined;
  code: string;
  language: string; // 'ruby', 'bash', 'yaml', etc.
}

export interface InstallationInfo {
  gem: string;      // "gem install gem-name"
  bundler?: string; // "bundle add gem-name" or Gemfile entry
  gemfile?: string; // Gemfile entry format
}

export interface AuthorInfo {
  name: string;
  email?: string;
  url?: string;
}

export interface RepositoryInfo {
  type: string;
  url: string;
  directory?: string | undefined;
}

export interface PackageBasicInfo {
  name: string;
  version: string;
  description: string;
  platform: string;
  homepage?: string | undefined;
  documentation_uri?: string | undefined;
  source_code_uri?: string | undefined;
  bug_tracker_uri?: string | undefined;
  license: string;
  authors: string | string[];
  licenses: string[];
}

export interface DownloadStats {
  total_downloads: number;
  version_downloads: number;
  downloads_rank?: number;
}

export interface GemDependency {
  name: string;
  requirements: string;
}

export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  authors: string;
  licenses: string[];
  downloads: number;
  version_downloads: number;
  homepage_uri?: string | undefined;
  project_uri: string;
  gem_uri: string;
  documentation_uri?: string | undefined;
  source_code_uri?: string | undefined;
  score?: number | undefined; // Calculated popularity score
  quality_score?: number | undefined; // Calculated quality score
}

// Tool Parameters
export interface GetPackageReadmeParams {
  package_name: string;    // Gem name (required)
  version?: string;        // Version specification (optional, default: "latest")
  include_examples?: boolean; // Whether to include examples (optional, default: true)
}

export interface GetPackageInfoParams {
  package_name: string;
  include_dependencies?: boolean; // Whether to include dependencies (default: true)
  include_dev_dependencies?: boolean; // Whether to include development dependencies (default: false)
}

export interface SearchPackagesParams {
  query: string;          // Search query
  limit?: number;         // Maximum number of results (default: 20)
  quality?: number;       // Quality score minimum (0-1) - not directly supported by RubyGems
  popularity?: number;    // Popularity score minimum (0-1) - based on downloads
}

// Tool Responses
export interface PackageReadmeResponse {
  package_name: string;
  version: string;
  description: string;
  readme_content: string;
  usage_examples: UsageExample[];
  installation: InstallationInfo;
  basic_info: PackageBasicInfo;
  repository?: RepositoryInfo | undefined;
  exists: boolean;
}

export interface PackageInfoResponse {
  package_name: string;
  latest_version: string;
  description: string;
  authors: string | string[];
  licenses: string[];
  platform: string;
  dependencies?: GemDependency[] | undefined;
  dev_dependencies?: GemDependency[] | undefined;
  download_stats: DownloadStats;
  repository?: RepositoryInfo | undefined;
  homepage?: string | undefined;
  documentation_uri?: string | undefined;
  source_code_uri?: string | undefined;
  exists: boolean;
}

export interface SearchPackagesResponse {
  query: string;
  total: number;
  packages: PackageSearchResult[];
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

// RubyGems API Types
export interface RubyGemsGemInfo {
  name: string;
  version: string;
  platform: string;
  authors: string;
  info: string; // description
  licenses: string[];
  metadata: {
    homepage_uri?: string;
    changelog_uri?: string;
    source_code_uri?: string;
    documentation_uri?: string;
    bug_tracker_uri?: string;
    funding_uri?: string;
    mailing_list_uri?: string;
    wiki_uri?: string;
  };
  sha: string;
  project_uri: string;
  gem_uri: string;
  homepage_uri?: string;
  wiki_uri?: string;
  documentation_uri?: string;
  mailing_list_uri?: string;
  source_code_uri?: string;
  bug_tracker_uri?: string;
  changelog_uri?: string;
  funding_uri?: string;
  dependencies: {
    development: GemDependency[];
    runtime: GemDependency[];
  };
  built_at: string;
  created_at: string;
  description: string;
  downloads: number;
  number: string; // version number
  summary: string;
  rubygems_version: string;
  ruby_version?: string;
  prerelease: boolean;
  requirements: string[];
  yanked: boolean;
}

export interface RubyGemsSearchResponse {
  name: string;
  version: string;
  platform: string;
  authors: string;
  info: string;
  licenses: string[];
  metadata: Record<string, any>;
  sha: string;
  project_uri: string;
  gem_uri: string;
  homepage_uri?: string;
  wiki_uri?: string;
  documentation_uri?: string;
  mailing_list_uri?: string;
  source_code_uri?: string;
  bug_tracker_uri?: string;
  changelog_uri?: string;
  funding_uri?: string;
  downloads: number;
  version_downloads: number;
}

export interface RubyGemsVersionsResponse {
  authors: string;
  built_at: string;
  created_at: string;
  description: string;
  downloads: number;
  metadata: Record<string, any>;
  number: string;
  summary: string;
  platform: string;
  rubygems_version: string;
  ruby_version?: string;
  prerelease: boolean;
  licenses: string[];
  requirements: string[];
  sha: string;
  yanked: boolean;
}

// GitHub API Types
export interface GitHubReadmeResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

// Error Types
export class GemReadmeMcpError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GemReadmeMcpError';
  }
}

export class GemNotFoundError extends GemReadmeMcpError {
  constructor(gemName: string) {
    super(`Gem '${gemName}' not found`, 'GEM_NOT_FOUND', 404);
  }
}

export class VersionNotFoundError extends GemReadmeMcpError {
  constructor(gemName: string, version: string) {
    super(`Version '${version}' of gem '${gemName}' not found`, 'VERSION_NOT_FOUND', 404);
  }
}

export class RateLimitError extends GemReadmeMcpError {
  constructor(service: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${service}`, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
  }
}

export class NetworkError extends GemReadmeMcpError {
  constructor(message: string, originalError?: Error) {
    super(`Network error: ${message}`, 'NETWORK_ERROR', undefined, originalError);
  }
}