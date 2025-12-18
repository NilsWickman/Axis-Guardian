# Repository Guidelines

## Project Structure & Module Organization
Axis-Guardian is a `pnpm` workspace monorepo:

- `frontend/` — Vue 3 + Vite UI (`frontend/src/`), static assets in `frontend/public/`, Storybook in `frontend/stories/`.
- `backend/` — Fastify + TypeScript API (`backend/src/`), tests in `backend/tests/` and `src/**/*.test.ts`, SQLite DB in `backend/data/`.
- `camera-emulator/` — WebRTC camera simulator (`camera-emulator/src/`).
- `shared/` — shared configs/data; type package in `shared/types/src/`, camera datasets in `shared/cameras/`.

Docs live in `docs/` and `tech-logs/`.

## Build, Test, and Development Commands
Use `pnpm` for all packages.

- `make setup` — install deps for all packages and seed the tracking DB.
- `make dev` — start all services (frontend `5173`, camera emulator `9101`, backend `3010`).
- `make dev-frontend | dev-camera | dev-backend` — start a single service.
- `make https-setup` then `make dev-https` — optional HTTPS dev (requires Docker + mkcert).

Per-package examples:

- `cd frontend && pnpm dev | build | lint | format | test`
- `cd backend && pnpm dev | build | test | test:coverage | db:seed`
- `cd camera-emulator && pnpm dev | build`

## Coding Style & Naming Conventions
- TypeScript + ESM across the repo; prefer explicit types and avoid unused locals.
- Indentation: 2 spaces.
- Frontend uses ESLint + Prettier (single quotes, no semicolons, trailing commas, ~100-char lines). Run `pnpm format` and `pnpm lint`.
- Vue components: `PascalCase.vue`; other modules: `kebab-case.ts`.

## Testing Guidelines
- Test runner: Vitest (`frontend/`, `backend/`).
- Keep tests deterministic and focused; name files `*.test.ts`.
- Integration tests live in `backend/tests/integration/`.

## Commit & Pull Request Guidelines
- Keep commits short and imperative (e.g. `Timestamp fix`, `IOS support`); add an optional scope prefix like `frontend: ...`.
- PRs should include a clear description, how to verify locally, linked issues, and screenshots/video for UI changes. Call out any DB/config impacts.

## Agent-Specific Notes
For architecture and workflows, see `CLAUDE.md` and `RALPH-AGENTS.md`.
