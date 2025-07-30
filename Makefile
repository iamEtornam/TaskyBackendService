# Tasky Backend Service - Docker Commands

# Variables
APP_NAME=tasky-backend
DOCKER_COMPOSE=docker compose
DOCKER_COMPOSE_PROD=docker compose -f docker-compose.prod.yml

# Development commands
.PHONY: dev
dev: ## Start development environment
	$(DOCKER_COMPOSE) up --build

.PHONY: dev-detached
dev-detached: ## Start development environment in detached mode
	$(DOCKER_COMPOSE) up --build -d

.PHONY: dev-down
dev-down: ## Stop development environment
	$(DOCKER_COMPOSE) down

.PHONY: dev-logs
dev-logs: ## View logs from development environment
	$(DOCKER_COMPOSE) logs -f

.PHONY: dev-shell
dev-shell: ## Get shell access to the app container
	$(DOCKER_COMPOSE) exec app sh

# Production commands
.PHONY: prod
prod: ## Start production environment
	$(DOCKER_COMPOSE_PROD) up --build -d

.PHONY: prod-down
prod-down: ## Stop production environment
	$(DOCKER_COMPOSE_PROD) down

.PHONY: prod-logs
prod-logs: ## View logs from production environment
	$(DOCKER_COMPOSE_PROD) logs -f

# Database commands
.PHONY: db-migrate
db-migrate: ## Run database migrations
	$(DOCKER_COMPOSE) exec app npm run migrate

.PHONY: db-seed
db-seed: ## Run database seeders
	$(DOCKER_COMPOSE) exec app npm run seed

.PHONY: db-reset
db-reset: ## Reset database (drop, create, migrate, seed)
	$(DOCKER_COMPOSE) exec app npm run db:reset

# Utility commands
.PHONY: build
build: ## Build the Docker image
	docker build -t $(APP_NAME) .

.PHONY: clean
clean: ## Clean up Docker resources
	docker system prune -f
	docker volume prune -f

.PHONY: clean-all
clean-all: ## Clean up all Docker resources including images
	docker system prune -af
	docker volume prune -f

.PHONY: help
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Default target
.DEFAULT_GOAL := help