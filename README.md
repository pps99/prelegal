# prelegal

AI-powered platform for drafting common legal agreements.

## What it does

Chat with an AI assistant to draft any of 11 supported legal document types. The AI guides you through filling in all required fields through a natural conversation, then generates a complete, formatted document ready for review and download.

**Supported documents:** Mutual NDA, Cloud Service Agreement, Design Partner Agreement, Service Level Agreement, Professional Services Agreement, Data Processing Agreement, Software License Agreement, Partnership Agreement, Pilot Agreement, Business Associate Agreement, AI Addendum.

> **Disclaimer:** All generated documents are AI-assisted drafts. They should be reviewed by a qualified legal professional before use.

## Getting started

**Requirements:** Docker and Docker Compose.

1. Clone the repo.
2. Create a `.env` file in the project root with your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=sk-or-...
   ```
3. Start the app:
   ```bash
   # Mac
   ./scripts/start-mac.sh

   # Linux
   ./scripts/start-linux.sh

   # Windows
   ./scripts/start-windows.ps1
   ```
4. Open [http://localhost:8000](http://localhost:8000) and create an account.

To stop:
```bash
./scripts/stop-mac.sh
```

## Key features

- **Real authentication** — sign up and sign in with email and password (bcrypt hashed, JWT tokens)
- **AI chat** — conversational interface to collect all document fields
- **11 document types** — full coverage of common SaaS/business agreements
- **Document history** — all generated documents saved per user and viewable any time
- **PDF download** — print any document to PDF from the browser
- **Draft disclaimer** — clear warning that documents are AI-assisted drafts

## Tech stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, SQLite (via SQLAlchemy), LiteLLM |
| Frontend | Angular 18, TypeScript |
| AI | OpenRouter (`gpt-oss-120b:free`) with Cerebras routing |
| Container | Docker (multi-stage: Node 20 → Python 3.12) |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in, returns JWT |
| POST | `/api/chat/sessions` | Start a new chat session |
| POST | `/api/chat/sessions/{id}/messages` | Send a message |
| POST | `/api/chat/sessions/{id}/generate` | Generate final document |
| POST | `/api/documents` | Save a generated document |
| GET | `/api/documents` | List saved documents |
| GET | `/api/documents/{id}` | Get a document with full HTML |
