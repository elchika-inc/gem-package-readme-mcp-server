import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryCache, createCacheKey } from '../../src/services/cache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    vi.clearAllMocks();
    cache = new MemoryCache();
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('基本的なキャッシュ操作', () => {
    it('値を設定して取得できる', () => {
      const key = 'test-key';
      const value = { test: 'data' };

      cache.set(key, value);
      const result = cache.get(key);

      expect(result).toEqual(value);
    });

    it('存在しないキーはnullを返す', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('値を削除できる', () => {
      const key = 'test-key';
      cache.set(key, 'test-value');
      
      const deleted = cache.delete(key);
      expect(deleted).toBe(true);
      expect(cache.get(key)).toBeNull();
    });

    it('存在しないキーの削除はfalseを返す', () => {
      const deleted = cache.delete('non-existent-key');
      expect(deleted).toBe(false);
    });

    it('キャッシュをクリアできる', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.size()).toBe(0);
    });

    it('キーの存在確認ができる', () => {
      const key = 'test-key';
      
      expect(cache.has(key)).toBe(false);
      
      cache.set(key, 'test-value');
      expect(cache.has(key)).toBe(true);
    });

    it('キャッシュサイズを取得できる', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('TTL（Time To Live）機能', () => {
    it('TTL期限切れの値はnullを返す', async () => {
      const shortTtl = 50; // 50ms
      cache.set('key', 'value', shortTtl);
      
      // 即座に取得できる
      expect(cache.get('key')).toBe('value');
      
      // TTL期限を待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 期限切れでnullが返される
      expect(cache.get('key')).toBeNull();
    });

    it('TTL期限切れのキーは存在しないと判定される', async () => {
      const shortTtl = 50;
      cache.set('key', 'value', shortTtl);
      
      expect(cache.has('key')).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.has('key')).toBe(false);
    });

    it('カスタムTTLが適用される', () => {
      const customTtl = 5000;
      cache.set('key', 'value', customTtl);
      
      // プライベートメソッドにアクセスするため、any型にキャスト
      const cacheMap = (cache as any).cache;
      const entry = cacheMap.get('key');
      
      expect(entry.ttl).toBe(customTtl);
    });

    it('デフォルトTTLが適用される', () => {
      cache.set('key', 'value');
      
      const cacheMap = (cache as any).cache;
      const entry = cacheMap.get('key');
      
      // デフォルトTTLは1時間（3600000ms）
      expect(entry.ttl).toBe(60 * 60 * 1000);
    });
  });

  describe('LRU（Least Recently Used）機能', () => {
    it('アクセス時にタイムスタンプが更新される', async () => {
      cache.set('key', 'value');
      
      const cacheMap = (cache as any).cache;
      const initialTimestamp = cacheMap.get('key').timestamp;
      
      // 少し待ってからアクセス
      await new Promise(resolve => setTimeout(resolve, 10));
      cache.get('key');
      
      const updatedTimestamp = cacheMap.get('key').timestamp;
      expect(updatedTimestamp).toBeGreaterThan(initialTimestamp);
    });

    it('最大サイズ制限によるLRU削除のシミュレーション', () => {
      // 小さな最大サイズでキャッシュを作成
      const smallCache = new MemoryCache({ maxSize: 100 });
      
      try {
        // 大きなデータを複数設定
        const largeData = 'x'.repeat(50);
        smallCache.set('key1', largeData);
        smallCache.set('key2', largeData);
        smallCache.set('key3', largeData); // これによりLRU削除が発生する可能性
        
        // 少なくとも一つのキーは設定されている
        expect(smallCache.size()).toBeGreaterThan(0);
      } finally {
        smallCache.destroy();
      }
    });
  });

  describe('統計情報', () => {
    it('統計情報を取得できる', () => {
      cache.set('key1', 'value1');
      cache.set('key2', { complex: 'object', with: ['array'] });
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.hitRate).toBe(0); // TODO実装
    });

    it('空のキャッシュの統計情報', () => {
      const stats = cache.getStats();
      
      expect(stats.size).toBe(0);
      expect(stats.memoryUsage).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('クリーンアップ機能', () => {
    it('期限切れエントリがクリーンアップで削除される', async () => {
      const shortTtl = 50;
      cache.set('key1', 'value1', shortTtl);
      cache.set('key2', 'value2'); // 長いTTL
      
      expect(cache.size()).toBe(2);
      
      // TTLを待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 手動でクリーンアップを実行
      (cache as any).cleanup();
      
      expect(cache.size()).toBe(1);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('デストラクタ', () => {
    it('destroyでクリーンアップタイマーがクリアされる', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      cache.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(cache.size()).toBe(0);
      
      clearIntervalSpy.mockRestore();
    });
  });

  describe('カスタムオプション', () => {
    it('カスタムTTLでキャッシュを作成できる', () => {
      const customTtl = 30000;
      const customCache = new MemoryCache({ ttl: customTtl });
      
      try {
        customCache.set('key', 'value');
        
        const cacheMap = (customCache as any).cache;
        const entry = cacheMap.get('key');
        
        expect(entry.ttl).toBe(customTtl);
      } finally {
        customCache.destroy();
      }
    });

    it('カスタム最大サイズでキャッシュを作成できる', () => {
      const customMaxSize = 50000;
      const customCache = new MemoryCache({ maxSize: customMaxSize });
      
      try {
        const maxSize = (customCache as any).maxSize;
        expect(maxSize).toBe(customMaxSize);
      } finally {
        customCache.destroy();
      }
    });
  });
});

describe('createCacheKey', () => {
  it('gem情報のキーを作成できる', () => {
    const key = createCacheKey.gemInfo('rails', '7.0.0');
    expect(key).toBe('gem_info:rails:7.0.0');
  });

  it('gem READMEのキーを作成できる', () => {
    const key = createCacheKey.gemReadme('rails', '7.0.0');
    expect(key).toBe('gem_readme:rails:7.0.0');
  });

  it('検索結果のキーを作成できる', () => {
    const key = createCacheKey.searchResults('test query', 20);
    expect(key).toMatch(/^search:.*:20$/);
  });

  it('検索結果のキーをpopularityパラメータ付きで作成できる', () => {
    const key = createCacheKey.searchResults('test query', 20, 0.8);
    expect(key).toMatch(/^search:.*:20:p:0\.8$/);
  });

  it('検索結果のキーをqualityパラメータ付きで作成できる', () => {
    const key = createCacheKey.searchResults('test query', 20, undefined, 0.9);
    expect(key).toMatch(/^search:.*:20:q:0\.9$/);
  });

  it('検索結果のキーを全パラメータ付きで作成できる', () => {
    const key = createCacheKey.searchResults('test query', 20, 0.8, 0.9);
    expect(key).toMatch(/^search:.*:20:p:0\.8:q:0\.9$/);
  });

  it('gemバージョンのキーを作成できる', () => {
    const key = createCacheKey.gemVersions('rails');
    expect(key).toBe('gem_versions:rails');
  });

  it('クエリが適切にbase64エンコードされる', () => {
    const query = 'test query with spaces';
    const key = createCacheKey.searchResults(query, 10);
    
    // base64エンコードされた文字列が含まれている
    expect(key).toContain(Buffer.from(query).toString('base64'));
  });
});