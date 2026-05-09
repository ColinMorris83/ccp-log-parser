# Contributing

Thanks for your interest in contributing to CCP Log Parser! This guide covers everything you need to get started.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/<your-username>/ccp-log-parser.git
   cd ccp-log-parser
   ```

3. **Install** dependencies:

   ```bash
   npm install
   ```

4. **Start** the dev server:

   ```bash
   npm start
   ```

   The app runs at <http://localhost:3100>.

## Prerequisites

- Node.js 22+
- npm 10+

## Available Commands

| Task                 | Command                 |
| -------------------- | ----------------------- |
| Start dev server     | `npm start`             |
| Build for production | `npm run build`         |
| Run all tests        | `npm test`              |
| Run tests (watch)    | `npm run test:watch`    |
| Lint (all)           | `npm run lint`          |
| Lint fix (ESLint)    | `npm run lint:fix`      |
| Format check         | `npm run lint:prettier` |
| Format fix           | `npm run prettier:fix`  |

`npm run build` runs a TypeScript typecheck (`tsc -b`) before bundling — fix any type errors before building.

## Code Style

The project enforces consistent style automatically:

- **Prettier** handles formatting (2-space indent, single quotes, semicolons, trailing commas)
- **ESLint** enforces code quality with `--max-warnings 0` — all warnings are errors
- **Pre-commit hook** runs ESLint, Prettier, and markdownlint on staged files via lint-staged

Run `npm run lint` before pushing to catch issues early.

### Key Conventions

- Functional components only, in PascalCase folders with `index.tsx` entry files
- `interface` for object shapes, `type` for aliases and unions
- JSDoc comments on exported functions and interfaces
- Alphabetical JSX props
- Inline `type` keyword for type-only imports: `import { type FC } from 'react';`

See [AGENTS.md](./AGENTS.md) for the full style guide.

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint.

```text
feat: add regex filter to log table
fix: prevent duplicate file loading
chore: update MUI to v9.1
refactor: extract snapshot navigation into hook
test: add localStorage utility tests
docs: update contributing guide
```

The pre-commit hook will reject non-conforming messages.

## Submitting a Pull Request

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes, ensuring:
   - `npm run lint` passes with zero warnings
   - `npm test` passes
   - `npm run build` succeeds (includes typecheck)

3. Push your branch and open a PR against `main`.

4. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md) — select the change type and complete the checklist.

5. CI will run lint, tests, and build automatically. All checks must pass before merging.

6. A maintainer will review and merge your PR.

## Testing

- Tests use **Vitest** + **React Testing Library**
- Test files are co-located with source: `index.spec.tsx` for components, `<filename>.spec.ts` for utils/hooks
- Use `vi.fn()` for mocks and `vi.mock()` for module mocks
- Define a `defaultProps` object at `describe` level and spread into renders

## Questions?

Open an [issue](https://github.com/ColinMorris83/ccp-log-parser/issues) if something is unclear or you have a feature request.
