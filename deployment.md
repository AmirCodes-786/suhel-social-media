# 🚀 VibeHub Production Deployment Guide (Node.js & React)

---

## Step 1: Update Backend Service on Render

Your backend is now a modern **Node.js Express & MongoDB** application.

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
| `MONGODB_URI` | `mongodb://sohelmessi786_db_user:7kX7cf6RtzAUtQd1@ac-t7iikdc-shard-00-00.ym7hpak.mongodb.net:27017,ac-t7iikdc-shard-00-01.ym7hpak.mongodb.net:27017,ac-t7iikdc-shard-00-02.ym7hpak.mongodb.net:27017/vibehub?ssl=true&replicaSet=atlas-13usnq-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | `vibehub-super-secret-jwt-token-key-2026-production` |
| `JWT_EXPIRES_IN` | `7d` |
| `SUPABASE_JWT_SECRET` | `1bca2065-63e6-42a4-b1a8-3890ad578671` |
| `CLOUDINARY_CLOUD_NAME` | `dzly2px6w` |
| `CLOUDINARY_API_KEY` | `529899488976199` |
| `CLOUDINARY_API_SECRET` | `i--pZ5jQCF7JF1Qu2knN8kPaZFE` |
| `CORS_ORIGIN` | `https://demolition-boyz-vibehub.vercel.app,http://localhost:5173` |

5. Click **Save Changes** → Click **Manual Deploy** → **Deploy latest commit**.

---

## Step 2: Update Vercel Frontend Configuration

1. Go to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Select your `demolition-boyz-vibehub` project.
3. Go to **Settings** → **Environment Variables**:
   - `VITE_API_URL` = `https://suhel-social-media.onrender.com`
4. Trigger a **Redeploy** on Vercel so the frontend picks up the new bundle.

---

### 🎉 Result
Your Node.js backend on Render will now handle all API endpoints (`/api/posts`, `/api/users`, `/api/stories`, `/api/chat`, etc.) and connect directly to MongoDB Atlas.
