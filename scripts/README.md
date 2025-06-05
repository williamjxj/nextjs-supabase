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

## Environment Variables

All scripts automatically load environment variables from `.env.local`:

- `DB_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for API access
- `SUPABASE_S3_STORAGE_URL` - S3 storage URL

## Making Scripts Executable

```bash
chmod +x scripts/*.sh
```

## Usage Examples

```bash
# Make all scripts executable
chmod +x scripts/*.sh

# Query all tables
./scripts/query-tables.sh

# Check storage
./scripts/get-storage.sh

# Reset database (interactive)
./scripts/reset-sync-tables.sh

# Quick migration run
./scripts/reset-sync-tables.sh --migrate
```

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
