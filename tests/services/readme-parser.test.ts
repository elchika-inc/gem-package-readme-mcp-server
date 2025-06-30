import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReadmeParser } from '../../src/services/readme-parser.js';
import type { UsageExample } from '../../src/types/index.js';

describe('ReadmeParser', () => {
  let parser: ReadmeParser;

  beforeEach(() => {
    parser = new ReadmeParser();
  });

  describe('parseUsageExamples', () => {
    it('includeExamplesがfalseの場合は空配列を返す', () => {
      const readme = '# Usage\n```ruby\nputs "hello"\n```';
      const result = parser.parseUsageExamples(readme, false);
      expect(result).toEqual([]);
    });

    it('空のコンテンツの場合は空配列を返す', () => {
      const result = parser.parseUsageExamples('', true);
      expect(result).toEqual([]);
    });

    it('基本的なUsageセクションからコードブロックを抽出できる', () => {
      const readme = `
# My Gem

Some description here.

## Usage

Here's how to use it:

\`\`\`ruby
require 'my_gem'
MyGem.new.hello
\`\`\`

## Other Section

Not related to usage.
      `.trim();

      const result = parser.parseUsageExamples(readme, true);
      
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("require 'my_gem'\nMyGem.new.hello");
      expect(result[0].language).toBe('ruby');
      expect(result[0].title).toBe('Basic Usage');
    });

    it('複数のUsageセクションから例を抽出できる', () => {
      const readme = `
# Installation

\`\`\`bash
gem install my_gem
\`\`\`

## Usage

\`\`\`ruby
MyGem.hello
\`\`\`

### Examples

\`\`\`ruby
MyGem.new("world").greet
\`\`\`
      `.trim();

      const result = parser.parseUsageExamples(readme, true);
      
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Installation');
      expect(result[1].title).toBe('Ruby Example');
      expect(result[2].title).toBe('Ruby Example');
    });

    it('異なる言語のコードブロックを正しく処理する', () => {
      const readme = `
## Usage

Shell command:
\`\`\`bash
gem install my_gem
\`\`\`

Ruby code:
\`\`\`ruby
require 'my_gem'
\`\`\`

YAML config:
\`\`\`yaml
gem:
  name: my_gem
\`\`\`
      `.trim();

      const result = parser.parseUsageExamples(readme, true);
      
      expect(result).toHaveLength(3);
      expect(result[0].language).toBe('bash');
      expect(result[1].language).toBe('ruby');
      expect(result[2].language).toBe('yaml');
    });

    it('空のコードブロックをスキップする', () => {
      const readme = `
## Usage

\`\`\`ruby

\`\`\`

\`\`\`ruby
puts "hello"
\`\`\`
      `.trim();

      const result = parser.parseUsageExamples(readme, true);
      
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('puts "hello"');
    });

    it('重複したコード例を除去する', () => {
      const readme = `
## Usage

\`\`\`ruby
puts "hello"
\`\`\`

## Examples

\`\`\`ruby
puts "hello"
\`\`\`
      `.trim();

      const result = parser.parseUsageExamples(readme, true);
      
      expect(result).toHaveLength(1);
    });

    it('10個以上の例は制限される', () => {
      let readme = '## Usage\n';
      for (let i = 0; i < 15; i++) {
        readme += `\`\`\`ruby\nputs "${i}"\n\`\`\`\n`;
      }

      const result = parser.parseUsageExamples(readme, true);
      
      expect(result).toHaveLength(10);
    });

    it('例の説明を抽出できる', () => {
      const readme = `
## Usage

This is a basic example of how to use the gem.

\`\`\`ruby
MyGem.hello
\`\`\`
      `.trim();

      const result = parser.parseUsageExamples(readme, true);
      
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('This is a basic example of how to use the gem.');
    });
  });

  describe('generateExampleTitle', () => {
    const testCases = [
      // Shell/Bash examples
      { code: 'gem install my_gem', language: 'bash', expected: 'Installation' },
      { code: 'bundle add my_gem', language: 'shell', expected: 'Installation' },
      { code: 'bundle exec rake', language: 'sh', expected: 'Bundle Usage' },
      { code: 'ls -la', language: 'bash', expected: 'Command Line Usage' },
      
      // Ruby examples
      { code: "require 'my_gem'", language: 'ruby', expected: 'Basic Usage' },
      { code: "require_relative 'lib'", language: 'rb', expected: 'Basic Usage' },
      { code: 'class MyClass\nend', language: 'ruby', expected: 'Class/Module Definition' },
      { code: 'module MyModule\nend', language: 'ruby', expected: 'Class/Module Definition' },
      { code: 'def hello\nend', language: 'ruby', expected: 'Method Example' },
      { code: 'puts "hello"', language: 'ruby', expected: 'Ruby Example' },
      
      // Other languages
      { code: 'gem: my_gem', language: 'yaml', expected: 'Configuration' },
      { code: 'rails: version', language: 'yml', expected: 'Configuration' },
      { code: 'config: value', language: 'yaml', expected: 'YAML Configuration' },
      { code: '{}', language: 'json', expected: 'JSON Configuration' },
      { code: '<%= value %>', language: 'erb', expected: 'Template Example' },
      { code: '<div></div>', language: 'html', expected: 'Template Example' },
      { code: 'source "Gemfile"', language: 'gemfile', expected: 'Gemfile Configuration' },
      { code: 'puts "test"', language: 'unknown', expected: 'Code Example' },
    ];

    testCases.forEach(({ code, language, expected }) => {
      it(`${language}言語で"${code}"のタイトルを"${expected}"として生成する`, () => {
        const result = (parser as any).generateExampleTitle(code, language);
        expect(result).toBe(expected);
      });
    });
  });

  describe('cleanMarkdown', () => {
    it('バッジを除去し、有意なalt textは保持する', () => {
      const markdown = '![Build Status](https://travis-ci.org/user/repo.svg) ![Coverage](https://img.shields.io/badge/coverage-90%25-green)';
      const result = parser.cleanMarkdown(markdown);
      expect(result).toBe('Build Status Coverage');
    });

    it('短いalt textのバッジは完全に除去する', () => {
      const markdown = '![CI](https://example.com/badge.svg)';
      const result = parser.cleanMarkdown(markdown);
      expect(result).toBe('');
    });

    it('相対リンクをテキストのみに変換する', () => {
      const markdown = 'See [documentation](./docs/README.md) for more info.';
      const result = parser.cleanMarkdown(markdown);
      expect(result).toBe('See documentation for more info.');
    });

    it('絶対リンクは保持する', () => {
      const markdown = 'See [documentation](https://example.com/docs) for more info.';
      const result = parser.cleanMarkdown(markdown);
      expect(result).toBe('See [documentation](https://example.com/docs) for more info.');
    });

    it('過度な改行を正規化する', () => {
      const markdown = 'Line 1\n\n\n\n\nLine 2';
      const result = parser.cleanMarkdown(markdown);
      expect(result).toBe('Line 1\n\nLine 2');
    });

    it('先頭と末尾の空白を除去する', () => {
      const markdown = '\n\n  Content here  \n\n';
      const result = parser.cleanMarkdown(markdown);
      expect(result).toBe('Content here');
    });

    it('エラーが発生した場合は元のコンテンツを返す', () => {
      const original = 'Original content';
      
      // cleanMarkdownが内部でエラーを発生させるようにモック
      const brokenRegex = () => { throw new Error('Regex error'); };
      const originalReplace = String.prototype.replace;
      String.prototype.replace = brokenRegex as any;
      
      try {
        const result = parser.cleanMarkdown(original);
        expect(result).toBe(original);
      } finally {
        String.prototype.replace = originalReplace;
      }
    });
  });

  describe('extractDescription', () => {
    it('最初の実質的な段落を説明として抽出する', () => {
      const content = `
# My Gem

![Badge](badge.svg)

This is a Ruby gem that provides awesome functionality for developers.

## Installation

More content here.
      `.trim();

      const result = parser.extractDescription(content);
      expect(result).toBe('This is a Ruby gem that provides awesome functionality for developers.');
    });

    it('短すぎる行はスキップする', () => {
      const content = `
# Title

Short.

This is a longer description that should be used instead.
      `.trim();

      const result = parser.extractDescription(content);
      expect(result).toBe('This is a longer description that should be used instead.');
    });

    it('バッジや画像をスキップする', () => {
      const content = `
# Title

![Badge](badge.svg)
[![CI](ci.svg)](link)

This is the actual description after the badges.
      `.trim();

      const result = parser.extractDescription(content);
      expect(result).toBe('This is the actual description after the badges.');
    });

    it('複数行の説明を結合する（300文字制限内）', () => {
      const content = `
# Title

This is the first line of description.
This is the second line that should be combined.
      `.trim();

      const result = parser.extractDescription(content);
      expect(result).toBe('This is the first line of description. This is the second line that should be combined.');
    });

    it('300文字を超える場合は結合を停止する', () => {
      const longLine = 'x'.repeat(280);
      const content = `
# Title

${longLine}
This line should not be included due to length limit.
      `.trim();

      const result = parser.extractDescription(content);
      expect(result).toBe(longLine);
    });

    it('説明が見つからない場合はデフォルトメッセージを返す', () => {
      const content = `
# Title

![Badge](badge.svg)
## Section
      `.trim();

      const result = parser.extractDescription(content);
      expect(result).toBe('No description available');
    });

    it('エラーが発生した場合はデフォルトメッセージを返す', () => {
      // 意図的にエラーを発生させる
      const brokenSplit = () => { throw new Error('Split error'); };
      const originalSplit = String.prototype.split;
      String.prototype.split = brokenSplit as any;
      
      try {
        const result = parser.extractDescription('content');
        expect(result).toBe('No description available');
      } finally {
        String.prototype.split = originalSplit;
      }
    });
  });

  describe('normalizeLanguage', () => {
    const testCases = [
      { input: 'rb', expected: 'ruby' },
      { input: 'RB', expected: 'ruby' },
      { input: 'sh', expected: 'bash' },
      { input: 'shell', expected: 'bash' },
      { input: 'yml', expected: 'yaml' },
      { input: 'md', expected: 'markdown' },
      { input: 'gemfile', expected: 'ruby' },
      { input: 'rakefile', expected: 'ruby' },
      { input: 'javascript', expected: 'javascript' }, // No mapping
      { input: 'PYTHON', expected: 'python' }, // Lowercase
    ];

    testCases.forEach(({ input, expected }) => {
      it(`"${input}"を"${expected}"に正規化する`, () => {
        const result = (parser as any).normalizeLanguage(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('looksLikeCode', () => {
    const codeExamples = [
      '{ "key": "value" }',
      'function() { return true; }',
      'class MyClass',
      'def method_name',
      'require "gem"',
      '$ command',
      '# This is a comment',
      '// Another comment',
      'gem "rails", "~> 7.0"',
    ];

    const textExamples = [
      'This is a normal sentence.',
      'Here we describe how to use the gem.',
      'Installation instructions are below.',
    ];

    codeExamples.forEach(example => {
      it(`"${example}"をコードとして識別する`, () => {
        const result = (parser as any).looksLikeCode(example);
        expect(result).toBe(true);
      });
    });

    textExamples.forEach(example => {
      it(`"${example}"をテキストとして識別する`, () => {
        const result = (parser as any).looksLikeCode(example);
        expect(result).toBe(false);
      });
    });
  });

  describe('deduplicateExamples', () => {
    it('重複するコード例を除去する', () => {
      const examples: UsageExample[] = [
        { title: 'Example 1', code: 'puts "hello"', language: 'ruby' },
        { title: 'Example 2', code: 'puts  "hello"  ', language: 'ruby' }, // 空白が異なる
        { title: 'Example 3', code: 'puts "world"', language: 'ruby' },
      ];

      const result = (parser as any).deduplicateExamples(examples);
      
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('puts "hello"');
      expect(result[1].code).toBe('puts "world"');
    });

    it('空白の正規化が適切に動作する', () => {
      const examples: UsageExample[] = [
        { title: 'Example 1', code: 'puts\n"hello"\n', language: 'ruby' },
        { title: 'Example 2', code: 'puts "hello"', language: 'ruby' },
      ];

      const result = (parser as any).deduplicateExamples(examples);
      
      expect(result).toHaveLength(1);
    });
  });

  describe('エラーハンドリング', () => {
    it('parseUsageExamplesでエラーが発生した場合は空配列を返す', () => {
      // 意図的にエラーを発生させる
      const mockExtractUsageSections = vi.spyOn(parser as any, 'extractUsageSections')
        .mockImplementation(() => {
          throw new Error('Test error');
        });

      const result = parser.parseUsageExamples('content', true);
      
      expect(result).toEqual([]);
      mockExtractUsageSections.mockRestore();
    });

    it('extractUsageSectionsの複雑な処理が適切に動作する', () => {
      const readme = `
# Main Title

Some intro text.

## Usage

Basic usage example:

\`\`\`ruby
MyGem.hello
\`\`\`

### Advanced Usage

More complex example:

\`\`\`ruby
MyGem.new(options).advanced_method
\`\`\`

## Other Section

This should not be included.

\`\`\`ruby
# This code should not be extracted
\`\`\`
      `.trim();

      const sections = (parser as any).extractUsageSections(readme);
      
      expect(sections).toHaveLength(1);
      expect(sections[0]).toContain('Basic usage example');
      expect(sections[0]).toContain('MyGem.hello');
      expect(sections[0]).toContain('Advanced Usage');
      expect(sections[0]).toContain('MyGem.new(options)');
      expect(sections[0]).not.toContain('This should not be included');
    });
  });
});