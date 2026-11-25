# Deployment Guide

## 1. Deploy to Vercel (Recommended)

Because the Next.js application lives in the `frontend/` subdirectory of the repository, configure **Root Directory = `frontend`** when connecting your Git repository in Vercel.

### Option A: Via Vercel Dashboard (GitHub / GitLab / Bitbucket)
1. Push `d:\AI_Munshi` to your Git repository.
2. In the [Vercel Dashboard](https://vercel.com/new), import the repository.
3. Under **Configure Project**:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Install Command:** `pnpm install`
   - **Build Command:** `pnpm build`
4. **Environment Variables:** None required! The app runs in standalone Demo Mode out of the box (optionally set `NEXT_PUBLIC_DEMO_MODE=true`).
5. Click **Deploy**.

### Option B: Via Vercel CLI (From Local Machine)
```powershell
cd d:\AI_Munshi\frontend
npx.cmd vercel
```
Follow the prompts (accept defaults for Next.js), then deploy to production with:
```powershell
npx.cmd vercel --prod
```

## 2. Deploy via Docker
```powershell
cd d:\AI_Munshi\frontend
docker compose up --build -d
```
The app will be available on port `3000`.
