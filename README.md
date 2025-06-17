# Ruby Gem Package README MCP Server

[![npm version](https://img.shields.io/npm/v/gem-package-readme-mcp-server)](https://www.npmjs.com/package/gem-package-readme-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/gem-package-readme-mcp-server)](https://www.npmjs.com/package/gem-package-readme-mcp-server)
[![GitHub stars](https://img.shields.io/github/stars/naoto24kawa/package-readme-mcp-servers)](https://github.com/naoto24kawa/package-readme-mcp-servers)
[![GitHub issues](https://img.shields.io/github/issues/naoto24kawa/package-readme-mcp-servers)](https://github.com/naoto24kawa/package-readme-mcp-servers/issues)
[![license](https://img.shields.io/npm/l/gem-package-readme-mcp-server)](https://github.com/naoto24kawa/package-readme-mcp-servers/blob/main/LICENSE)

An MCP (Model Context Protocol) server that provides tools for fetching Ruby gem README content, usage examples, and package information from RubyGems.org.

## Features

- **📖 Gem README Retrieval**: Fetch README content from GitHub repositories linked to gems
- **📊 Gem Information**: Get detailed gem metadata including dependencies, authors, and download statistics  
- **🔍 Gem Search**: Search the RubyGems registry with popularity filtering
- **⚡ Caching**: Intelligent caching system for improved performance
- **🛡️ Error Handling**: Robust error handling with retry mechanisms
- **📝 Usage Examples**: Automatic extraction of code examples from README files

## Installation

### From npm

```bash
npm install -g gem-package-readme-mcp-server
```

### From Source

```bash
git clone <repository-url>
cd gem-package-readme-mcp-server
npm install
npm run build
```

## Usage

### As MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "gem-package-readme": {
      "command": "gem-package-readme-mcp-server",
      "env": {
        "GITHUB_TOKEN": "your-github-token-here"
      }
    }
  }
}
```

### Environment Variables

- `GITHUB_TOKEN` (optional): GitHub personal access token for higher rate limits
- `LOG_LEVEL` (optional): Logging level (`ERROR`, `WARN`, `INFO`, `DEBUG`)
- `CACHE_TTL` (optional): Cache TTL in milliseconds (default: 3600000)

## Available Tools

### 1. get_package_readme

Fetches README content and usage examples for a Ruby gem.

**Parameters:**
- `package_name` (required): Name of the Ruby gem
- `version` (optional): Gem version (default: "latest")  
- `include_examples` (optional): Include usage examples (default: true)

**Example:**
```json
{
  "package_name": "rails",
  "version": "7.0.0",
  "include_examples": true
}
```

**Response:**
```json
{
  "package_name": "rails",
  "version": "7.0.0",
  "description": "Full-stack web application framework.",
  "readme_content": "# Ruby on Rails\n\n...",
  "usage_examples": [
    {
      "title": "Basic Usage",
      "code": "gem install rails",
      "language": "bash"
    }
  ],
  "installation": {
    "gem": "gem install rails",
    "bundler": "bundle add rails",
    "gemfile": "gem 'rails'"
  },
  "basic_info": {
    "name": "rails",
    "version": "7.0.0",
    "description": "Full-stack web application framework.",
    "platform": "ruby",
    "authors": ["David Heinemeier Hansson"],
    "licenses": ["MIT"]
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/rails/rails"
  }
}
```

### 2. get_package_info

Retrieves detailed information about a Ruby gem including dependencies.

**Parameters:**
- `package_name` (required): Name of the Ruby gem
- `include_dependencies` (optional): Include runtime dependencies (default: true)
- `include_dev_dependencies` (optional): Include development dependencies (default: false)

**Example:**
```json
{
  "package_name": "activerecord",
  "include_dependencies": true
}
```

**Response:**
```json
{
  "package_name": "activerecord",
  "latest_version": "7.0.4",
  "description": "Object-relational mapping in Ruby",
  "authors": ["David Heinemeier Hansson"],
  "licenses": ["MIT"],
  "platform": "ruby",
  "dependencies": [
    {
      "name": "activesupport",
      "requirements": "= 7.0.4"
    }
  ],
  "download_stats": {
    "total_downloads": 500000000,
    "version_downloads": 1000000
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/rails/rails"
  },
  "homepage": "https://rubyonrails.org",
  "documentation_uri": "https://api.rubyonrails.org",
  "source_code_uri": "https://github.com/rails/rails"
}
```

### 3. search_packages

Searches for Ruby gems in the RubyGems registry.

**Parameters:**
- `query` (required): Search query string
- `limit` (optional): Maximum results to return (default: 20, max: 100)
- `popularity` (optional): Minimum popularity score 0-1 based on downloads

**Example:**
```json
{
  "query": "web framework",
  "limit": 10,
  "popularity": 0.1
}
```

**Response:**
```json
{
  "query": "web framework",
  "total": 10,
  "packages": [
    {
      "name": "rails",
      "version": "7.0.4",
      "description": "Full-stack web application framework",
      "authors": "David Heinemeier Hansson",
      "licenses": ["MIT"],
      "downloads": 500000000,
      "version_downloads": 1000000,
      "project_uri": "https://rubygems.org/gems/rails",
      "homepage_uri": "https://rubyonrails.org",
      "source_code_uri": "https://github.com/rails/rails",
      "score": 0.95
    }
  ]
}
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Client    │───▶│gem-package-     │───▶│   RubyGems      │
│   (Claude etc)  │    │readme-mcp       │    │     API         │
└─────────────────┘    │     Server      │    └─────────────────┘
                       └─────────────────┘               │
                               │                         │
                               ▼                         │
                       ┌─────────────────┐               │
                       │   GitHub API    │◀──────────────┘
                       │   (README)      │
                       └─────────────────┘
```

The server integrates with:

- **RubyGems API**: Primary source for gem metadata and search
- **GitHub API**: Fallback for README content when gems link to GitHub repositories
- **Memory Cache**: Local caching for improved performance

## Development

### Setup

```bash
git clone <repository-url>
cd gem-package-readme-mcp-server
npm install
```

### Available Scripts

```bash
npm run dev          # Start in development mode
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
npm run typecheck    # Type checking
```

### Project Structure

```
src/
├── index.ts                 # Entry point
├── server.ts               # MCP server implementation
├── tools/                  # Tool implementations
│   ├── get-package-readme.ts
│   ├── get-package-info.ts
│   └── search-packages.ts
├── services/              # External service clients
│   ├── rubygems-api.ts    # RubyGems API client
│   ├── github-api.ts      # GitHub API client
│   ├── cache.ts           # Caching service
│   └── readme-parser.ts   # README parsing logic
├── utils/                 # Utility functions
│   ├── logger.ts          # Logging
│   ├── error-handler.ts   # Error handling
│   └── validators.ts      # Input validation
└── types/                 # TypeScript type definitions
    └── index.ts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Error Handling

The server implements comprehensive error handling for:

- **Gem Not Found**: Invalid or non-existent gem names
- **Version Not Found**: Requested version doesn't exist  
- **Network Errors**: API timeouts and connectivity issues
- **Rate Limiting**: Automatic retry with exponential backoff
- **Validation Errors**: Invalid input parameters

## Performance

- **Caching**: 1-hour TTL for gem info, 10-minute TTL for search results
- **Rate Limiting**: Respects RubyGems and GitHub API rate limits
- **Memory Management**: LRU cache with configurable size limits
- **Concurrent Requests**: Handles up to 50 simultaneous requests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [RubyGems.org](https://rubygems.org/) for providing the gem registry API
- [GitHub API](https://docs.github.com/en/rest) for README content access
- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification