# 🚀 VibeHub From-Scratch Deployment Guide

If you are deleting your previous deployments on Vercel and Render and starting completely fresh, follow these steps exactly in order.

> [!CAUTION]
> **NEVER commit real credentials to this file or any tracked file.** All secrets must be configured exclusively through your hosting dashboard's Environment Variables panel.

---

## Phase 1: Deploy the Backend (Render)

We must deploy the backend first so we know what its final URL will be.

1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. **Delete** your existing VibeHub Web Service if you haven't already.
3. Click **New +** > **Web Service**.
4. Connect your GitHub repository (`suhel-social-media`).
5. Configure the service:
   - **Name**: `vibehub-backend-v2` (or whatever you prefer)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Scroll down to **Environment Variables** and add the following keys:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = *(Your exact MongoDB Atlas connection string: `mongodb+srv://...`)*
   - `JWT_SECRET` = *(Any random long string, e.g. `my-super-secret-key-12345`)*
   - `JWT_EXPIRES_IN` = `7d` *(Optional, default is 7d)*
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app` *(or comma-separated list of allowed domains)*
   - `SUPABASE_JWT_SECRET` = *(Optional, found in Supabase Dashboard > Project Settings > API > JWT Settings)*
   - `CLOUDINARY_CLOUD_NAME` = *(Optional, for cloud media storage)*
   - `CLOUDINARY_API_KEY` = *(Optional, for cloud media storage)*
   - `CLOUDINARY_API_SECRET` = *(Optional, for cloud media storage)*
7. Click **Create Web Service**.
8. Wait for it to finish building and say **"Live"**.
9. **CRITICAL:** Copy the URL Render gives you at the top left (e.g., `https://vibehub-backend-v2.onrender.com`). **Save this URL for Phase 2.**

---

## Phase 2: Deploy the Frontend (Vercel)

Now that your backend is alive and we know its URL, we can deploy the frontend.

1. Go to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. **Delete** your existing VibeHub frontend project if you haven't already (Settings > General > scroll to bottom > Delete).
3. Click **Add New...** > **Project**.
4. Import your GitHub repository (`suhel-social-media`).
5. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `vibehub_frontend`
6. Open the **Environment Variables** dropdown and add these keys:
   - `VITE_API_URL` = *(Paste the Render URL from Phase 1 here! Do NOT include a trailing slash. Example: `https://vibehub-backend-v2.onrender.com`)*
   - `VITE_SUPABASE_URL` = *(Your Supabase Project URL)*
   - `VITE_SUPABASE_ANON_KEY` = *(Your Supabase anon public key)*
7. Click **Deploy**.
8. Wait for the build to finish.

---

## Phase 3: Final Verification

1. Click on the URL Vercel gives you to open your new live site.
2. Open Chrome Developer Tools (F12) > **Console** tab just in case.
3. Log in to your account.
4. Your Feed, Explore, and Profile should now instantly populate with your data!
