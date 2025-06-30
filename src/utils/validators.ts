import { GemReadmeMcpError } from '../types/index.js';
import { 
  VALIDATION_LIMITS, 
  RESERVED_GEM_NAMES, 
  GEM_NAME_PATTERNS, 
  VERSION_PATTERNS 
} from '../config/constants.js';

export function validateGemName(gemName: string): void {
  if (!gemName || typeof gemName !== 'string') {
    throw new GemReadmeMcpError('Gem name is required and must be a string', 'INVALID_GEM_NAME');
  }

  const trimmed = gemName.trim();
  if (trimmed.length === 0) {
    throw new GemReadmeMcpError('Gem name cannot be empty', 'INVALID_GEM_NAME');
  }

  if (trimmed.length > VALIDATION_LIMITS.MAX_GEM_NAME_LENGTH) {
    throw new GemReadmeMcpError(`Gem name cannot exceed ${VALIDATION_LIMITS.MAX_GEM_NAME_LENGTH} characters`, 'INVALID_GEM_NAME');
  }

  if (!GEM_NAME_PATTERNS.VALID_NAME.test(trimmed)) {
    throw new GemReadmeMcpError(
      'Gem name must start and end with alphanumeric characters and can contain hyphens, underscores, and periods',
      'INVALID_GEM_NAME'
    );
  }

  if (GEM_NAME_PATTERNS.INVALID_SEQUENCES.test(trimmed)) {
    throw new GemReadmeMcpError('Gem name contains invalid character sequences', 'INVALID_GEM_NAME');
  }

  if (RESERVED_GEM_NAMES.includes(trimmed.toLowerCase() as any)) {
    throw new GemReadmeMcpError('Gem name cannot be a reserved word', 'INVALID_GEM_NAME');
  }
}

export function validateVersion(version: string): void {
  if (!version || typeof version !== 'string') {
    throw new GemReadmeMcpError('Version must be a string', 'INVALID_VERSION');
  }

  const trimmed = version.trim();
  if (trimmed.length === 0) {
    throw new GemReadmeMcpError('Version cannot be empty', 'INVALID_VERSION');
  }

  // Allow "latest" as a special version
  if (trimmed === 'latest') {
    return;
  }

  if (!VERSION_PATTERNS.SEMANTIC_VERSION.test(trimmed) && !VERSION_PATTERNS.PRE_RELEASE.test(trimmed)) {
    throw new GemReadmeMcpError(
      'Version must be a valid semantic version (e.g., 1.0.0) or "latest"',
      'INVALID_VERSION'
    );
  }
}

export function validateSearchQuery(query: string): void {
  if (!query || typeof query !== 'string') {
    throw new GemReadmeMcpError('Search query is required and must be a string', 'INVALID_SEARCH_QUERY');
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new GemReadmeMcpError('Search query cannot be empty', 'INVALID_SEARCH_QUERY');
  }

  if (trimmed.length > VALIDATION_LIMITS.MAX_SEARCH_QUERY_LENGTH) {
    throw new GemReadmeMcpError(`Search query cannot exceed ${VALIDATION_LIMITS.MAX_SEARCH_QUERY_LENGTH} characters`, 'INVALID_SEARCH_QUERY');
  }
}

export function validateLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < VALIDATION_LIMITS.MIN_SEARCH_LIMIT || limit > VALIDATION_LIMITS.MAX_SEARCH_LIMIT) {
    throw new GemReadmeMcpError(`Limit must be an integer between ${VALIDATION_LIMITS.MIN_SEARCH_LIMIT} and ${VALIDATION_LIMITS.MAX_SEARCH_LIMIT}`, 'INVALID_LIMIT');
  }
}

export function validateScore(score: number, name: string): void {
  if (typeof score !== 'number' || score < VALIDATION_LIMITS.MIN_SCORE || score > VALIDATION_LIMITS.MAX_SCORE) {
    throw new GemReadmeMcpError(`${name} must be a number between ${VALIDATION_LIMITS.MIN_SCORE} and ${VALIDATION_LIMITS.MAX_SCORE}`, 'INVALID_SCORE');
  }
}

export function validateGetPackageReadmeParams(args: unknown): { package_name: string; version?: string; include_examples?: boolean } {
  if (!args || typeof args !== 'object') {
    throw new GemReadmeMcpError('Arguments must be an object', 'INVALID_ARGS');
  }

  const params = args as Record<string, unknown>;

  if (!params.package_name || typeof params.package_name !== 'string') {
    throw new GemReadmeMcpError('package_name is required and must be a string', 'INVALID_ARGS');
  }

  validateGemName(params.package_name);

  if (params.version !== undefined) {
    if (typeof params.version !== 'string') {
      throw new GemReadmeMcpError('version must be a string', 'INVALID_ARGS');
    }
    if (params.version !== 'latest') {
      validateVersion(params.version);
    }
  }

  if (params.include_examples !== undefined && typeof params.include_examples !== 'boolean') {
    throw new GemReadmeMcpError('include_examples must be a boolean', 'INVALID_ARGS');
  }

  const result: { package_name: string; version?: string; include_examples?: boolean } = {
    package_name: params.package_name,
  };
  
  if (params.version !== undefined) {
    result.version = params.version as string;
  }
  
  if (params.include_examples !== undefined) {
    result.include_examples = params.include_examples as boolean;
  }
  
  return result;
}

export function validateGetPackageInfoParams(args: unknown): { package_name: string; include_dependencies?: boolean; include_dev_dependencies?: boolean } {
  if (!args || typeof args !== 'object') {
    throw new GemReadmeMcpError('Arguments must be an object', 'INVALID_ARGS');
  }

  const params = args as Record<string, unknown>;

  if (!params.package_name || typeof params.package_name !== 'string') {
    throw new GemReadmeMcpError('package_name is required and must be a string', 'INVALID_ARGS');
  }

  validateGemName(params.package_name);

  if (params.include_dependencies !== undefined && typeof params.include_dependencies !== 'boolean') {
    throw new GemReadmeMcpError('include_dependencies must be a boolean', 'INVALID_ARGS');
  }

  if (params.include_dev_dependencies !== undefined && typeof params.include_dev_dependencies !== 'boolean') {
    throw new GemReadmeMcpError('include_dev_dependencies must be a boolean', 'INVALID_ARGS');
  }

  const result: { package_name: string; include_dependencies?: boolean; include_dev_dependencies?: boolean } = {
    package_name: params.package_name,
  };
  
  if (params.include_dependencies !== undefined) {
    result.include_dependencies = params.include_dependencies as boolean;
  }
  
  if (params.include_dev_dependencies !== undefined) {
    result.include_dev_dependencies = params.include_dev_dependencies as boolean;
  }
  
  return result;
}

export function validateSearchPackagesParams(args: unknown): { query: string; limit?: number; quality?: number; popularity?: number } {
  if (!args || typeof args !== 'object') {
    throw new GemReadmeMcpError('Arguments must be an object', 'INVALID_ARGS');
  }

  const params = args as Record<string, unknown>;

  if (!params.query || typeof params.query !== 'string') {
    throw new GemReadmeMcpError('query is required and must be a string', 'INVALID_ARGS');
  }

  validateSearchQuery(params.query);

  if (params.limit !== undefined) {
    if (typeof params.limit !== 'number' || params.limit < VALIDATION_LIMITS.MIN_SEARCH_LIMIT || params.limit > VALIDATION_LIMITS.MAX_SEARCH_LIMIT) {
      throw new GemReadmeMcpError(`limit must be a number between ${VALIDATION_LIMITS.MIN_SEARCH_LIMIT} and ${VALIDATION_LIMITS.MAX_SEARCH_LIMIT}`, 'INVALID_ARGS');
    }
  }

  if (params.quality !== undefined) {
    if (typeof params.quality !== 'number' || params.quality < VALIDATION_LIMITS.MIN_SCORE || params.quality > VALIDATION_LIMITS.MAX_SCORE) {
      throw new GemReadmeMcpError(`quality must be a number between ${VALIDATION_LIMITS.MIN_SCORE} and ${VALIDATION_LIMITS.MAX_SCORE}`, 'INVALID_ARGS');
    }
  }

  if (params.popularity !== undefined) {
    if (typeof params.popularity !== 'number' || params.popularity < VALIDATION_LIMITS.MIN_SCORE || params.popularity > VALIDATION_LIMITS.MAX_SCORE) {
      throw new GemReadmeMcpError(`popularity must be a number between ${VALIDATION_LIMITS.MIN_SCORE} and ${VALIDATION_LIMITS.MAX_SCORE}`, 'INVALID_ARGS');
    }
  }

  const result: { query: string; limit?: number; quality?: number; popularity?: number } = {
    query: params.query,
  };
  
  if (params.limit !== undefined) {
    result.limit = params.limit as number;
  }
  
  if (params.quality !== undefined) {
    result.quality = params.quality as number;
  }
  
  if (params.popularity !== undefined) {
    result.popularity = params.popularity as number;
  }
  
  return result;
}