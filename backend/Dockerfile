# Stage 1: Build & Dependencies
FROM node:20-bookworm-slim AS builder

WORKDIR /app/backend

# Install dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev

# Stage 2: Runtime
FROM node:20-bookworm-slim

# Install Gemini CLI globally
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g @google/gemini-cli

WORKDIR /app/backend

# Copy built node_modules
COPY --from=builder /app/backend/node_modules ./node_modules
COPY backend/*.js ./

# Copy frontend assets and project context
WORKDIR /app
COPY index.html ./
COPY project.config.md ./
COPY GEMINI.md ./
COPY agents ./agents
COPY css ./css
COPY js ./js

# Ensure necessary directories exist
RUN mkdir -p /root/.gemini /app/uploads

EXPOSE 3003

ENV HOME=/root
ENV PROJECT_ROOT=/app
ENV UPLOADS_DIR=/app/uploads

# Set working directory back to backend for server start
WORKDIR /app/backend
CMD ["node", "server.js"]
