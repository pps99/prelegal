# Stage 1: Build Angular frontend
FROM node:20-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci --quiet
COPY frontend/ ./
RUN npm run build

# Stage 2: FastAPI backend
FROM python:3.12-slim AS app
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY backend/pyproject.toml ./
RUN uv pip install --system fastapi "uvicorn[standard]" sqlalchemy python-multipart litellm python-dotenv Markdown

COPY backend/ ./
COPY templates/ ./templates/

# Copy built Angular into static/ so FastAPI can serve it
COPY --from=frontend-build /build/frontend/dist/frontend/browser ./static

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
