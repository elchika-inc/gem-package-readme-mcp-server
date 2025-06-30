import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 基本的な統合テストの設定
describe('ツール層統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本的なモジュール読み込み', () => {
    it('get-package-readmeツールが読み込める', async () => {
      const { getPackageReadme } = await import('../../src/tools/get-package-readme.js');
      expect(typeof getPackageReadme).toBe('function');
    });

    it('get-package-infoツールが読み込める', async () => {
      const { getPackageInfo } = await import('../../src/tools/get-package-info.js');
      expect(typeof getPackageInfo).toBe('function');
    });

    it('search-packagesツールが読み込める', async () => {
      const { searchPackages } = await import('../../src/tools/search-packages.js');
      expect(typeof searchPackages).toBe('function');
    });
  });

  describe('サービス依存関係の確認', () => {
    it('RubyGems APIサービスが読み込める', async () => {
      const { rubygemsApi } = await import('../../src/services/rubygems-api.js');
      expect(rubygemsApi).toBeDefined();
    });

    it('GitHub APIサービスが読み込める', async () => {
      const { githubApi } = await import('../../src/services/github-api.js');
      expect(githubApi).toBeDefined();
    });

    it('キャッシュサービスが読み込める', async () => {
      const { cache } = await import('../../src/services/cache.js');
      expect(cache).toBeDefined();
    });

    it('README パーサーサービスが読み込める', async () => {
      const { readmeParser } = await import('../../src/services/readme-parser.js');
      expect(readmeParser).toBeDefined();
    });
  });

  describe('バリデーションの統合', () => {
    it('バリデータ関数が読み込める', async () => {
      const validators = await import('../../src/utils/validators.js');
      expect(typeof validators.validateGemName).toBe('function');
      expect(typeof validators.validateVersion).toBe('function');
    });
  });

  describe('エラーハンドリングの統合', () => {
    it('エラーハンドラーが読み込める', async () => {
      const { withRetry } = await import('../../src/utils/error-handler.js');
      expect(typeof withRetry).toBe('function');
    });

    it('カスタムエラークラスが読み込める', async () => {
      const { 
        GemNotFoundError, 
        VersionNotFoundError, 
        RateLimitError, 
        NetworkError 
      } = await import('../../src/types/index.js');
      
      expect(GemNotFoundError).toBeDefined();
      expect(VersionNotFoundError).toBeDefined();
      expect(RateLimitError).toBeDefined();
      expect(NetworkError).toBeDefined();
    });
  });

  describe('型定義の整合性', () => {
    it('型定義が正しく読み込める', async () => {
      const types = await import('../../src/types/index.js');
      
      // 主要な型が定義されていることを確認
      expect(types).toBeDefined();
    });
  });

  describe('設定とユーティリティ', () => {
    it('ログユーティリティが読み込める', async () => {
      const { logger } = await import('../../src/utils/logger.js');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('定数設定が読み込める', async () => {
      const constants = await import('../../src/config/constants.js');
      expect(constants).toBeDefined();
    });
  });

  describe('パラメータ検証の統合', () => {
    it('無効なパラメータでエラーが発生する', async () => {
      const { getPackageReadme } = await import('../../src/tools/get-package-readme.js');
      
      // 空のパッケージ名でエラーが発生することを確認
      await expect(getPackageReadme({ package_name: '' }))
        .rejects.toThrow();
    });

    it('型が不正な場合にエラーが発生する', async () => {
      const { getPackageInfo } = await import('../../src/tools/get-package-info.js');
      
      // 不正な型のパラメータでエラーが発生することを確認
      await expect(getPackageInfo({ package_name: null as any }))
        .rejects.toThrow();
    });
  });

  describe('キャッシュキー生成の統合', () => {
    it('キャッシュキー生成関数が動作する', async () => {
      const { createCacheKey } = await import('../../src/services/cache.js');
      
      const gemInfoKey = createCacheKey.gemInfo('test-gem', '1.0.0');
      expect(gemInfoKey).toBe('gem_info:test-gem:1.0.0');
      
      const searchKey = createCacheKey.searchResults('query', 20);
      expect(searchKey).toContain('search:');
    });
  });

  describe('README解析パイプライン', () => {
    it('README解析パイプラインの各コンポーネントが利用可能', async () => {
      const { readmeParser } = await import('../../src/services/readme-parser.js');
      
      // README解析の基本メソッドが利用可能であることを確認
      expect(typeof readmeParser.parseUsageExamples).toBe('function');
      expect(typeof readmeParser.cleanMarkdown).toBe('function');
      expect(typeof readmeParser.extractDescription).toBe('function');
    });

    it('シンプルなREADME解析が動作する', async () => {
      const { readmeParser } = await import('../../src/services/readme-parser.js');
      
      const simpleMarkdown = '# Test\n\nThis is a test.';
      const description = readmeParser.extractDescription(simpleMarkdown);
      
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
    });
  });
});