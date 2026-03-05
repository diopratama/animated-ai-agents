FROM node:20-bookworm-slim

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev

RUN npm install -g @google/gemini-cli

COPY backend/server.js ./server.js
COPY index.html /app/index.html
COPY project.config.md /app/project.config.md
COPY GEMINI.md /app/GEMINI.md
COPY agents /app/agents

RUN mkdir -p /root/.gemini

EXPOSE 3003

ENV HOME=/root
ENV PROJECT_ROOT=/app
CMD ["node", "server.js"]
