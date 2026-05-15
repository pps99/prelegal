# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports real user registration and login with bcrypt password hashing and JWT tokens. Users can chat with AI to draft any of the 11 supported legal document types. Generated documents are automatically saved per-user and accessible from the Documents history page. A draft disclaimer is shown throughout the UI.

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
The database uses SQLite and is created from scratch each time the Docker container is brought up. It has `users` (email, password_hash, created_at), `chat_sessions`, and `documents` (id, user_id, doc_type, title, fields_json, rendered_html, created_at) tables.  
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

### PL-5 — AI chat interface for Mutual NDA (complete)
- **Backend**: New `chat_sessions` SQLite table (id, messages JSON, created_at). Three endpoints under `/api/chat`: `POST /sessions` (creates session, returns greeting), `POST /sessions/{id}/messages` (single LiteLLM call returning `{message, partial_nda_data}` via JSON Schema structured outputs), `POST /sessions/{id}/generate` (produces final complete NDA data object with defaults applied).
- **LLM**: LiteLLM with OpenRouter model `openrouter/openai/gpt-oss-120b:free`, Cerebras preferred provider via `extra_body` routing. `load_dotenv()` called in `main.py`; `OPENROUTER_API_KEY` injected via `env_file` in `docker-compose.yml`.
- **Frontend**: `NdaChatComponent` replaces the old static `NdaFormComponent`. Two-pane layout — chat on the left, live `NdaPreviewComponent` sidebar on the right that updates as partial data accumulates. "Generate Document" triggers the generate endpoint and emits `formSubmitted` to `NdaPageComponent`. `NdaPreviewComponent` gains `@Input() showActions` to hide toolbar in sidebar context.
- **Services**: New `ChatService` (`frontend/src/app/services/chat.service.ts`) with `createSession`, `sendMessage`, `generateDocument` methods.
- **Tests**: 8 pytest backend tests (session creation, message persistence, generate, 404 cases); 72 Angular Karma/Jasmine tests (12 `NdaChatComponent`, 3 `ChatService`, 5 `NdaPageComponent`, others unchanged).
- **Not yet implemented**: real authentication, multi-document support, document persistence.

### PL-7 — Multiple users & final polish (complete)
- **Auth**: Real `POST /api/auth/register` and `POST /api/auth/login` with bcrypt password hashing (`passlib[bcrypt]`) and JWT tokens (`python-jose`). Minimum 8-character passwords enforced. Duplicate email returns 409.
- **JWT middleware**: `get_current_user_email` dependency in `app/auth_utils.py` validates `Authorization: Bearer <token>` on protected endpoints. Angular `authInterceptor` automatically attaches the token to all `/api/` requests.
- **Document persistence**: New `documents` SQLite table. `POST /api/documents`, `GET /api/documents`, `GET /api/documents/{id}` endpoints scoped to the authenticated user. Documents auto-saved after generation.
- **Frontend — Signup**: New `SignupComponent` at `/signup` with email, password, confirm-password fields and client-side mismatch validation.
- **Frontend — Documents page**: New `DocumentsPageComponent` at `/documents` with a dark navy sidebar listing saved docs and a main preview pane. PDF download supported.
- **Frontend — Polish**: App header in chat panel now shows user initial avatar, "My documents" link, and sign-out button. Login and signup pages share polished card styling with cross-links.
- **Disclaimer**: Yellow warning banner displayed in chat right-panel, preview toolbar, and documents preview pane: "AI-assisted draft — review by a legal professional required."
- **Tests**: 6 new pytest tests for auth (`test_auth.py`), 9 new pytest tests for documents (`test_documents.py`); updated Angular specs (29 total) for new dependencies in `NdaChatComponent` and `NdaPageComponent`.