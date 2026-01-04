# DRD Fitness - Deployment Guide

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Vercel       │     │    Railway      │     │  Neon Postgres  │
│   (Frontend)    │────▶│    (Backend)    │────▶│   (Database)    │
│   React/Vite    │     │  Express API    │     │   Free Tier     │
│     FREE        │     │   ~$5/month     │     │      FREE       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Step 1: Set Up Neon Postgres (Database)

1. Go to [neon.tech](https://neon.tech) and sign up (free)
2. Create a new project called "drd-fitness"
3. Copy your connection string - it looks like:
   ```
   postgresql://username:password@ep-xxxxx.region.neon.tech/neondb?sslmode=require
   ```
4. Save this - you'll need it for Railway

---

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub and select this repository
4. Once deployed, go to **Settings** → **Variables** and add:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | `https://your-app.vercel.app` (add after Vercel deploy) |

5. Railway will auto-detect the `Procfile` and run `npm run start`
6. Copy your Railway URL (e.g., `https://drd-fitness.up.railway.app`)

---

## Step 3: Push Database Schema

Before the app works, you need to create the database tables:

```bash
# Set your DATABASE_URL locally
export DATABASE_URL="postgresql://..."

# Push the schema to Neon
npm run db:push
```

Or use Railway CLI to run it in their environment.

---

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New" → "Project" → Import from GitHub
3. Select this repository
4. Configure the build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave empty)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`

5. Add Environment Variable:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-app.up.railway.app` |

6. Click Deploy!

---

## Step 5: Update Railway with Vercel URL

Go back to Railway and update the `FRONTEND_URL` variable with your Vercel URL.
This allows CORS to work properly.

---

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Neon `DATABASE_URL`

3. Run:
   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:5000

---

## Costs

| Service | Cost |
|---------|------|
| Vercel | FREE (hobby tier) |
| Railway | ~$5/month (usage-based) |
| Neon | FREE (0.5 GB storage) |
| **Total** | **~$5/month** |

---

## Custom Domain (Optional)

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS as instructed

### Railway (API)
1. Go to Service Settings → Networking → Custom Domain
2. Add `api.yourdomain.com`
3. Update `VITE_API_URL` in Vercel to use the new domain

---

## Troubleshooting

### "Cannot connect to database"
- Check your `DATABASE_URL` is correct
- Ensure `?sslmode=require` is at the end

### "CORS error"
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Include the full URL with `https://`

### "API not found"
- Check `VITE_API_URL` in Vercel includes the Railway URL
- Do NOT include `/api` at the end - that's added automatically
