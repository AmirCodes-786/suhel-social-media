# 🚀 VibeHub Production Deployment Guide

Deploying a full-stack app with React, Django, and Supabase can seem tricky because they need each other's URLs. 

We solve this **"chicken-and-egg"** problem simply by doing it in **3 steps**:
1. **Deploy Backend (Render)** → Copy your Render URL.
2. **Deploy Frontend (Vercel)** → Use your Render URL, then copy your Vercel URL.
3. **Connect & Secure (Supabase & Render)** → Paste the Vercel URL into Supabase and Render to complete the loop.

---

## Step 1: Deploy Django Backend on Render

Deploying the backend first allows us to generate a live backend URL.

### 1. Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New** -> **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `vibehub-backend` (or similar)
   - **Root Directory**: `vibehub_backend`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn vibehub_backend.wsgi:application`

### 2. Set Environment Variables
Add these variables in Render under the **Environment** tab:
* `DJANGO_SECRET_KEY` = `some-very-long-random-string-here`
* `DJANGO_DEBUG` = `False`
* `ALLOWED_HOSTS` = `*` *(We'll restrict this in Step 3)*
* `DATABASE_URL` = `postgresql://...` *(Your Supabase Connection Pooler Session Mode String — do NOT use the direct connection string, as Render does not support IPv6)*
* `SUPABASE_JWT_SECRET` = `...` *(Your Supabase JWT Secret)*
* `CORS_ALLOW_ALL_ORIGINS` = `True` *(Allows our frontend to connect during initial deploy)*

### 3. Deploy and Copy URL
* Click **Deploy Web Service**.
* Wait a minute. Once deployed, copy your live backend URL from the top of the Render screen (e.g. `https://vibehub-backend.onrender.com`).

---

## Step 2: Deploy React Frontend on Vercel

Now we deploy the frontend and point it to our new live backend.

### 1. Import Project
1. Go to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
2. Import your Git repository.
3. Configure the settings:
   - **Root Directory**: Select `vibehub_frontend`
   - **Framework Preset**: `Vite` (automatically detected)

### 2. Set Environment Variables
Add these variables in the Vercel project configuration before clicking Deploy:
* `VITE_API_URL` = `https://vibehub-backend.onrender.com` *(The Render URL from Step 1)*
* `VITE_SUPABASE_URL` = `https://tjyrrdhzpslrwkacvhki.supabase.co` *(Your Supabase Project URL)*
* `VITE_SUPABASE_ANON_KEY` = `...` *(Your Supabase Anon Key)*

### 3. Deploy and Copy URL
* Click **Deploy**.
* Once the deployment is complete, Vercel will show your live site. Copy the main Vercel URL (e.g. `https://vibehub-app.vercel.app`).

---

## Step 3: Link Them Together (Final Security Setup)

Now that you have both live URLs, we connect and secure the app.

### 1. Configure Supabase Redirects (Auth)
To allow users to log in/sign up on the production site:
1. Go to your [Supabase Dashboard](https://supabase.com/).
2. Select your project, then go to **Authentication** (sidebar) -> **URL Configuration**.
3. Under **Site URL**, paste your Vercel URL: `https://vibehub-app.vercel.app`
4. Under **Redirect URLs**, add your Vercel URL: `https://vibehub-app.vercel.app`

### 2. Secure Django CORS (Render)
To prevent unauthorized domains from calling your API:
1. Go back to your Web Service on Render -> **Environment** tab.
2. Edit/Add these environment variables:
   - `CORS_ALLOW_ALL_ORIGINS` = `False`
   - `CORS_ALLOWED_ORIGINS` = `https://vibehub-app.vercel.app` *(Your Vercel URL)*
   - `ALLOWED_HOSTS` = `vibehub-backend.onrender.com` *(Your Render URL without the `https://` prefix)*
3. Save changes. Render will automatically apply the changes and restart.

---

### 🎉 Done! Your full-stack application is live and secure.
