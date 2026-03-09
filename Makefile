.PHONY: help setup install run-local run-local-backend run-local-frontend run-docker stop clean

PORT ?= 3003
GEMINI_AUTH_MODE ?= google_login

help:
	@echo "Pixel Agents - Management Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make help                Show all available commands (default)"
	@echo "  make setup               First-time setup: copy .env if missing, install deps"
	@echo "  make install             Install backend dependencies"
	@echo "  make run-local           Run backend and frontend locally in one terminal"
	@echo "  make run-local-backend   Run backend only (port 3003)"
	@echo "  make run-local-frontend  Run frontend only (N/A, served by backend)"
	@echo "  make run-docker          Run services in Docker"
	@echo "  make stop                Stop Docker containers"
	@echo "  make clean               Stop containers and remove volumes/node_modules"
	@echo ""

setup:
	@if [ ! -f .env ]; then cp .env.example .env && echo ".env created from .env.example"; fi
	$(MAKE) install

install:
	npm install
	npm run install:backend

run-local:
	@./run-local.sh

run-local-backend:
	@PORT=$(PORT) GEMINI_AUTH_MODE=$(GEMINI_AUTH_MODE) npm run dev --prefix backend

run-local-frontend:
	@echo "Frontend is served by the backend at http://localhost:$(PORT)"

run-docker:
	@./run-docker.sh

stop:
	@./run-docker.sh down

clean:
	@./run-docker.sh down
	rm -rf node_modules backend/node_modules
	find . -type d -name "node_modules" -exec rm -rf {} +
