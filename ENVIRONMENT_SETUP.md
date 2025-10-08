# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in your project root with these variables:

### Database (Vercel Postgres)
```env
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

### AI API (OpenAI)
```env
OPENAI_API_KEY="sk-..."
```

### File Storage (Vercel Blob)
```env
BLOB_READ_WRITE_TOKEN="..."
```

### Frontend
```env
VITE_API_URL="/api"
```

---

## Setup Steps

### 1. Create Vercel Account & Project
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link
```

### 2. Add Vercel Postgres
```bash
# In Vercel dashboard:
# Storage → Create → Postgres
# Or use CLI:
vercel postgres create
```

Copy the environment variables to your `.env` file

### 3. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Add to `.env` as `OPENAI_API_KEY`

### 4. Add Vercel Blob Storage (for file uploads)
```bash
# In Vercel dashboard:
# Storage → Create → Blob
# Or use CLI:
vercel blob create
```

### 5. Initialize Database Schema
```bash
# Option 1: Using Vercel Postgres Query Editor
# Copy the SQL from DATABASE_SETUP.md and run it

# Option 2: Using a migration tool (recommended)
npm install drizzle-orm drizzle-kit
# Then create schema files and run migrations
```

---

## Local Development

### Install Dependencies
```bash
npm install @vercel/postgres openai @vercel/blob
```

### Run Vercel Dev Server
```bash
# This runs your project with Vercel Functions locally
vercel dev
```

This will:
- Start the Vite dev server
- Enable API routes at `/api/*`
- Connect to your Vercel Postgres database
- Use your environment variables

---

## Deployment

### Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Or use GitHub integration (recommended):
# 1. Push to GitHub
# 2. Import in Vercel dashboard
# 3. Auto-deploys on every push to main
```

### Set Environment Variables in Vercel
```bash
# Add each variable via CLI:
vercel env add OPENAI_API_KEY

# Or in Vercel Dashboard:
# Settings → Environment Variables
```

---

## Security Notes

⚠️ **NEVER commit `.env` to git!**

Add to `.gitignore`:
```gitignore
.env
.env.local
.env.production
```

✅ Only commit `.env.example` with placeholder values

