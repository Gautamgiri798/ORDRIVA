# ORDRIVA POS - Operational Runbook & Deployment

## 1. Local Development
```bash
# 1. Install all dependencies
pnpm install

# 2. Start PostgreSQL & Redis via Docker
docker-compose up -d db redis

# 3. Run Prisma Migrations & Seed data
pnpm db:generate
pnpm db:seed

# 4. Start Development Server
pnpm dev
```
Open `http://localhost:3000` to launch the ORDRIVA web application.

## 2. Production Docker Deployment
```bash
docker-compose -f docker-compose.yml up --build -d
```

## 3. Database Backup & Restore
* **Backup**: `docker exec -t ordriva_postgres pg_dump -U app ordriva > ordriva_backup_$(date +%Y%m%d).sql`
* **Restore**: `cat backup.sql | docker exec -i ordriva_postgres psql -U app -d ordriva`
