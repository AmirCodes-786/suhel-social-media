# 🚀 VibeHub Backend (Node.js + Express + MongoDB)

Production-grade, modular, high-performance REST API backend replacing the previous Django/Python backend for VibeHub.

## 📁 Architecture Overview

```text
backend/
├── src/
│   ├── config/             # Centralized configuration & DB connection
│   ├── controllers/        # Express request handlers
│   ├── middleware/         # Auth (dual JWT/Supabase), security, upload, error handler
│   ├── models/             # Mongoose schemas & indexes
│   ├── routes/             # REST route definitions
│   ├── services/           # Storage (Cloudinary/disk), notifications
│   ├── utils/              # Output formatters preserving DRF serializers
│   ├── app.js              # Express application configuration
│   └── server.js           # Server startup & graceful shutdown
├── scripts/
│   ├── export-sqlite.py    # Extracts SQLite database tables to JSON
│   ├── import-mongo.js     # Ingests JSON records into MongoDB
│   └── seed.js             # Seeds demo data for development
├── tests/                  # Automated Jest + Supertest test suite
├── .env.example
├── package.json
└── README.md
```

## 🛠️ Prerequisites

- **Node.js**: v18 or newer (tested on Node v25)
- **npm**: v9 or newer
- **MongoDB**: Local MongoDB community server (e.g. `mongodb://localhost:27017/vibehub`) or MongoDB Atlas connection string.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your variables:
```bash
cp .env.example .env
```

Key environment variables:
- `PORT`: HTTP port (default: `5000`)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for native JWT tokens
- `SUPABASE_JWT_SECRET`: Optional Supabase JWT secret for backward compatibility
- `CLOUDINARY_*`: Cloudinary credentials (optional; falls back to local disk storage)
- `CORS_ORIGIN`: Allowed origins for frontend access

### 3. Seed Demo Data (Optional)
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Run Tests
The test suite utilizes `mongodb-memory-server` and runs self-contained without needing an external database:
```bash
npm test
```

## 🔐 Authentication
The backend supports **Dual Authentication**:
1. **Native JWT**: User registers or logs in via `/api/auth/register` or `/api/auth/login`. Returns Bearer JWT.
2. **Supabase JWT**: Accepts tokens issued by Supabase Auth (`Authorization: Bearer <supabase_token>`). Automatically verifies the token and synchronizes/retrieves the user profile in MongoDB.

## 📡 API Endpoints Summary

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- **Users**: `/api/users/me/`, `/api/users/:username/`, `/api/users/:username/follow/`, `/api/users/search/`, `/api/users/suggestions/`
- **Posts**: `/api/posts/`, `/api/posts/feed/`, `/api/posts/trending/`, `/api/posts/saved/`, `/api/posts/:id/like/`, `/api/posts/:id/save/`, `/api/posts/:id/comments/`
- **Chat**: `/api/chat/conversations/`, `/api/chat/conversations/:id/messages/`, `/api/chat/conversations/:id/read/`
- **Notifications**: `/api/notifications/`, `/api/notifications/unread-count/`, `/api/notifications/:id/read/`
- **Stories**: `/api/stories/`, `/api/stories/:id/view/`, `/api/stories/:id/viewers/`
- **Health**: `/health`
