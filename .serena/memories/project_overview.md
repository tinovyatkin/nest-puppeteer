# nest-puppeteer Project Overview

## Purpose

NestJS module that provides dependency injection for Puppeteer (headless Chrome). It follows NestJS patterns for dynamic modules with sync/async
configuration.

## Tech Stack

- **Runtime**: Node.js >= 20
- **Language**: TypeScript (ESM)
- **Framework**: NestJS (>= 10)
- **Browser Automation**: Puppeteer (>= 22)
- **Build**: tsup (dual ESM/CJS output)
- **Type Check**: @typescript/native-preview (tsgo)
- **Linting**: oxlint
- **Formatting**: oxfmt
- **Testing**: Jest 30 with ts-jest

## Architecture

The module follows NestJS dynamic module patterns with a core/wrapper structure:

- **PuppeteerModule** (`src/puppeteer.module.ts`): Public API with `forRoot()`, `forRootAsync()`, `forFeature()`
- **PuppeteerCoreModule** (`src/puppeteer-core.module.ts`): Internal global module managing Browser lifecycle

### Provider Hierarchy

Each Puppeteer instance creates three injectable providers:

1. **Browser** - Main Puppeteer browser instance
2. **BrowserContext** - Separate context from the browser
3. **Page** - Page created from the context

### Decorators

- `@InjectBrowser(instanceName?)` - Inject the Browser
- `@InjectContext(instanceName?)` - Inject the BrowserContext
- `@InjectPage(instanceName?)` - Inject a Page

## Key Files

- `src/interfaces/puppeteer-options.interface.ts` - Module options interfaces
- `src/puppeteer.constants.ts` - Default Chrome launch options
- `src/puppeteer.util.ts` - Token generation utilities
- `src/puppeteer.decorators.ts` - Injection decorators
