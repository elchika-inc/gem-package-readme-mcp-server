import { logger } from '../utils/logger.js';
import { UsageExample } from '../types/index.js';

export class ReadmeParser {
  private static readonly USAGE_SECTION_PATTERNS = [
    /^#{1,6}\s*(usage|use|using|how to use|getting started|quick start|examples?|basic usage|installation)\s*$/gim,
    /^usage:?\s*$/gim,
    /^examples?:?\s*$/gim,
    /^installation:?\s*$/gim,
  ];

  private static readonly CODE_BLOCK_PATTERN = /```(\w+)?\n([\s\S]*?)```/g;

  parseUsageExamples(readmeContent: string, includeExamples: boolean = true): UsageExample[] {
    if (!includeExamples || !readmeContent) {
      return [];
    }

    try {
      const examples: UsageExample[] = [];
      const sections = this.extractUsageSections(readmeContent);

      for (const section of sections) {
        const sectionExamples = this.extractCodeBlocksFromSection(section);
        examples.push(...sectionExamples);
      }

      // Deduplicate examples based on code content
      const uniqueExamples = this.deduplicateExamples(examples);
      
      // Limit to reasonable number
      const limitedExamples = uniqueExamples.slice(0, 10);

      logger.debug(`Extracted ${limitedExamples.length} usage examples from README`);
      return limitedExamples;
    } catch (error) {
      logger.warn('Failed to parse usage examples from README', { error });
      return [];
    }
  }

  private extractUsageSections(content: string): string[] {
    const sections: string[] = [];
    const lines = content.split('\n');
    let currentSection: string[] = [];
    let inUsageSection = false;
    let sectionLevel = 0;

    for (const line of lines) {
      if (this.isHeaderLine(line)) {
        const result = this.processHeaderLine(
          line, 
          currentSection, 
          inUsageSection, 
          sectionLevel
        );
        
        sections.push(...result.completedSections);
        currentSection = result.newCurrentSection;
        inUsageSection = result.inUsageSection;
        sectionLevel = result.sectionLevel;
      } else if (inUsageSection) {
        currentSection.push(line);
      }
    }

    this.addFinalSection(currentSection, sections);
    return sections;
  }

  private isHeaderLine(line: string): boolean {
    return /^#{1,6}\s/.test(line);
  }

  private processHeaderLine(
    line: string,
    currentSection: string[],
    inUsageSection: boolean,
    sectionLevel: number
  ): {
    completedSections: string[];
    newCurrentSection: string[];
    inUsageSection: boolean;
    sectionLevel: number;
  } {
    const level = this.getHeaderLevel(line);
    const isUsageHeader = this.isUsageHeader(line);
    const completedSections: string[] = [];

    if (isUsageHeader) {
      if (currentSection.length > 0) {
        completedSections.push(currentSection.join('\n'));
      }
      return {
        completedSections,
        newCurrentSection: [line],
        inUsageSection: true,
        sectionLevel: level,
      };
    }

    if (inUsageSection && level <= sectionLevel) {
      if (currentSection.length > 0) {
        completedSections.push(currentSection.join('\n'));
      }
      return {
        completedSections,
        newCurrentSection: [],
        inUsageSection: false,
        sectionLevel,
      };
    }

    if (inUsageSection) {
      currentSection.push(line);
    }

    return {
      completedSections,
      newCurrentSection: currentSection,
      inUsageSection,
      sectionLevel,
    };
  }

  private getHeaderLevel(line: string): number {
    return (line.match(/^#+/) || [''])[0].length;
  }

  private addFinalSection(currentSection: string[], sections: string[]): void {
    if (currentSection.length > 0) {
      sections.push(currentSection.join('\n'));
    }
  }

  private isUsageHeader(line: string): boolean {
    return ReadmeParser.USAGE_SECTION_PATTERNS.some(pattern => {
      pattern.lastIndex = 0; // Reset regex state
      return pattern.test(line);
    });
  }

  private extractCodeBlocksFromSection(section: string): UsageExample[] {
    const examples: UsageExample[] = [];
    const codeBlockRegex = new RegExp(ReadmeParser.CODE_BLOCK_PATTERN.source, 'g');
    let match;

    while ((match = codeBlockRegex.exec(section)) !== null) {
      const [, language = 'text', code] = match;
      const cleanCode = code.trim();
      
      if (cleanCode.length === 0) {
        continue;
      }

      // Determine the type of example based on language and content
      const title = this.generateExampleTitle(cleanCode, language);
      const description = this.extractExampleDescription(section, match.index);

      examples.push({
        title,
        description: description || undefined,
        code: cleanCode,
        language: this.normalizeLanguage(language),
      });
    }

    return examples;
  }

  private generateExampleTitle(code: string, language: string): string {
    const firstLine = code.split('\n')[0].trim();
    
    const titleGenerators: Record<string, () => string> = {
      bash: () => this.generateShellTitle(firstLine),
      shell: () => this.generateShellTitle(firstLine),
      sh: () => this.generateShellTitle(firstLine),
      ruby: () => this.generateRubyTitle(firstLine, code),
      rb: () => this.generateRubyTitle(firstLine, code),
      gemfile: () => 'Gemfile Configuration',
      yaml: () => this.generateYamlTitle(code),
      yml: () => this.generateYamlTitle(code),
      json: () => 'JSON Configuration',
      erb: () => 'Template Example',
      html: () => 'Template Example',
    };

    const generator = titleGenerators[language];
    return generator ? generator() : 'Code Example';
  }

  private generateShellTitle(firstLine: string): string {
    if (firstLine.includes('gem install') || firstLine.includes('bundle add')) {
      return 'Installation';
    }
    if (firstLine.includes('bundle install') || firstLine.includes('bundle exec')) {
      return 'Bundle Usage';
    }
    return 'Command Line Usage';
  }

  private generateRubyTitle(firstLine: string, code: string): string {
    if (firstLine.includes('require ') || firstLine.includes('require_relative')) {
      return 'Basic Usage';
    }
    if (code.includes('class ') || code.includes('module ')) {
      return 'Class/Module Definition';
    }
    if (code.includes('def ')) {
      return 'Method Example';
    }
    return 'Ruby Example';
  }

  private generateYamlTitle(code: string): string {
    if (code.includes('gem:') || code.includes('rails:')) {
      return 'Configuration';
    }
    return 'YAML Configuration';
  }

  private extractExampleDescription(section: string, codeBlockIndex: number): string | undefined {
    // Look for text before the code block that might be a description
    const beforeCodeBlock = section.substring(0, codeBlockIndex);
    const lines = beforeCodeBlock.split('\n').reverse();
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith('#')) {
        continue;
      }
      
      // If it's a reasonable length and doesn't look like code, use it as description
      if (trimmed.length > 10 && trimmed.length < 200 && !this.looksLikeCode(trimmed)) {
        return trimmed.replace(/^[*-]\s*/, ''); // Remove bullet points
      }
      
      break; // Stop at first non-empty line
    }

    return undefined;
  }

  private looksLikeCode(text: string): boolean {
    // Simple heuristics to detect if text looks like code
    const codeIndicators = [
      /^\s*[{}[\]();,]/, // Starts with common code characters
      /[{}[\]();,]\s*$/, // Ends with common code characters
      /^\s*(class|def|module|require|include|extend|if|unless|case|when)\s+/, // Ruby keywords
      /^\s*\$/, // Shell prompt
      /^\s*#/, // Ruby comments
      /^\s*\/\//, // Other language comments
      /^\s*gem\s+['"]/, // Gemfile entries
    ];

    return codeIndicators.some(pattern => pattern.test(text));
  }

  private normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'rb': 'ruby',
      'sh': 'bash',
      'shell': 'bash',
      'yml': 'yaml',
      'md': 'markdown',
      'gemfile': 'ruby',
      'rakefile': 'ruby',
    };

    return languageMap[normalized] || normalized;
  }

  private deduplicateExamples(examples: UsageExample[]): UsageExample[] {
    const seen = new Set<string>();
    const unique: UsageExample[] = [];

    for (const example of examples) {
      // Create a hash of the code content (normalize whitespace)
      const codeHash = example.code.replace(/\s+/g, ' ').trim();
      
      if (!seen.has(codeHash)) {
        seen.add(codeHash);
        unique.push(example);
      }
    }

    return unique;
  }

  cleanMarkdown(content: string): string {
    try {
      // Remove or replace common markdown elements that don't translate well
      let cleaned = content;

      // Remove badges (but keep the alt text if meaningful)
      cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_match, altText) => {
        return altText && altText.length > 3 ? altText : '';
      });

      // Convert relative links to absolute GitHub links (if we can detect the repo)
      // This is a simplified version - in practice, you'd want to pass repository info
      cleaned = cleaned.replace(/\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g, '$1');

      // Clean up excessive whitespace
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
      cleaned = cleaned.trim();

      return cleaned;
    } catch (error) {
      logger.warn('Failed to clean markdown content', { error });
      return content;
    }
  }

  extractDescription(content: string): string {
    try {
      // Look for the first substantial paragraph after any title
      const lines = content.split('\n');
      let foundDescription = false;
      let description = '';

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and headers
        if (trimmed.length === 0 || trimmed.startsWith('#')) {
          if (foundDescription && description.length > 0) {
            break; // Stop at next section
          }
          continue;
        }

        // Skip badges and images
        if (trimmed.startsWith('![') || trimmed.startsWith('[![')) {
          continue;
        }

        // This looks like a description
        if (trimmed.length > 20) {
          if (!foundDescription) {
            description = trimmed;
            foundDescription = true;
          } else {
            // Add continuation if it's part of the same paragraph
            if (description.length + trimmed.length < 300) {
              description += ' ' + trimmed;
            } else {
              break;
            }
          }
        }
      }

      return description || 'No description available';
    } catch (error) {
      logger.warn('Failed to extract description from README', { error });
      return 'No description available';
    }
  }
}

export const readmeParser = new ReadmeParser();