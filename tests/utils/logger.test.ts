import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { LogLevel, logger } from '../../src/utils/logger.js';

describe('Logger', () => {
  let consoleErrorSpy: MockedFunction<typeof console.error>;
  let consoleWarnSpy: MockedFunction<typeof console.warn>;
  let consoleInfoSpy: MockedFunction<typeof console.info>;
  let consoleDebugSpy: MockedFunction<typeof console.debug>;

  beforeEach(() => {
    // consoleメソッドをスパイ
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LogLevel enum', () => {
    it('LogLevelの値が正しく定義されている', () => {
      expect(LogLevel.ERROR).toBe(0);
      expect(LogLevel.WARN).toBe(1);
      expect(LogLevel.INFO).toBe(2);
      expect(LogLevel.DEBUG).toBe(3);
    });
  });

  describe('グローバルloggerインスタンス', () => {
    it('グローバルloggerが定義されている', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('グローバルloggerでERRORログが出力される', () => {
      logger.error('test error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('グローバルloggerでWARNログが出力される', () => {
      logger.warn('test warn');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('グローバルloggerでINFOログが出力されない（WARNレベルのため）', () => {
      logger.info('test info');
      expect(consoleInfoSpy).toHaveBeenCalledTimes(0);
    });

    it('グローバルloggerでDEBUGログが出力されない（WARNレベルのため）', () => {
      logger.debug('test debug');
      expect(consoleDebugSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('データオブジェクト付きログ', () => {
    it('ERRORログでデータオブジェクトが出力される', () => {
      const data = { key: 'value', number: 42 };
      logger.error('error with data', data);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: error with data'),
        data
      );
    });

    it('WARNログでデータオブジェクトが出力される', () => {
      const data = { error: new Error('test error') };
      logger.warn('warn with data', data);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: warn with data'),
        data
      );
    });
  });

  describe('ログメッセージフォーマット', () => {
    it('タイムスタンプとレベルが含まれる', () => {
      logger.error('test message');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] ERROR: test message$/)
      );
    });

    it('データなしの場合は単一引数で呼ばれる', () => {
      logger.warn('simple message');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: simple message')
      );
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0]).toHaveLength(1);
    });
  });

  describe('エラーオブジェクトのログ', () => {
    it('Error オブジェクトをログ出力できる', () => {
      const error = new Error('Test error');
      logger.error('error occurred', error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: error occurred'),
        error
      );
    });

    it('複雑なオブジェクトをログ出力できる', () => {
      const data = { 
        nested: { value: 123 }, 
        array: [1, 2, 3],
        bool: true,
        str: 'string'
      };
      
      logger.error('complex object', data);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: complex object'),
        data
      );
    });
  });
});