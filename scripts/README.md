# Supabase Scripts

This folder contains bash scripts for managing and interacting with your local Supabase instance.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- PostgreSQL client tools (`psql`)
- `curl` (usually pre-installed on macOS/Linux)
- `jq` (optional, for better JSON formatting): `brew install jq`

## Scripts

### 1. 🔍 `query-tables.sh`

Query and inspect Supabase database tables.

```bash
./scripts/query-tables.sh
```

**Features:**

- Lists all available tables
- Shows recent images and purchases
- Displays table counts
- Shows user statistics

### 2. 📦 `get-storage.sh`

Retrieve information about Supabase storage buckets and objects.

```bash
./scripts/get-storage.sh
```

**Features:**

- Lists all storage buckets
- Shows objects in buckets
- Displays bucket details
- Queries storage tables from database

### 3. 🔄 `reset-sync-tables.sh`

Reset database and run migrations to sync with latest schema.

```bash
# Interactive mode
./scripts/reset-sync-tables.sh

# Reset database directly (⚠️ DESTRUCTIVE)
./scripts/reset-sync-tables.sh --reset

# Run pending migrations only
./scripts/reset-sync-tables.sh --migrate
```

**Features:**

- Interactive menu for different operations
- Database reset (with confirmation)
- Migration management
- Status checking
- New migration generation

### 4. 🌱 `seed-plans.sh`

Seed subscription plans in the database.

```bash
./scripts/seed-plans.sh
```

**Features:**

- Seeds all subscription plans (standard, premium, commercial)
- Verifies server is running before execution
- Pretty-printed JSON response
- Error handling and validation

## Environment Variables

All scripts automatically load environment variables from the project's environment management system. See `docs/environment-management.md` for details on the new environment system.

Key variables used by scripts:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for API access
- `SUPABASE_S3_STORAGE_URL` - S3 storage URL

## Environment Management

The project now uses `dotenv-cli` for environment management instead of custom scripts. The old `env-local.js` and `env-cloud.js` scripts have been removed in favor of the new system.

## Safety Notes

- The reset script includes confirmation prompts for destructive operations
- Always backup important data before running reset operations
- These scripts are designed for local development environments
- Do not use reset operations on production databases

## Troubleshooting

### Common Issues:

1. **Permission denied**: Run `chmod +x scripts/*.sh`
2. **psql not found**: Install PostgreSQL client tools
3. **supabase not found**: Install Supabase CLI with `npm install -g supabase`
4. **Connection refused**: Ensure Supabase is running with `supabase start`

### Checking Supabase Status:

```bash
supabase status
```

This should show all services running on their respective ports.
