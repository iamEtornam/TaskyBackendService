# Docker Setup for Tasky Backend Service

This document provides instructions for running the Tasky Backend Service using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for using Makefile commands)

## Quick Start

### Development Environment

1. **Clone the repository and navigate to the project directory**

2. **Copy the environment file**
   ```bash
   cp env.example .env
   ```

3. **Update the environment variables in `.env` with your actual values**

4. **Start the development environment**
   ```bash
   # Using docker-compose directly
   docker-compose up --build

   # Or using Make (if available)
   make dev
   ```

5. **The application will be available at `http://localhost:3000`**

### Production Environment

1. **Create a production environment file**
   ```bash
   cp env.example .env.production
   ```

2. **Update the production environment variables**

3. **Start the production environment**
   ```bash
   # Using docker-compose
   docker-compose -f docker-compose.prod.yml up --build -d

   # Or using Make
   make prod
   ```

## Available Make Commands

If you have Make installed, you can use these convenient commands:

```bash
make help                # Show all available commands
make dev                 # Start development environment
make dev-detached        # Start development environment in detached mode
make dev-down            # Stop development environment
make dev-logs            # View logs from development environment
make dev-shell           # Get shell access to the app container
make prod                # Start production environment
make prod-down           # Stop production environment
make prod-logs           # View logs from production environment
make db-migrate          # Run database migrations
make db-seed             # Run database seeders
make db-reset            # Reset database (drop, create, migrate, seed)
make build               # Build the Docker image
make clean               # Clean up Docker resources
make clean-all           # Clean up all Docker resources including images
```

## Database Operations

### Running Migrations

```bash
# Using Make
make db-migrate

# Using docker-compose directly
docker-compose exec app npm run migrate
```

### Running Seeders

```bash
# Using Make
make db-seed

# Using docker-compose directly
docker-compose exec app npm run seed
```

### Resetting Database

```bash
# Using Make
make db-reset

# Using docker-compose directly
docker-compose exec app npm run db:reset
```

## Environment Variables

The application requires the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Application environment (development/production) | Yes |
| `PORT` | Port for the application to run on | Yes |
| `DB_HOST` | Database host | Yes |
| `DB_PORT` | Database port | Yes |
| `DB_NAME` | Database name | Yes |
| `DB_USER` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `SENTRY_API_KEY` | Sentry DSN for error tracking | No |
| `GOOGLE_SERVICE_KEY` | Firebase service account JSON | No |
| `SENDGRID_API_KEY` | SendGrid API key for emails | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | No |
| `CLOUDINARY_SECRET_KEY` | Cloudinary secret key | No |
| `CLOUD_NAME` | Cloudinary cloud name | No |

## Volumes

- **`postgres_data`**: Persists PostgreSQL data
- **Development volume mounts**: Source code is mounted for hot reloading in development

## Networks

- **`tasky-network`**: Internal bridge network for service communication

## Health Checks

The application includes health checks:
- **App container**: HTTP check on `/api/v1/health` endpoint
- **PostgreSQL container**: Database connectivity check using `pg_isready`

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Kill the process or change the port in .env
   ```

2. **Database connection issues**
   ```bash
   # Check if PostgreSQL container is running
   docker-compose ps
   
   # Check PostgreSQL logs
   docker-compose logs postgres
   ```

3. **Permission issues**
   ```bash
   # Ensure proper ownership
   sudo chown -R $USER:$USER .
   ```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

### Accessing Container Shell

```bash
# App container
docker-compose exec app sh

# PostgreSQL container
docker-compose exec postgres psql -U postgres -d tasky_development
```

## Production Considerations

1. **Use a reverse proxy** (Nginx, Traefik) for SSL termination and load balancing
2. **Set up proper logging** with log rotation
3. **Configure monitoring** and alerting
4. **Use secrets management** for sensitive environment variables
5. **Regular backups** of the PostgreSQL data volume
6. **Resource limits** should be set based on your infrastructure

## Security Notes

- The application runs as a non-root user inside the container
- Sensitive files are excluded via `.dockerignore`
- Use environment variables for all configuration
- Consider using Docker secrets for production deployments