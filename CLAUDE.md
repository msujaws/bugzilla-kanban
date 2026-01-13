# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start dev server at localhost:5173
npm run build            # TypeScript check + Vite production build
npm run typecheck        # TypeScript only (no build)

# Testing
npm test                 # Run Vitest (watch mode by default)
npm test -- --run        # Run tests once without watch
npm test -- --run src/components/Board/Card.test.tsx  # Run single test file
npm run test:e2e         # Run Playwright E2E tests

# Linting
npm run lint             # ESLint
npm run lint:css         # Stylelint
```

## Architecture

### State Management

Zustand store with slice pattern in `src/store/`:

- **auth-slice**: API key storage/validation (encrypted in localStorage via `lib/storage/api-key-storage.ts`)
- **bugs-slice**: Bug fetching from Bugzilla API
- **staged-slice**: Tracks drag-drop changes before applying to Bugzilla
- **notifications-slice**: Toast messages

Slices are composed in `src/store/index.ts`. Devtools disabled in production to protect API keys.

### Bugzilla Integration

- `src/lib/bugzilla/client.ts`: BugzillaClient class for API calls
- `src/lib/bugzilla/status-mapper.ts`: Maps Bugzilla statuses ↔ Kanban columns
- `api/bugzilla/[...path].ts`: Vercel serverless CORS proxy to bugzilla.mozilla.org

### Branded Types

`src/types/branded.ts` defines `ApiKey`, `BugzillaBaseUrl`, and `BugId` branded types to prevent accidental argument swapping at compile time.

### Component Structure

- `App.tsx`: Main orchestrator, manages modals and wires up store actions
- `Board.tsx`: Kanban board with @dnd-kit drag-drop + keyboard navigation (arrows to select, Shift to grab/drop)
- `Column.tsx`: Single kanban column, receives bugs filtered by status
- `Card.tsx`: Bug card with selection/grabbed visual states

### Testing

- Unit tests colocated with source files (`*.test.tsx`)
- MSW for API mocking in `tests/setup.ts`
- Playwright E2E tests in `tests/integration/`
- 80% coverage threshold enforced

## Development Workflow

### Test-Driven Development (TDD)

All code must be written using TDD:

1. **RED**: Write failing tests first
2. **GREEN**: Write minimal code to make tests pass
3. **REFACTOR**: Clean up while keeping tests green

### Commits

Commit in logical chunks as you work. Don't wait until a feature is complete - commit after each meaningful step (e.g., tests passing, component implemented, wiring complete).

### Branded Types

Use branded types from `src/types/branded.ts` when working with primitive values that have semantic meaning:

- `ApiKey` for API keys (not raw strings)
- `BugId` for bug IDs (not raw numbers)
- `BugzillaBaseUrl` for URLs (not raw strings)

Create new branded types when introducing new domain concepts that could be confused with other primitives.

## Code Style

- Uses `eslint-plugin-unicorn` with strict rules (prefer modern APIs, no null, etc.)
- Prefix unused variables with `_`
- Use `for...of` instead of `.forEach()`
- File naming: kebab-case or PascalCase
- Commits follow Conventional Commits format
