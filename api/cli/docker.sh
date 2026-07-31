#!/bin/bash

# Change to project root directory (parent of cli/)
cd "$(dirname "$0")/.." || exit 1

show_help() {
    echo "Usage: ./cli/manage-docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev-up         - Start development environment"
    echo "  dev-down       - Stop development environment"
    echo "  dev-logs       - View development logs"
    echo "  dev-restart    - Restart development environment"
    echo "  dev-connect    - Connect to development container shell"
    echo "  dev-migrate    - Run database migrations in development"
    echo "  dev-seed       - Run database seeds in development"
    echo ""
    echo "  prod-up        - Start production environment"
    echo "  prod-down      - Stop production environment"
    echo "  prod-logs      - View production logs"
    echo "  prod-restart   - Restart production environment"
    echo "  prod-build     - Build production images"
    echo "  prod-connect   - Connect to production container shell"
    echo "  prod-migrate   - Run database migrations in production"
    echo "  prod-seed      - Run database seeds in production"
    echo ""
    echo "  stop-all       - Stop both environments"
    echo "  clean-all      - Stop and remove all containers, networks, volumes"
    echo "  status         - Show status of all containers"
    echo ""
}

case "$1" in
    dev-up)
        echo "Starting development environment..."
        docker-compose -f docker-compose.dev.yml --env-file .env.development up -d
        ;;
    dev-down)
        echo "Stopping development environment..."
        docker-compose -f docker-compose.dev.yml --env-file .env.development down
        ;;
    dev-logs)
        echo "Viewing development logs (press Ctrl+C to exit)..."
        docker logs tabletap-api -f
        ;;
    dev-restart)
        echo "Restarting development environment..."
        docker-compose -f docker-compose.dev.yml --env-file .env.development restart
        ;;
    prod-up)
        echo "Starting production environment..."
        docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
        ;;
    prod-down)
        echo "Stopping production environment..."
        docker-compose -f docker-compose.prod.yml --env-file .env.production down
        ;;
    prod-logs)
        echo "Viewing production logs (press Ctrl+C to exit)..."
        docker logs tabletap-api-prod -f
        ;;
    prod-restart)
        echo "Restarting production environment..."
        docker-compose -f docker-compose.prod.yml --env-file .env.production restart
        ;;
    prod-build)
        echo "Building production images..."
        docker-compose -f docker-compose.prod.yml --env-file .env.production build --no-cache
        ;;
    prod-connect)
        echo "Connecting to production container..."
        docker exec -it tabletap-api-prod sh
        ;;
    prod-migrate)
        echo "Running database migrations in production..."
        docker exec -it tabletap-api-prod npm run db:migrate:prod
        ;;
    prod-seed)
        echo "Running database seeds in production..."
        docker exec -it tabletap-api-prod npm run db:seed:prod
        ;;
    dev-connect)
        echo "Connecting to development container..."
        docker exec -it tabletap-api sh
        ;;
    dev-migrate)
        echo "Running database migrations in development..."
        docker exec -it tabletap-api npm run db:migrate
        ;;
    dev-seed)
        echo "Running database seeds in development..."
        docker exec -it tabletap-api npm run db:seed
        ;;
    stop-all)
        echo "Stopping all environments..."
        docker-compose -f docker-compose.dev.yml --env-file .env.development down
        docker-compose -f docker-compose.prod.yml --env-file .env.production down
        echo "All environments stopped."
        ;;
    clean-all)
        echo "⚠️  WARNING: This will remove all containers, networks, and volumes!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo "Cleaning development environment..."
            docker-compose -f docker-compose.dev.yml --env-file .env.development down -v
            echo "Cleaning production environment..."
            docker-compose -f docker-compose.prod.yml --env-file .env.production down -v
            echo "All cleaned!"
        else
            echo "Cancelled."
        fi
        ;;
    status)
        echo "=== Development Containers ==="
        docker-compose -f docker-compose.dev.yml --env-file .env.development ps
        echo ""
        echo "=== Production Containers ==="
        docker-compose -f docker-compose.prod.yml --env-file .env.production ps
        ;;
    *)
        show_help
        ;;
esac