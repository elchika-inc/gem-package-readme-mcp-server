import { describe, it, expect } from 'vitest';
import {
  validateGemName,
  validateSearchQuery,
  validateLimit,
  validateScore,
} from '../../src/utils/validators.js';

describe('validators', () => {
  describe('validateGemName', () => {
    it('should accept valid gem names', () => {
      expect(() => validateGemName('rails')).not.toThrow();
      expect(() => validateGemName('activerecord')).not.toThrow();
      expect(() => validateGemName('rspec-core')).not.toThrow();
      expect(() => validateGemName('my_gem')).not.toThrow();
      expect(() => validateGemName('gem123')).not.toThrow();
    });

    it('should reject invalid gem names', () => {
      expect(() => validateGemName('')).toThrow('Gem name is required and must be a string');
      expect(() => validateGemName('   ')).toThrow('Gem name cannot be empty');
      expect(() => validateGemName('gem with spaces')).toThrow('Gem name must start and end with alphanumeric characters');
      expect(() => validateGemName('-invalidgem')).toThrow('Gem name must start and end with alphanumeric characters');
    });

    it('should reject gem names with invalid character sequences', () => {
      expect(() => validateGemName('gem..name')).toThrow('Gem name contains invalid character sequences');
      expect(() => validateGemName('gem--name')).toThrow('Gem name contains invalid character sequences');
      expect(() => validateGemName('gem__name')).toThrow('Gem name contains invalid character sequences');
    });

    it('should handle non-string inputs', () => {
      expect(() => validateGemName(null as any)).toThrow('Gem name is required and must be a string');
      expect(() => validateGemName(123 as any)).toThrow('Gem name is required and must be a string');
      expect(() => validateGemName(undefined as any)).toThrow('Gem name is required and must be a string');
    });
  });

  describe('validateSearchQuery', () => {
    it('should accept valid search queries', () => {
      expect(() => validateSearchQuery('rails')).not.toThrow();
      expect(() => validateSearchQuery('web framework')).not.toThrow();
      expect(() => validateSearchQuery('a')).not.toThrow();
    });

    it('should reject invalid search queries', () => {
      expect(() => validateSearchQuery('')).toThrow('Search query is required and must be a string');
      expect(() => validateSearchQuery('   ')).toThrow('Search query cannot be empty');
    });

    it('should handle non-string inputs', () => {
      expect(() => validateSearchQuery(null as any)).toThrow('Search query is required and must be a string');
      expect(() => validateSearchQuery(123 as any)).toThrow('Search query is required and must be a string');
    });
  });

  describe('validateLimit', () => {
    it('should accept valid limit values', () => {
      expect(() => validateLimit(1)).not.toThrow();
      expect(() => validateLimit(20)).not.toThrow();
      expect(() => validateLimit(100)).not.toThrow();
    });

    it('should reject invalid limit values', () => {
      expect(() => validateLimit(0)).toThrow('Limit must be an integer between 1 and 100');
      expect(() => validateLimit(101)).toThrow('Limit must be an integer between 1 and 100');
      expect(() => validateLimit(-1)).toThrow('Limit must be an integer between 1 and 100');
      expect(() => validateLimit('20' as any)).toThrow('Limit must be an integer between 1 and 100');
      expect(() => validateLimit(1.5)).toThrow('Limit must be an integer between 1 and 100');
    });
  });

  describe('validateScore', () => {
    it('should accept valid score values', () => {
      expect(() => validateScore(0, 'quality')).not.toThrow();
      expect(() => validateScore(0.5, 'popularity')).not.toThrow();
      expect(() => validateScore(1, 'quality')).not.toThrow();
    });

    it('should reject invalid score values', () => {
      expect(() => validateScore(-0.1, 'quality')).toThrow('quality must be a number between 0 and 1');
      expect(() => validateScore(1.1, 'popularity')).toThrow('popularity must be a number between 0 and 1');
      expect(() => validateScore('0.5' as any, 'quality')).toThrow('quality must be a number between 0 and 1');
    });
  });
});