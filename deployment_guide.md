# Nuvia Step-by-Step Deployment Guide

This guide walks you through deploying Nuvia for free using a modern, reliable stack:
1. **Frontend (Vite/React)**: Deployed to **Vercel**.
2. **Backend (FastAPI/Python)**: Deployed to **Render**.
3. **Database (Vector Search)**: Hosted on **Qdrant Cloud** (or using Nuvia's automatic fallback demo mode).

---

## Step 1: Deploy the Vector Database (Qdrant Cloud)

While Nuvia can run in demo mode without Qdrant, a production deployment should use a live vector database.

1. Sign up at [Qdrant Cloud Console](https://cloud.qdrant.io).
2. Create a **Free Tier Cluster** (1 GB storage, 0.5 vCPU—fully free, no credit card required).
3. Once the cluster is created, copy:
   * **API URL** (looks like `https://xxxxxx.gcp.qdrant.tech:6333`).
   * **API Key** (generate a read-write API key from the dashboard).

---

## Step 2: Deploy the Backend API (Render)

Render is excellent for hosting Python web apps.

1. Go to [Render](https://render.com) and log in using your GitHub account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository `Dakshchandia/Nuvia`.
4. Configure the Web Service settings:
   * **Name**: `nuvia-backend`
   * **Region**: Select the region closest to you (e.g., Singapore or Oregon).
   * **Branch**: `main`
   * **Root Directory**: `backend` (Important: this tells Render to run within the backend folder).
   * **Runtime**: `Python`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: `Free`
5. Click **Advanced** to add **Environment Variables** (matching your `.env` settings):
   * `CORS_ORIGINS`: Set to your future Vercel frontend URL (or `*` temporarily, e.g., `https://nuvia-frontend.vercel.app`).
   * `QDRANT_URL`: The API URL from Step 1.
   * `QDRANT_API_KEY`: The API Key from Step 1.
   * `QDRANT_COLLECTION`: `nuvia_memories`
   * `AI_API_KEY`: Your Gemini API key.
   * `AI_BASE_URL`: `https://generativelanguage.googleapis.com/v1beta/openai`
   * `AI_MODEL`: `gemini-2.0-flash`
   * `RIME_API_KEY`: (Optional) Your Rime TTS API Key.
6. Click **Create Web Service**. 
   * *Note: Render's free tier services spin down after 15 minutes of inactivity and take ~50 seconds to warm up on the first request.*

---

## Step 3: Deploy the Frontend (Vercel)

Vercel is the fastest platform for deploying Vite/React frontends.

1. Sign up/log in at [Vercel](https://vercel.com) using your GitHub account.
2. Click **Add New** → **Project**.
3. Import your GitHub repository `Dakshchandia/Nuvia`.
4. Configure the project settings:
   * **Framework Preset**: `Vite` (automatically detected).
   * **Root Directory**: `frontend` (Important: click Edit and select `frontend`).
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Under **Environment Variables**, add the API pointer:
   * **Name**: `VITE_API_URL`
   * **Value**: Set this to your Render service URL (e.g., `https://nuvia-backend.onrender.com`—copy it from your Render dashboard).
6. Click **Deploy**.
7. Once deployed, copy your custom Vercel URL (e.g., `https://nuvia-xxxx.vercel.app`).

---

## Step 4: Final Linkage (CORS Update)

Now that you have your live frontend URL from Vercel:

1. Go back to your [Render Dashboard](https://dashboard.render.com).
2. Select your `nuvia-backend` service.
3. Navigate to **Environment** settings.
4. Update the `CORS_ORIGINS` variable:
   * Change it to: `https://your-vercel-app-url.vercel.app` (do not include a trailing slash `/`).
5. Save changes. Render will automatically redeploy the backend with the correct CORS permissions.

---

## Step 5: Test Your Live App

1. Open your Vercel frontend URL in a browser.
2. Open the browser's Developer Tools Console (`F12`) to verify there are no CORS blocks.
3. Tap the microphone orb, speak a health query (e.g., in Hindi/English/Hinglish), and verify that Nuvia parses, remembers, and replies contextually!
