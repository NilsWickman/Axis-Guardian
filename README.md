# Axis-Guardian

Monorepo for the Multi object tracking system developed solo in paralell to a course project where 24 created the same system. Frontend in vue with standard Shadcn and tailwind, Backend with REST and mediasoup for MOT, and a camera emulator serving preprocessed mp4 files with detections metadata.

Available on https://pummenc2.win

## Requirements

- Node v22.19.0
- Make compatitibility (Might be problems on Windows OS unless using WSL2)
- `git-lfs` (for pulling large preprocessed videos)

## Quickstart

```bash
make setup
make dev
```

Services (defaults):

- Frontend: http://localhost:5173
- Camera emulator: http://localhost:9101
- Backend: http://localhost:3010

## Workspace

- `frontend/` — Vue 3 + Vite UI
- `backend/` — Fastify + TypeScript API (SQLite in `backend/data/`)
- `camera-emulator/` — WebRTC camera simulator
- `shared/` — shared configs/data and types

## Helpful commands

```bash
make dev-frontend
make dev-camera
make dev-backend
```

## Large files (Git LFS)

Preprocessed videos live in `shared/cameras/preprocessed/` (also exposed to the frontend via the `frontend/public/preprocessed` symlink).

To fetch them after cloning:

```bash
git lfs install
git lfs pull
```

## Docs

- `docs/`
- `tech-logs/`
