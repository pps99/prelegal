# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation has a fake login screen (any credentials accepted) that leads into the Mutual NDA form. AI chat, real authentication, and document persistence are not yet implemented.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

Use LiteLLM with OpenRouter and the free model `openrouter/openai/gpt-oss-120b:free`.
Prefer Cerebras as the inference provider using OpenRouter provider routing.
Use Structured Outputs with JSON Schema so the response can be parsed safely and used to populate fields in the legal document.
Read the API key from `OPENROUTER_API_KEY` in the project root `.env` file.
Do not use paid models.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database uses SQLite and is created from scratch each time the Docker container is brought up. It has a `users` table (email, created_at). Sign-up and sign-in with real password validation are not yet implemented.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation status

### PL-3 — Mutual NDA creator prototype
Static Angular 18 form for the Mutual NDA only. No backend, no routing, no AI.

### PL-4 — V1 technical foundation (complete)
- **Backend**: `backend/` — FastAPI uv project, `POST /api/auth/login` (fake, any credentials succeed), `GET /api/health`, SQLite DB with `users` table recreated on each container start.
- **Frontend**: Angular routing added. `/login` → `LoginComponent`, `/` → `NdaPageComponent` (Mutual NDA form) behind an auth guard. Token stored in `localStorage`.
- **Static serving**: Angular is built and served by FastAPI via a catch-all SPA route.
- **Docker**: Multi-stage `Dockerfile` (Node 20 → Python 3.12) + `docker-compose.yml`.
- **Scripts**: `scripts/start-{mac,linux}.sh`, `scripts/stop-{mac,linux}.sh`, `scripts/start/stop-windows.ps1` — all Docker-based.
- **Not yet implemented**: real authentication, AI chat, multi-document support, document persistence.