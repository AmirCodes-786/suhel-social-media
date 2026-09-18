# 🚀 VibeHub Production Deployment Guide (Node.js & React)

> [!CAUTION]
> **NEVER commit real credentials to this file or any tracked file.**
> All secrets must be configured exclusively through your hosting dashboard's
> Environment Variables panel (Render, Vercel, etc.).
>
> If credentials were previously committed to Git history, they should be
> considered compromised and rotated immediately.

---

## Step 1: Update Backend Service on Render

Your backend is a modern **Node.js Express & MongoDB** application.

1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click on your existing Web Service (`suhel-social-media` / `vibehub-backend`).
3. Go to the **Settings** tab:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Go to the **Environment** tab and set these Environment Variables:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `<your-mongodb-atlas-connection-string>` |
| `JWT_SECRET` | `<your-jwt-secret-at-least-32-characters>` |
| `JWT_EXPIRES_IN` | `7d` |
| `SUPABASE_JWT_SECRET` | `<your-supabase-jwt-secret>` |
| `CLOUDINARY_CLOUD_NAME` | `<your-cloudinary-cloud-name>` |
| `CLOUDINARY_API_KEY` | `<your-cloudinary-api-key>` |
| `CLOUDINARY_API_SECRET` | `<your-cloudinary-api-secret>` |
| `CORS_ORIGIN` | `https://your-frontend-domain.vercel.app,http://localhost:5173` |

5. Click **Save Changes** → Click **Manual Deploy** → **Deploy latest commit**.

---

## Step 2: Update Vercel Frontend Configuration

1. Go to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Select your frontend project.
3. Go to **Settings** → **Environment Variables**:
   - `VITE_API_URL` = `https://your-render-backend.onrender.com`
4. Trigger a **Redeploy** on Vercel so the frontend picks up the new bundle.

---

### 🎉 Result
Your Node.js backend on Render will now handle all API endpoints (`/api/posts`, `/api/users`, `/api/stories`, `/api/chat`, etc.) and connect directly to MongoDB Atlas.
