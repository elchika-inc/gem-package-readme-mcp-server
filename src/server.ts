import { BasePackageServer, ToolDefinition } from '@elchika-inc/package-readme-shared';
import { getPackageReadme } from './tools/get-package-readme.js';
import { getPackageInfo } from './tools/get-package-info.js';
import { searchPackages } from './tools/search-packages.js';
import {
  GetPackageReadmeParams,
  GetPackageInfoParams,
  SearchPackagesParams,
} from './types/index.js';
import { 
  validateGetPackageReadmeParams, 
  validateGetPackageInfoParams, 
  validateSearchPackagesParams 
} from './utils/validators.js';
import { logger } from './utils/logger.js';

const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  get_readme_from_gem: {
    name: 'get_readme_from_gem',
    description: 'Get Ruby gem README and usage examples from RubyGems registry',
    inputSchema: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'The name of the Ruby gem',
        },
        version: {
          type: 'string',
          description: 'The version of the gem (default: "latest")',
          default: 'latest',
        },
        include_examples: {
          type: 'boolean',
          description: 'Whether to include usage examples (default: true)',
          default: true,
        }
      },
      required: ['package_name'],
    }
  },
  get_package_info_from_gem: {
    name: 'get_package_info_from_gem',
    description: 'Get Ruby gem basic information and dependencies from RubyGems registry',
    inputSchema: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'The name of the Ruby gem',
        },
        include_dependencies: {
          type: 'boolean',
          description: 'Whether to include runtime dependencies (default: true)',
          default: true,
        },
        include_dev_dependencies: {
          type: 'boolean',
          description: 'Whether to include development dependencies (default: false)',
          default: false,
        }
      },
      required: ['package_name'],
    }
  },
  search_packages_from_gem: {
    name: 'search_packages_from_gem',
    description: 'Search for Ruby gems in RubyGems registry',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)',
          default: 20,
          minimum: 1,
          maximum: 100,
        },
        quality: {
          type: 'number',
          description: 'Minimum quality score (0-1)',
          minimum: 0,
          maximum: 1,
        },
        popularity: {
          type: 'number',
          description: 'Minimum popularity score based on downloads (0-1)',
          minimum: 0,
          maximum: 1,
        }
      },
      required: ['query'],
    }
  },
} as const;

export class GemReadmeMcpServer extends BasePackageServer {
  constructor() {
    super({
      name: 'gem-package-readme-mcp',
      version: '1.0.0',
    });
  }

  protected getToolDefinitions(): Record<string, ToolDefinition> {
    return TOOL_DEFINITIONS;
  }

  protected async handleToolCall(name: string, args: unknown): Promise<unknown> {
    logger.debug(`Handling tool call: ${name}`, { args });
    
    switch (name) {
      case 'get_readme_from_gem':
        return await getPackageReadme(validateGetPackageReadmeParams(args) as GetPackageReadmeParams);
      
      case 'get_package_info_from_gem':
        return await getPackageInfo(validateGetPackageInfoParams(args) as GetPackageInfoParams);
      
      case 'search_packages_from_gem':
        return await searchPackages(validateSearchPackagesParams(args) as SearchPackagesParams);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

}

export default GemReadmeMcpServer;