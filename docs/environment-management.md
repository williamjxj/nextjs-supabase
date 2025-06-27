# 🌍 Environment Management Guide

This project uses a simple environment management system for 3 specific cases.

## 📁 Environment Files Structure

| File              | Purpose                         | Committed to Git | Description                         |
| ----------------- | ------------------------------- | ---------------- | ----------------------------------- |
| `.env`            | Local Next.js + Cloud Supabase  | ✅ Yes           | Default development configuration   |
| `.env.docker`     | Local Next.js + Local Supabase  | ❌ No            | Docker Supabase local development   |
| `.env.production` | Vercel Next.js + Cloud Supabase | ✅ Yes           | Production deployment configuration |
| `.env.example`    | Documentation                   | ✅ Yes           | Template for new developers         |

## 🚀 Usage

### The 3 Environment Cases

1. **Local Next.js + Cloud Supabase** (Default)

   ```bash
   npm run dev        # Uses .env
   npm run build      # Uses .env
   npm start          # Uses .env
   ```

2. **Local Next.js + Local Supabase** (Docker)

   ```bash
   npm run dev:local    # Uses .env.docker
   npm run build:local  # Uses .env.docker
   npm run start:local  # Uses .env.docker
   ```

3. **Vercel Next.js + Cloud Supabase** (Production)
   ```bash
   npm run build:prod   # Uses .env.production
   npm run start:prod   # Uses .env.production
   ```

## 🔧 How It Works

The system uses simple environment file loading:

- **Default**: Uses `.env` for local development with cloud Supabase
- **Local Docker**: Uses `.env.docker` which is loaded explicitly
- **Production**: Uses `.env.production` for Vercel deployment

The `:local` scripts use `dotenv-cli` to explicitly load `.env.local`.

## 🏗️ Setup for New Developers

1. **For Local Docker Supabase development:**

   ```bash
   cp .env.example .env.docker
   # Edit .env.docker with your local Docker Supabase values
   npm run dev:local
   ```

2. **For Cloud Supabase development (default):**
   ```bash
   # No setup needed - uses .env
   npm run dev
   ```

## 🔄 Switching Between Environments

### From Cloud to Local Docker

```bash
npm run dev:local
```

### From Local Docker to Cloud

```bash
npm run dev
```

## 📝 Environment Variables Priority

- **Default**: `.env` values are used
- **Local Docker**: `.env.docker` loaded explicitly via dotenv-cli
- **Production**: `.env.production` overrides `.env` values

## 🔒 Security Notes

- `.env.local` is never committed to git (contains personal/local configs)
- Production secrets should be managed via deployment platform (Vercel, etc.)
- Test keys are safe to commit in `.env.defaults`

## 🛠️ Troubleshooting

### Environment not loading correctly?

1. Check file names are exact (case-sensitive)
2. Verify `.env.local` exists for local development
3. Check for syntax errors in env files (no spaces around `=`)

### Variables not updating?

1. Restart the development server
2. Clear Next.js cache: `rm -rf .next`
3. Check variable names have correct prefixes (`NEXT_PUBLIC_` for client-side)

## 📋 Simple and Clean

This simplified system provides:

- ✅ Easy switching between 3 specific environments
- ✅ No complex file manipulation
- ✅ Clear separation of concerns
- ✅ Standard Next.js environment handling
