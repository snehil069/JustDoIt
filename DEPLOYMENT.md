# SpeakUp — Supabase & Vercel Deployment Guide

This guide walks you through connecting **Supabase** (for cloud database persistence and audio storage) and deploying **SpeakUp** on **Vercel**.

---

## Part 1: Setting Up Supabase (Database & Audio Storage)

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, select an organization, name it `SpeakUp`, and choose your preferred database region.
3. Save your database password and wait ~1 minute for the project to provision.

### 2. Run the Database Schema Migration
1. In your Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open [`supabase/schema.sql`](./supabase/schema.sql) from this repository, copy its entire contents, paste it into the editor, and click **Run**.
4. This automatically creates:
   - `public.practice_sessions`: Stores all speech transcripts, metrics, and evaluation reports.
   - `public.user_progress`: Aggregates streaks, scores, speaking time, and category breakdowns.
   - `storage.buckets`: Creates a public storage bucket named `speakup-audio` for `.webm` recordings.
   - Row Level Security (RLS) policies allowing public guest and authenticated access.

### 3. Copy Your Supabase API Credentials
1. Go to **Project Settings** (gear icon) -> **API**.
2. Copy the following two values:
   - **Project URL** (e.g. `https://xyzproject.supabase.co`)
   - **Project API Keys** -> `anon` `public` key (e.g. `eyJhbGciOi...`)

---

## Part 2: Deploying Frontend on Vercel

The frontend is built with React 18, Vite, TypeScript, and Tailwind CSS. It is pre-configured with [`vercel.json`](./vercel.json) for 1-click deployments.

### Option A: Via Vercel Web Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new) and log in with GitHub.
2. Select and import your GitHub repository: `snehil069/JustDoIt`.
3. In the **Configure Project** screen:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (or select `client` if deploying frontend-only)
   - **Build Command:** `npm run build --prefix client` (automatically set by `vercel.json`)
   - **Output Directory:** `client/dist` (automatically set by `vercel.json`)
4. Expand the **Environment Variables** section and add:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Click **Deploy**. Vercel will build and launch your application globally.

---

## Part 3: Architecture & Live Audio Streaming in Production

SpeakUp is designed to be resilient in serverless environments:

### 1. Zero-Config Browser Web Speech (Default on Vercel)
- When deployed on Vercel, SpeakUp works out-of-the-box using the browser's native **Web Speech API** in Chrome, Edge, and Brave.
- Evaluation runs against the Google Gemini API with Supabase cloud archiving. No separate server is required!

### 2. Deepgram Nova-2 Live Streaming Relay (Optional)
- Deepgram real-time live streaming requires a persistent WebSocket server (`ws://`).
- Vercel functions are serverless and do not support long-lived persistent WebSocket connections.
- If you wish to use Deepgram Live WebSocket relay in production:
  1. Deploy the `server/` folder to a WebSocket-friendly platform like **Render**, **Railway**, or **Fly.io** (1-click Node.js app).
  2. In your Vercel Dashboard, add:
     ```env
     VITE_API_URL=https://your-server.up.railway.app
     VITE_WS_URL=wss://your-server.up.railway.app/ws
     ```
  3. SpeakUp will automatically route real-time audio through your dedicated WebSocket relay while maintaining the Vercel global CDN for the UI.

---

## Part 4: Local Testing with Supabase

To test Supabase locally before deploying:
1. Add your Supabase credentials to your local `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
2. Open SpeakUp in your browser (`http://localhost:5173`).
3. Go to **Settings** -> check the **Cloud Database & Audio Storage (Supabase)** card to see the `Active (Supabase PostgreSQL)` confirmation badge.
