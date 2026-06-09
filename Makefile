# EduFlow AI stack — operator shortcuts. See /docs/deployment_architecture.md §6.
COMPOSE = docker compose

.PHONY: up down logs models migrate seed test scan sbom fmt

up:            ## Start the app stack (web, ai-service, ai-worker, postgres, redis, ollama)
	$(COMPOSE) up -d --build

down:          ## Stop and remove containers
	$(COMPOSE) down

logs:          ## Tail logs
	$(COMPOSE) logs -f --tail=100

models:        ## Pull local models into the ollama volume (run once, online)
	$(COMPOSE) up -d ollama
	$(COMPOSE) exec ollama ollama pull $${LLM_MODEL:-llama3.1:8b}
	$(COMPOSE) exec ollama ollama pull $${EMBED_MODEL:-nomic-embed-text}

migrate:       ## Apply AI-service DB migrations (alembic)
	$(COMPOSE) run --rm ai-service alembic upgrade head

seed:          ## (M1+) seed demo content + build embeddings for seeded courses
	$(COMPOSE) run --rm ai-service python -m app.scripts.seed_embeddings

test:          ## Run the QA suite against the live stack
	$(COMPOSE) --profile test up --abort-on-container-exit test

scan:          ## Run security scanners (Trivy + ZAP baseline)
	$(COMPOSE) --profile security up --abort-on-container-exit trivy zap

sbom:          ## Generate a CycloneDX SBOM (requires syft)
	syft dir:. -o cyclonedx-json > security/sbom/sbom.json

ready:         ## Check ai-service readiness
	curl -fsS http://localhost:3000/api/ai/health && echo " web BFF ok"
