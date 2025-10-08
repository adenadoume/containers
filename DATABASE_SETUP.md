# Database & AI Integration Guide

## 🗄️ Database Options for Container Planning App

### Option 1: Vercel + PostgreSQL (Recommended)
**Best for:** Production-ready, scalable apps

**Setup:**
1. **Vercel Postgres** (Powered by Neon)
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and link project
   vercel login
   vercel link
   
   # Add Vercel Postgres
   vercel postgres create
   ```

2. **Install dependencies:**
   ```bash
   npm install @vercel/postgres
   npm install dotenv
   ```

3. **Database Schema:**
   ```sql
   CREATE TABLE containers (
     id SERIAL PRIMARY KEY,
     name VARCHAR(50) UNIQUE NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE container_items (
     id SERIAL PRIMARY KEY,
     container_id INTEGER REFERENCES containers(id) ON DELETE CASCADE,
     reference_code VARCHAR(50),
     supplier TEXT,
     product TEXT,
     cbm DECIMAL(10,2) DEFAULT 0,
     cartons INTEGER DEFAULT 0,
     gross_weight DECIMAL(10,2) DEFAULT 0,
     product_cost DECIMAL(10,2) DEFAULT 0,
     freight_cost DECIMAL(10,2) DEFAULT 0,
     client TEXT,
     status VARCHAR(50) DEFAULT 'Pending',
     awaiting VARCHAR(50) DEFAULT '-',
     packing_list_url TEXT,
     commercial_invoice_url TEXT,
     payment_url TEXT,
     hbl_url TEXT,
     certificates_url TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX idx_container_items_container ON container_items(container_id);
   ```

### Option 2: Supabase (Free tier, easy to start)
**Best for:** Quick setup with built-in authentication

1. **Create account:** https://supabase.com
2. **Install client:**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Use the same SQL schema above in Supabase SQL editor**

### Option 3: Firebase (Google)
**Best for:** Real-time updates, Google ecosystem

```bash
npm install firebase
```

### Option 4: MongoDB Atlas (NoSQL)
**Best for:** Flexible schema, document-based

```bash
npm install mongodb mongoose
```

---

## 🤖 AI Integration for Email Parsing

### Option 1: OpenAI GPT-4 (Recommended)
**Most accurate, best for complex emails**

**Cost:** ~$0.03 per email parsing (GPT-4)

**Setup:**
```bash
npm install openai
```

**Environment variables (.env):**
```env
OPENAI_API_KEY=sk-...your-key...
DATABASE_URL=postgres://...
```

### Option 2: Anthropic Claude
**Alternative to OpenAI, great for document parsing**

```bash
npm install @anthropic-ai/sdk
```

### Option 3: Local LLM (Free but requires setup)
**Options:** Ollama with Llama 3, Mistral, etc.
- Free but needs local installation
- Good for privacy-sensitive data

---

## 🏗️ Architecture Recommendation

```
Frontend (React/Vite)
    ↓
API Routes (Vercel Serverless Functions)
    ↓
Database (Vercel Postgres) + AI (OpenAI API)
```

**Benefits:**
- Serverless = no server management
- Automatic scaling
- Pay only for what you use
- Built-in CDN and SSL

---

## 📝 Implementation Steps

1. **Create API folder structure:**
   ```
   /api
     /containers
       - [id].ts       (GET, PUT, DELETE single container)
       - index.ts      (GET all, POST new)
     /items
       - [id].ts       (CRUD operations)
       - index.ts
     /ai
       - parse-email.ts (AI email parsing endpoint)
   ```

2. **Add file upload to Vercel Blob Storage:**
   ```bash
   npm install @vercel/blob
   ```

3. **Implement AI parsing endpoint**

4. **Update frontend to call API endpoints**

---

## 🔒 Security Considerations

1. **Environment Variables:** Never commit API keys
2. **Authentication:** Add user login (NextAuth, Clerk, or Supabase Auth)
3. **Rate Limiting:** Protect AI endpoints from abuse
4. **CORS:** Configure allowed origins
5. **Input Validation:** Sanitize all user inputs

---

## 💰 Cost Estimates (Monthly)

**Small Operation (100 containers, 1000 items):**
- Vercel Postgres: Free tier (256MB) → $0
- Vercel hosting: Free tier → $0
- OpenAI API: ~50 emails/month → $1.50
- Vercel Blob (file storage): 1GB → Free tier
**Total: ~$1.50/month**

**Medium Operation (1000 containers, 10k items):**
- Vercel Postgres: $20/month
- Vercel hosting: Pro plan $20/month (if needed)
- OpenAI API: ~500 emails/month → $15
- Vercel Blob: 10GB → $5
**Total: ~$60/month**

---

## 🚀 Quick Start: Minimal Working Example

See the following files:
- `/api/examples/` - API route examples
- `/src/services/` - Frontend service examples
- `/src/components/AIEmailParser.tsx` - AI parsing UI component

