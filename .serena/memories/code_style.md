# Code Style and Conventions

## General

- ESM modules (type: "module" in package.json)
- Use `.js` extension in imports (for ESM compatibility with TypeScript)
- No emojis unless explicitly requested

## TypeScript

- Strict TypeScript with type-only imports where appropriate
- Use `type` keyword for type-only imports: `import type { ... } from "..."`
- Prefer interfaces over type aliases for object shapes

## Formatting (oxfmt)

- Configuration in `oxfmtrc.json`
- Run `npm run format` to format code

## Linting (oxlint)

- Configuration in `.oxlintrc.json`
- Run `npm run lint:fix` for auto-fixes

## NestJS Patterns

- Follow NestJS dynamic module patterns
- Use dependency injection via decorators
- Global modules for shared resources
