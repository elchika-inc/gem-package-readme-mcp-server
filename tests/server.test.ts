import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Server Configuration', () => {
  let serverModule: any;

  beforeEach(async () => {
    // サーバーモジュールを動的にインポート
    serverModule = await import('../src/server.js');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本モジュール読み込み', () => {
    it('サーバーモジュールが正しくエクスポートされている', () => {
      expect(serverModule).toBeDefined();
      expect(typeof serverModule.default).toBe('function');
    });

    it('サーバークラスを初期化できる', () => {
      const Server = serverModule.default;
      expect(() => new Server()).not.toThrow();
    });
  });

  describe('依存関係の確認', () => {
    it('必要なツール実装が読み込める', async () => {
      // ツール実装の読み込みを確認
      const { getPackageReadme } = await import('../src/tools/get-package-readme.js');
      const { getPackageInfo } = await import('../src/tools/get-package-info.js');
      const { searchPackages } = await import('../src/tools/search-packages.js');
      
      expect(typeof getPackageReadme).toBe('function');
      expect(typeof getPackageInfo).toBe('function');
      expect(typeof searchPackages).toBe('function');
    });

    it('バリデータが読み込める', async () => {
      const validators = await import('../src/utils/validators.js');
      expect(typeof validators.validateGemName).toBe('function');
    });

    it('ログユーティリティが読み込める', async () => {
      const { logger } = await import('../src/utils/logger.js');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });
  });
});