.PHONY: help docker-dev docker-dev-logs docker-build docker-prod docker-stop docker-clean docker-rebuild

help:
	@echo "Docker commands for Next.js Amazona Marketplace"
	@echo ""
	@echo "Development:"
	@echo "  make docker-dev           Start development stack (docker-compose up)"
	@echo "  make docker-dev-logs      Stream logs from app container"
	@echo "  make docker-rebuild       Rebuild containers and start"
	@echo ""
	@echo "Production:"
	@echo "  make docker-build         Build production Docker image"
	@echo "  make docker-prod          Run image locally as production"
	@echo ""
	@echo "Cleanup:"
	@echo "  make docker-stop          Stop containers (volumes preserved)"
	@echo "  make docker-clean         Stop containers and remove volumes"
	@echo ""

docker-dev:
	docker-compose up -d
	@echo "✓ Development stack started"
	@echo "  App:     http://localhost:3000"
	@echo "  Mailhog: http://localhost:8025"
	@echo "  MongoDB: localhost:27017"
	@echo "  Redis:   localhost:6379"

docker-dev-logs:
	docker-compose logs -f app

docker-build:
	docker build -t amazona:latest .
	@echo "✓ Production image built: amazona:latest"

docker-prod:
	docker run -p 3000:3000 \
		--env-file .env.local \
		--name amazona-prod \
		amazona:latest

docker-stop:
	docker-compose down
	@echo "✓ Containers stopped"

docker-clean:
	docker-compose down -v
	@echo "✓ Containers stopped and volumes removed"

docker-rebuild:
	docker-compose up -d --build
	@echo "✓ Containers rebuilt and started"

# Additional useful commands
docker-logs-mongo:
	docker-compose logs -f mongo

docker-logs-redis:
	docker-compose logs -f redis

docker-ps:
	docker-compose ps

docker-shell:
	docker-compose exec app sh

docker-mongo-shell:
	docker-compose exec mongo mongosh -u admin -p password --authenticationDatabase admin

docker-redis-cli:
	docker-compose exec redis redis-cli

docker-prune:
	docker system prune -a
	@echo "✓ Unused Docker resources cleaned"
