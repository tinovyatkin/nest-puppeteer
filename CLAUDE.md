# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nest-puppeteer is a NestJS module that provides dependency injection for Puppeteer (headless Chrome). It follows NestJS patterns for dynamic modules with sync/async configuration.

## Commands

```bash
npm install           # Install dependencies
npm run build         # Build with @typescript/native-preview (tsgo)
npm run lint          # Run oxlint on src/ and __tests__/
npm run lint:fix      # Run oxlint with auto-fix
npm run format        # Format code with oxfmt
npm run format:check  # Check code formatting
npm run typecheck     # Run TypeScript type checking
npm test              # Run e2e tests with Jest
```

Run a specific test file:
```bash
npm test -- --testPathPattern=app.test
```

## Architecture

The module follows NestJS dynamic module patterns with a core/wrapper structure:

- **PuppeteerModule** (`src/puppeteer.module.ts`): Public API exposing `forRoot()`, `forRootAsync()`, and `forFeature()` static methods
- **PuppeteerCoreModule** (`src/puppeteer-core.module.ts`): Internal global module that manages Browser lifecycle, creates providers for Browser/Context/Page, and handles cleanup on shutdown

### Provider Hierarchy

Each Puppeteer instance creates three injectable providers:
1. **Browser** - The main Puppeteer browser instance
2. **BrowserContext** - A separate context created from the browser
3. **Page** - A page created from the context

Providers are token-based using `{instanceName}Browser`, `{instanceName}Context`, `{instanceName}Page` format (see `puppeteer.util.ts`).

### Decorators

- `@InjectBrowser(instanceName?)` - Inject the Browser
- `@InjectContext(instanceName?)` - Inject the BrowserContext
- `@InjectPage(instanceName?)` - Inject a Page

### Configuration Options

Default Chrome launch options are defined in `puppeteer.constants.ts` with platform-specific handling (pipe mode disabled on Windows, --no-sandbox on Linux).

## Testing

Tests are e2e only, located in `__tests__/`. The test server in `__tests__/test-server/` provides a complete NestJS app that uses the module for integration testing.

## Tooling

- **Build**: Uses tsup for dual ESM/CJS output with TypeScript declarations
- **Type Check**: Uses `@typescript/native-preview` (tsgo) for fast type checking
- **Linting**: Uses oxlint (Oxc linter) for fast linting
- **Formatting**: Uses oxfmt (Oxc formatter) for code formatting
- **Testing**: Jest 30 with ts-jest for ESM support
