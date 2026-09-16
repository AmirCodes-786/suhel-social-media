# 🚀 VibeHub - Full-Stack Modern Social Media Platform

> A production-ready, high-performance, and fully responsive Full-Stack Social Media Application built with the modern **MERN** stack (MongoDB, Express.js, React, Node.js) and Vite.

---

## 📌 1. Project Title & Overview

**VibeHub** is a feature-rich, full-stack social networking web application engineered for modern social interactions. It features rich feed browsing, multimedia posts, 24-hour ephemeral stories, user follow/unfollow dynamics, direct messaging, real-time-ready notifications, interactive comments, and full profile customization.

### 🎯 Who is this for?
- 🎓 **Students & Beginners:** Learn production-level MERN stack development, modular REST API architecture, secure JWT authentication, and clean component state management.
- 💻 **Developers & Freelancers:** Skip hundreds of hours of repetitive boilerplate setup and launch customized social, community, or niche networking platforms for clients.
- 🚀 **Startups & Entrepreneurs:** Use as an out-of-the-box Minimum Viable Product (MVP) ready to scale, customize, and deploy.

---

## ✨ 2. Key Features

- 🔐 **Secure Authentication & Authorization:**
  - Complete user registration and login with encrypted password hashing (`bcryptjs`).
  - Secure stateless JWT (`jsonwebtoken`) token-based authorization.
  - Route guards for private pages and API endpoint protection.
- 📱 **Modern & Responsive UI/UX:**
  - Mobile-first, tablet, and desktop-optimized design.
  - Smooth transitions and interactive micro-animations powered by Tailwind CSS & Framer Motion.
  - Dark & light mode aesthetic with glassmorphism elements.
- 📰 **Interactive Social Feed:**
  - Create, view, edit, and delete rich media posts with text and image uploads.
  - Like/unlike posts instantly with live counter updates.
  - Threaded comment system with timestamp formatting.
  - Save/bookmark favorite posts for later reading.
- ⏱️ **Stories (24-Hour Ephemeral Content):**
  - Post and view photo stories with automatic 24-hour expiration.
  - Story viewer with user status indicators.
- 💬 **Direct Messaging / Chat System:**
  - 1-on-1 private conversations and messaging interface.
  - Chat history and conversation list.
- 🔔 **Real-Time Style Notifications:**
  - Instant activity notifications for likes, follows, comments, and messages.
  - One-click mark as read and unread counter badges.
- 👤 **Comprehensive User Profiles:**
  - Customizable profile photos (avatars) and bio descriptions.
  - Follower and following counters with user relationship tracking.
  - Dedicated tabs for user posts, saved items, and media uploads.
- 🔍 **Search & Discovery:**
  - Search users by username, name, or profile keywords.
- 🛡️ **Production-Grade Backend Security:**
  - Rate limiting against brute-force attacks (`express-rate-limit`).
  - Security headers using `helmet`.
  - CORS whitelisting and payload size limits.

---

## 🛠️ 3. Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS & Modern CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Interactive Elements:** Emoji Picker React, Three.js

### Backend
- **Environment:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **File Uploads:** Multer with Cloudinary integration
- **Security & Utilities:** Helmet, Express Rate Limit, Morgan, Compression, CORS
- **Testing:** Jest, Supertest, In-Memory MongoDB Server

---

## 📋 4. Requirements Before Running

Ensure the following tools are installed on your system before proceeding:

1. **Node.js**: `v18.0.0` or higher (LTS recommended) 👉 [Download Node.js](https://nodejs.org/)
2. **npm**: `v9.0.0` or higher (installed automatically with Node.js)
3. **MongoDB**:
   - **Option A (Cloud - Recommended):** Free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account and connection string.
   - **Option B (Local):** [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed and running locally on `mongodb://localhost:27017`.
4. **Git**: Installed for version control 👉 [Download Git](https://git-scm.com/)
5. **Code Editor**: [VS Code](https://code.visualstudio.com/) (recommended)

---

## 📥 5. Installation Steps (Step-by-Step)

### Step 1: Extract & Open the Project
1. Download the project zip archive and extract it on your computer.
2. Open **VS Code**, go to **File > Open Folder...**, and select the project root folder.

### Step 2: Open Terminal
In VS Code, press ``Ctrl + ` `` (Windows) or ``Cmd + ` `` (Mac) to open the integrated terminal.

### Step 3: Install Dependencies
> 💡 *Note: The `node_modules` folder is excluded from the source files to keep the download fast and lightweight. It will be installed automatically by npm.*

#### 1. Install Backend Dependencies:
```bash
cd backend
npm install
```

#### 2. Install Frontend Dependencies:
```bash
cd ../vibehub_frontend
npm install
```

---

## ⚙️ 6. Environment Variables Setup

For security reasons, `.env` files containing private credentials and API keys are not included in the source package. You need to create your own configuration files.

### 1. Backend Environment Configuration
Navigate to the `backend/` directory and create a new file named `.env`:

```bash
# Inside backend/ folder
# Create a .env file and paste the following:
```

```env
# Server Settings
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection (MongoDB Atlas or Local)
MONGO_URI=mongodb://localhost:27017/vibehub
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/vibehub?retryWrites=true&w=majority

# JWT Authentication Secret
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Cloudinary Storage (Optional: for cloud image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Frontend Environment Configuration
Navigate to the `vibehub_frontend/` directory and create a new file named `.env`:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 7. Running the Project Locally

Run the backend and frontend simultaneously in two separate terminals.

### Terminal 1: Start Backend Server
```bash
cd backend
npm run dev
```
- Server starts at: `http://localhost:5000`
- Health check endpoint: `http://localhost:5000/health`

### Terminal 2: Start Frontend Client
```bash
cd vibehub_frontend
npm run dev
```
- Client application runs at: `http://localhost:5173`

Open your web browser and navigate to **`http://localhost:5173`** to access VibeHub!

---

## 📦 8. Build Instructions (Production)

When you are ready to prepare the frontend for production deployment:

```bash
cd vibehub_frontend
npm run build
```

- This command will compile and bundle your React application into the `vibehub_frontend/dist/` directory.
- The `dist/` folder contains minified HTML, CSS, and JavaScript ready to be hosted on any static hosting provider.
- You can preview your production build locally with:
  ```bash
  npm run preview
  ```

---

## 🎨 9. Customization & Editing Guide

This codebase is clean and modular, making it effortless to customize:

| What to Customize | File / Location | Description |
| :--- | :--- | :--- |
| **API Keys & Database** | `backend/.env` & `vibehub_frontend/.env` | Update your database connection string, JWT secrets, and port numbers. |
| **App Branding & Logo** | `vibehub_frontend/src/components/Sidebar.jsx` & `index.html` | Change the application name, logo, page title, and meta descriptions. |
| **Theme Colors & Styles** | `vibehub_frontend/src/index.css` | Customize color palettes, glassmorphism filters, gradients, and font families. |
| **Static Images & Icons** | `vibehub_frontend/src/assets/` or `public/` | Replace default avatars, placeholders, favicons, and branding assets. |
| **UI Texts & Pages** | `vibehub_frontend/src/pages/` | Edit page texts, layouts, and copy for Feed, Profile, Chat, Notifications, etc. |
| **API Routes & Models** | `backend/src/controllers/` & `backend/src/models/` | Add custom fields to User, Post, Comment, or Story schemas and extend business logic. |

---

## 📂 10. Folder Structure Overview

```text
├── backend/                       # Express & Node.js Backend
│   ├── scripts/                   # Database seed and migration scripts
│   ├── src/
│   │   ├── config/                # MongoDB and Cloudinary configurations
│   │   ├── controllers/           # Business logic (auth, user, post, story, chat, etc.)
│   │   ├── middleware/            # Auth guard, error handlers, upload middleware
│   │   ├── models/                # Mongoose database models (User, Post, Story, etc.)
│   │   ├── routes/                # Express API route endpoints
│   │   ├── utils/                 # Helper utilities and serializers
│   │   └── server.js              # Application entry point
│   ├── tests/                     # Automated Jest and Supertest test suites
│   └── package.json               # Backend dependencies and scripts
│
├── vibehub_frontend/              # React 19 + Vite Frontend
│   ├── public/                    # Static assets & favicon
│   ├── src/
│   │   ├── assets/                # Images, icons, and illustrations
│   │   ├── components/            # Reusable UI components (Sidebar, PostCard, Modal, etc.)
│   │   ├── context/               # Global state providers (Auth, Theme)
│   │   ├── pages/                 # Application views (Feed, Profile, Chat, Notifications)
│   │   ├── services/              # Axios API clients and helper services
│   │   ├── App.jsx                # Route declarations and root layout
│   │   ├── main.jsx               # React DOM entry point
│   │   └── index.css              # Global styles & Tailwind configuration
│   ├── index.html                 # HTML template
│   ├── vite.config.js             # Vite configuration
│   └── package.json               # Frontend dependencies and scripts
│
└── README.md                      # Project documentation
```

---

## 🌐 11. Deployment Guide

### 1. Database Deployment (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free Shared Cluster.
2. In **Database Access**, create a user with read and write privileges.
3. In **Network Access**, add `0.0.0.0/0` (allow access from anywhere) to allow your cloud server to connect.
4. Click **Connect > Drivers**, copy the connection string, and set it as `MONGO_URI`.

### 2. Backend Deployment (Render / Railway)
1. Push your code to a GitHub repository.
2. Log in to [Render](https://render.com) or [Railway](https://railway.app) and create a new **Web Service**.
3. Select your repository and set the root directory to `backend`.
4. Build command: `npm install`
5. Start command: `node src/server.js`
6. Add your Environment Variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, etc.) in the dashboard settings.

### 3. Frontend Deployment (Vercel / Netlify)
1. Log in to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) and import your repository.
2. Set the Root Directory to `vibehub_frontend`.
3. Framework Preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Under Environment Variables, add `VITE_API_BASE_URL` pointing to your deployed backend URL (e.g., `https://your-backend.onrender.com/api`).
7. Deploy!

---

## 🔧 12. Troubleshooting Section

### ❌ Issue 1: `npm install` fails with dependency errors
- **Solution:** Clear your npm cache and retry using legacy peer dependency resolution:
  ```bash
  npm cache clean --force
  npm install --legacy-peer-deps
  ```

### ❌ Issue 2: `Error: listen EADDRINUSE: address already in use :::5000`
- **Solution:** Port 5000 is occupied by another application. You can either close that application or change the port in `backend/.env`:
  ```env
  PORT=5001
  ```
  *(Remember to update `VITE_API_BASE_URL` in the frontend `.env` to match!)*

### ❌ Issue 3: MongoDB connection failure (`MongooseServerSelectionError`)
- **Solution:**
  - If using local MongoDB, ensure MongoDB service is active.
  - If using MongoDB Atlas, check that your current IP is whitelisted under **Network Access** (`0.0.0.0/0`).
  - Check that your database username and password in `MONGO_URI` are correct and special characters are URL-encoded.

### ❌ Issue 4: CORS errors in browser console
- **Solution:** Ensure `CLIENT_URL` in `backend/.env` strictly matches your frontend address (default: `http://localhost:5173`).

---

## ⚠️ 13. Important Security & Usage Notice

- 🔒 **No Secrets Included:** For security and distribution integrity, secret API keys, credentials, and `node_modules` folders are **not** bundled in this source code package.
- 🔑 **Configuration Required:** You must create your `.env` files and supply your own MongoDB connection string and JWT secret before running the project.

---

## 💬 14. Contact & Support

Thank you for downloading/purchasing this project! If you need assistance, find a bug, or want custom features built:

- 📧 **Support Email:** `your-email@example.com`
- 🌐 **Website / Portfolio:** `https://yourwebsite.com`
- 💬 **Discord / Telegram:** `@yourusername`

---
⭐ *If you love this project, please consider giving it a star on GitHub or a 5-star review on the marketplace!*
