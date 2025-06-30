export const API_CONFIG = {
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  USER_AGENT: 'gem-package-readme-mcp/1.0.0',
} as const;

export const VALIDATION_LIMITS = {
  MAX_GEM_NAME_LENGTH: 100,
  MAX_SEARCH_QUERY_LENGTH: 250,
  MIN_SEARCH_LIMIT: 1,
  MAX_SEARCH_LIMIT: 100,
  MIN_SCORE: 0,
  MAX_SCORE: 1,
} as const;

export const RESERVED_GEM_NAMES = ['gem', 'ruby', 'rubygems'] as const;

export const GEM_NAME_PATTERNS = {
  VALID_NAME: /^[a-zA-Z0-9][a-zA-Z0-9\-_.]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
  INVALID_SEQUENCES: /\.\.|\-\-|__/,
} as const;

export const VERSION_PATTERNS = {
  SEMANTIC_VERSION: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.?((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  PRE_RELEASE: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.?(alpha|beta|rc|pre)\.?(0|[1-9]\d*)?)$/,
} as const;

export const RUBYGEMS_API = {
  BASE_URL: 'https://rubygems.org/api/v1',
  ENDPOINTS: {
    GEM_INFO: (gemName: string) => `/gems/${encodeURIComponent(gemName)}.json`,
    GEM_VERSIONS: (gemName: string) => `/gems/${encodeURIComponent(gemName)}/versions.json`,
    SPECIFIC_VERSION: (gemName: string, version: string) => 
      `/gems/${encodeURIComponent(gemName)}/versions/${encodeURIComponent(version)}.json`,
    SEARCH: '/search.json',
  },
} as const;