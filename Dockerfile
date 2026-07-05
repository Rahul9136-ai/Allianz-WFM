# ---------------------------------------------------------------------------
# WFM Request Portal - single-image build for Railway (API + built SPA).
# Stage 1 builds the React frontend; stage 2 builds the API and serves both.
# ---------------------------------------------------------------------------

# --- Stage 1: build the React frontend -------------------------------------
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin API in production: the backend serves this build and the app
# calls "/api" relative to its own host.
ENV VITE_API_URL=/api
RUN npm run build

# --- Stage 2: build + run the backend --------------------------------------
FROM node:20-slim
WORKDIR /app/backend

# OpenSSL is required by Prisma's query engine.
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
# Install all deps (incl. prisma CLI + tsc) needed to generate, build, migrate.
RUN npm ci

COPY backend/ ./
RUN npx prisma generate && npm run build

# Bring in the compiled frontend and point the server at it.
COPY --from=frontend /app/frontend/dist ./client
ENV CLIENT_DIST_DIR=/app/backend/client

ENV NODE_ENV=production
# Railway injects PORT; the app also defaults to 4000.
EXPOSE 4000

# On boot: apply migrations, seed idempotently, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/db/seed.js && node dist/server.js"]
