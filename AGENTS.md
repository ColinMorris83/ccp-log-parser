# AGENTS.md - CCP Log Parser

## Project Overview

React 19 SPA (TypeScript 6, Vite 8, MUI 9) for parsing and debugging Amazon Connect CCP log files.
No routing, no backend, no auth — purely client-side. Deployed to GitHub Pages via GitHub Actions.

## Build / Lint / Test Commands

| Task                    | Command                                      |
| ----------------------- | -------------------------------------------- |
| Install dependencies    | `npm install`                                |
| Start dev server        | `npm start`                                  |
| Build (typecheck+build) | `npm run build`                              |
| Run all tests           | `npm test`                                   |
| Run tests in watch mode | `npm run test:watch`                         |
| Run a single test file  | `npx vitest run src/utils/logParser.spec.ts` |
| Run tests matching name | `npx vitest run -t "should parse"`           |
| Lint (all)              | `npm run lint`                               |
| Lint JS/TS only         | `npm run lint:js`                            |
| Lint fix                | `npm run lint:fix`                           |
| Format check            | `npm run lint:prettier`                      |
| Format fix              | `npm run prettier:fix`                       |

### Important Notes

- `npm run build` runs `tsc -b` first. Fix type errors before building.
- ESLint enforces `--max-warnings 0` — all warnings are errors in CI.
- `npm run lint` runs `lint:js`, `lint:markdown`, and `lint:prettier` in parallel via `concurrently`.
- Vitest uses `happy-dom` environment and globals (`describe`, `it`, `expect`, `vi`
  are available without importing).
- Test setup file: `src/testSetup.ts` (imports `@testing-library/jest-dom/vitest`).
- Vitest config is in a separate `vitest.config.ts` (not inside `vite.config.ts`).

## Project Structure

```text
src/
  components/         -- UI components (PascalCase folders, index.tsx entry)
    AppHeader/        -- Header bar with version chip, theme toggle, filter button
    CcpLogParser/     -- Main page: orchestrates table, metrics, snapshots, filters
    DropZone/         -- Drag-and-drop file upload with loading backdrop
    FileUploadButton/ -- File picker button
    FilterManager/    -- CRUD dialog for custom source filters
    LogTable/         -- Virtualised log table (material-react-table)
    MetricsPanel/     -- Error/warning/entry count chips
    MrtThemeProvider/ -- Theme wrapper for material-react-table
    SegmentedTabs/    -- Multi-file tab switcher
    SnapshotList/     -- Clickable agent snapshot navigation
  config.ts           -- Build config (version from VITE_APP_VERSION)
  constants/          -- Shared constants (MRT theme colours)
  hooks/              -- Custom hooks (useCustomFilters, useMrtTheme)
  models/             -- TypeScript interfaces and types
  theme/              -- MUI unified theme (light + dark colour schemes)
  utils/              -- Pure functions (log parser, localStorage helpers)
```

## Code Style Guidelines

### Formatting (Prettier)

- 2-space indentation, LF line endings, 120 char print width
- Single quotes, semicolons always, trailing commas
- Prettier is the source of truth — do not fight it

### Imports

Imports are grouped in two blocks separated by a blank line:

1. **External packages** (alphabetical): `@mui/*`, `react`, etc.
2. **Internal/relative imports** (alphabetical): `../../models/`, `../hooks/`, `./`

Use inline `type` keyword when importing only types:

```ts
import { type FC, type PropsWithChildren } from 'react';
```

### Naming Conventions

| Category            | Convention              | Example                             |
| ------------------- | ----------------------- | ----------------------------------- |
| Components          | PascalCase              | `FilterManager`                     |
| Component folders   | PascalCase              | `FilterManager/index.tsx`           |
| Functions/variables | camelCase               | `getLocalStorage`, `filteredCounts` |
| Hooks               | `use` prefix, camelCase | `useCustomFilters`                  |
| Interfaces          | PascalCase              | `EnrichedLogEntry`, `CustomFilter`  |
| Props interfaces    | `<Component>Props`      | `FilterManagerProps`                |
| Non-component files | camelCase               | `logParser.ts`, `localStorage.ts`   |

### Types and Interfaces

- Use `interface` for object shapes; use `type` only for aliases and unions
- Define props interfaces in the same file, above the component
- Add JSDoc comments to exported interfaces and their properties (enforced by eslint-plugin-jsdoc)
- Use `as const` on config objects
- Use `Record<string, never>` for empty response objects

### Components

- All components are functional (no class components)
- Destructure props in the function signature with inline defaults
- Components live in `index.tsx` within PascalCase-named folders
- JSX props should be ordered alphabetically (enforced by perfectionist)

### Error Handling

- No try/catch in components — rely on error state and conditional rendering
- localStorage helpers silently swallow errors (storage full / unavailable)

## Testing

### Framework

Vitest + React Testing Library + `@testing-library/jest-dom` matchers.

### File Naming

- Component tests: `index.spec.tsx` co-located in the component folder
- Util/hook tests: `<filename>.spec.ts` or `.spec.tsx` co-located with source

### Patterns

- Define a `defaultProps` object at `describe` level, spread into renders
- Use `vi.fn()` for mocks, `vi.mock()` for module mocks, `vi.clearAllMocks()` in `beforeEach`
- JSDoc not required in test files (eslint rule disabled)

## Git Conventions

- **Commit messages**: conventional commits enforced by commitlint (`feat:`, `fix:`, `chore:`, etc.)
- **Pre-commit hook**: runs `lint-staged` (ESLint + Prettier + markdownlint on staged files)

## Environment Variables

- `VITE_APP_VERSION=$npm_package_version` in `.env` — injected at build time
- Accessed via `import.meta.env.VITE_APP_VERSION`, centralised in `src/config.ts`

## Deployment

- GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- Deploys on push to `main` only: Install → Lint → Test → Build → Deploy
- `vite.config.ts` sets `base: '/ccp-log-parser/'` for the Pages subpath
- Build output: `dist/` with vendor code splitting (MUI, MRT, React chunks)

## Key Architecture Notes

- **No routing** — single-page tool, no React Router
- **No server state** — all data is client-side (parsed from dropped files)
- **Custom filters** persisted to localStorage with `ccp-log-parser:` key prefix
- **Theme** uses MUI's built-in `ThemeProvider` with `useColorScheme()` for dark/light toggle — no external state management
