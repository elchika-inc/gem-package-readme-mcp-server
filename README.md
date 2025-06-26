# Gem Package README MCP Server

[![license](https://img.shields.io/npm/l/gem-package-readme-mcp-server)](https://github.com/elchika-inc/gem-package-readme-mcp-server/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/gem-package-readme-mcp-server)](https://www.npmjs.com/package/gem-package-readme-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/gem-package-readme-mcp-server)](https://www.npmjs.com/package/gem-package-readme-mcp-server)
[![GitHub stars](https://img.shields.io/github/stars/elchika-inc/gem-package-readme-mcp-server)](https://github.com/elchika-inc/gem-package-readme-mcp-server)

An MCP (Model Context Protocol) server that enables AI assistants to fetch comprehensive information about Ruby gems from RubyGems.org, including README content, gem metadata, and search functionality.

## Features

- **Package README Retrieval**: Fetch formatted README content with usage examples from Ruby gems hosted on RubyGems.org
- **Package Information**: Get comprehensive gem metadata including dependencies, versions, author information, and download statistics
- **Package Search**: Search RubyGems registry with filtering by popularity, category, and author
- **Smart Caching**: Intelligent caching system to optimize API usage and improve response times
- **GitHub Integration**: Seamless integration with GitHub API for enhanced README fetching from gem repositories
- **Error Handling**: Robust error handling with automatic retry logic and fallback strategies

## MCP Client Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "gem-package-readme": {
      "command": "npx",
      "args": ["gem-package-readme-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

> **Note**: The `GITHUB_TOKEN` is optional but recommended for higher API rate limits when fetching README content from GitHub.

## Available Tools

### get_package_readme

Retrieves comprehensive README content and usage examples for Ruby gems.

**Parameters:**
```json
{
  "package_name": "rails",
  "version": "latest",
  "include_examples": true
}
```

- `package_name` (string, required): Ruby gem name (e.g., "rails", "devise", "rspec")
- `version` (string, optional): Specific gem version or "latest" (default: "latest")
- `include_examples` (boolean, optional): Include usage examples and code snippets (default: true)

**Returns:** Formatted README content with installation instructions, usage examples, and API documentation.

### get_package_info

Fetches detailed gem metadata, dependencies, and author information from RubyGems.org.

**Parameters:**
```json
{
  "package_name": "activerecord",
  "include_dependencies": true,
  "include_dev_dependencies": false
}
```

- `package_name` (string, required): Ruby gem name
- `include_dependencies` (boolean, optional): Include runtime dependencies (default: true)
- `include_dev_dependencies` (boolean, optional): Include development dependencies (default: false)

**Returns:** Gem metadata including version info, author details, license, download stats, and dependency information.

### search_packages

Searches RubyGems registry for gems with filtering capabilities.

**Parameters:**
```json
{
  "query": "web framework",
  "limit": 20,
  "author": "dhh"
}
```

- `query` (string, required): Search terms (gem name, description, keywords)
- `limit` (number, optional): Maximum number of results to return (default: 20, max: 100)
- `author` (string, optional): Filter by gem author/maintainer

**Returns:** List of matching gems with names, descriptions, authors, and download statistics.

## Error Handling

The server handles common error scenarios gracefully:

- **Gem not found**: Returns clear error messages with similar gem suggestions
- **Rate limiting**: Implements automatic retry with exponential backoff
- **Network timeouts**: Configurable timeout with retry logic
- **Invalid gem names**: Validates gem name format and provides guidance
- **RubyGems API failures**: Fallback strategies when API is unavailable

## License

MIT