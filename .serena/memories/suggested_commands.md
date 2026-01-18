# Suggested Commands

## Development

```bash
npm install           # Install dependencies
npm run build         # Build with tsup
npm run typecheck     # Run TypeScript type checking (tsgo)
```

## Code Quality

```bash
npm run lint          # Run oxlint on src/ and __tests__/
npm run lint:fix      # Run oxlint with auto-fix
npm run format        # Format code with oxfmt
npm run format:check  # Check code formatting
```

## Testing

```bash
npm test              # Run e2e tests with Jest
npm run test:coverage # Run tests with coverage
npm test -- --testPathPatterns=app.test  # Run specific test file
```

## Task Completion Checklist

When completing a task, run:

1. `npm run lint` - Ensure no linting errors
2. `npm run format:check` - Ensure code is formatted
3. `npm run typecheck` - Ensure no type errors
4. `npm test` - Ensure all tests pass
