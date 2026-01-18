# Repository Guidelines

## Project Structure & Module Organization

- `src/`: library source (TypeScript, ESM-first)
  - `src/puppeteer.module.ts`: public NestJS module (`forRoot`, `forRootAsync`, `forFeature`)
  - `src/puppeteer-core.module.ts`: internal core module managing Browser lifecycle
  - `src/interfaces/`: public types (module options, async options)
- `__tests__/`: Jest integration/unit tests (`*.test.ts`)
  - `__tests__/test-server/`: lightweight Nest app used by integration tests
- `docs/`: design notes and feature comparisons
- Generated: `dist/` (build output), `coverage/` (test coverage)

## Build, Test, and Development Commands

- `npm ci`: install dependencies (uses the lockfile in CI).
- `npm run build`: build `dist/` via `tsup` (dual ESM/CJS + `.d.ts`).
- `npm run typecheck`: run TypeScript checking (`tsgo --noEmit`).
- `npm run lint` / `npm run lint:fix`: lint `src/` and `__tests__/` with `oxlint`.
- `npm run format` / `npm run format:check`: format/check with `oxfmt`.
- `npm test`: run Jest (preconfigured for ESM).
- `npm run test:coverage`: run tests + coverage (uploaded in CI).

## Coding Style & Naming Conventions

- TypeScript, strict mode (`tsconfig.json`); Node `>=20`.
- Use `oxfmt` formatting (2-space indent, double quotes, trailing commas).
- Keep internal relative imports using `.js` extensions (e.g. `./puppeteer.module.js`) to match ESM output.
- File naming follows Nest patterns: `*.module.ts`, `*.providers.ts`, `*.constants.ts`.

## Testing Guidelines

- Framework: Jest + `@swc/jest` (ESM). Tests live in `__tests__/` and must end with `.test.ts`.
- Prefer integration-style coverage using the `__tests__/test-server` app when changing module wiring or providers.
- Run a single test file:
  - `npm test -- --testPathPatterns=launch-args.test`

## Commit & Pull Request Guidelines

- Use Conventional Commits seen in history: `feat:`, `fix:`, `docs:`, `chore:`, `ci:` (use `feat!:` for breaking changes).
- PRs should include: what/why, how to test, and any doc updates (README/docs) for behavior changes.
- Before opening a PR, run: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:coverage`.

## Security & Configuration Notes

- On Linux, Chrome sandboxing may require host configuration; CI enables it via `sysctl` in `.github/workflows/`.
- Avoid expanding default `--no-sandbox` usage beyond what’s needed; document security-impacting changes in the PR.
