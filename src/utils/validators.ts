import { GemReadmeMcpError } from '../types/index.js';

export function validateGemName(gemName: string): void {
  if (!gemName || typeof gemName !== 'string') {
    throw new GemReadmeMcpError('Gem name is required and must be a string', 'INVALID_GEM_NAME');
  }

  const trimmed = gemName.trim();
  if (trimmed.length === 0) {
    throw new GemReadmeMcpError('Gem name cannot be empty', 'INVALID_GEM_NAME');
  }

  if (trimmed.length > 100) {
    throw new GemReadmeMcpError('Gem name cannot exceed 100 characters', 'INVALID_GEM_NAME');
  }

  // Ruby gem name validation rules
  // Must contain only letters, numbers, hyphens, underscores, and periods
  // Cannot start with a hyphen or period
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-_.]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(trimmed)) {
    throw new GemReadmeMcpError(
      'Gem name must start and end with alphanumeric characters and can contain hyphens, underscores, and periods',
      'INVALID_GEM_NAME'
    );
  }

  // Check for invalid sequences
  if (trimmed.includes('..') || trimmed.includes('--') || trimmed.includes('__')) {
    throw new GemReadmeMcpError('Gem name contains invalid character sequences', 'INVALID_GEM_NAME');
  }

  // Reserved names
  const reservedNames = ['gem', 'ruby', 'rubygems'];
  if (reservedNames.includes(trimmed.toLowerCase())) {
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

  // Validate semantic version (Ruby gems follow semantic versioning)
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.?((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  const preReleaseRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.?(alpha|beta|rc|pre)\.?(0|[1-9]\d*)?)$/;
  
  if (!semverRegex.test(trimmed) && !preReleaseRegex.test(trimmed)) {
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

  if (trimmed.length > 250) {
    throw new GemReadmeMcpError('Search query cannot exceed 250 characters', 'INVALID_SEARCH_QUERY');
  }
}

export function validateLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new GemReadmeMcpError('Limit must be an integer between 1 and 100', 'INVALID_LIMIT');
  }
}

export function validateScore(score: number, name: string): void {
  if (typeof score !== 'number' || score < 0 || score > 1) {
    throw new GemReadmeMcpError(`${name} must be a number between 0 and 1`, 'INVALID_SCORE');
  }
}