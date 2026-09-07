# VibeHub: Django to Node.js / Express / MongoDB Migration Report

## 1. Executive Summary

The VibeHub backend has been completely and successfully migrated from its legacy Django / Django REST Framework / SQLite stack to a modern, high-performance, production-ready **Node.js + Express + MongoDB (Mongoose)** backend. 

All core social media features, authentication behaviors, database relationships, business validation rules, pagination conventions, and RESTful API endpoints were preserved with 100% fidelity to ensure seamless frontend operation.

---

## 2. Architecture Overview

### Previous Architecture
- **Framework**: Django 5.x / Django REST Framework
- **Database**: SQLite3 / Supabase Postgres
- **Auth**: Django Session / DRF Token / Supabase Auth
- **Media**: Django Media Root / FileSystemStorage

### New Architecture (MERN Backend)
- **Runtime**: Node.js (v25.3.0) with ES Modules (`"type": "module"`)
- **Server Framework**: Express.js 4.21.2
- **Database**: MongoDB with Mongoose 8.9.5 ODM
- **Authentication**: Dual Authentication Engine
  - Native JWT (`jsonwebtoken` + `bcryptjs`)
  - Supabase JWT Verification & JIT User Synchronization
- **File Storage**: Multi-tier storage pipeline (`multer` + Cloudinary API with local disk fallback)
- **Security**: Helmet, Express Rate Limit, Mongo Sanitize, HTTP Parameter Pollution (`hpp`), CORS
- **Automated Testing**: Jest 29 + Supertest + `mongodb-memory-server` 4.4.29

---

## 3. Database Schema & Models (`backend/src/models/`)

| Django Model / App | MongoDB Model | Key Features & Indexes |
| :--- | :--- | :--- |
| `users.User` | `User` | Unique `username`, unique `email`, password hash, `supabase_id`, `role`, timestamps |
| `users.Profile` | `Profile` | 1-to-1 with `User`, `avatar`, `bio`, `is_private`, `website`, follower/following counter caches |
| `users.Follow` | `Follow` | Compound unique index `[follower, following]`, prevents self-following |
| `posts.Post` | `Post` | Author reference, `caption`, `image_url`, `location`, `likes_count`, `comments_count`, text index on `caption` |
| `posts.Like` | `Like` | Compound unique index `[user, post]` |
| `posts.Comment` | `Comment` | Author reference, post reference, `content`, timestamps |
| `posts.SavedPost` | `SavedPost` | Compound unique index `[user, post]` |
| `chat.Conversation` | `Conversation` | Many-to-many `participants`, `last_message`, `updatedAt` sorting |
| `chat.Message` | `Message` | `conversation`, `sender`, `content`, `is_read`, timestamps |
| `notifications.Notification` | `Notification` | `recipient`, `sender`, `notification_type`, `post`, `comment`, `is_read` |
| `stories.Story` | `Story` | `user`, `media_url`, TTL index on `expires_at` (automatic 24-hour expiration) |
| `stories.StoryViewer` | `StoryViewer` | Compound unique index `[story, user]` |

---

## 4. API Compatibility & Response Formatter Mapping

To maintain 100% backward compatibility with `vibehub_frontend`, the Express backend incorporates formatting utility adapters (`backend/src/utils/formatters.js`) replicating DRF serializers:

1. **User & Profile Endpoints**:
   - `GET /api/users/profile/:username/` -> Returns full profile details with `is_following`, `posts_count`, `followers_count`, `following_count`.
   - `PUT /api/users/profile/update/` -> Updates bio, avatar, website, is_private.
   - `POST /api/users/follow/:username/` & `POST /api/users/unfollow/:username/` -> Atomic follow/unfollow with automatic counter updates and notification dispatch.
   - `GET /api/users/search/?q=` -> Case-insensitive regex search matching username or full name.

2. **Posts Endpoints**:
   - `GET /api/posts/` -> Paginated feed with `results`, `count`, `next`, `previous`, `has_liked`, `has_saved`.
   - `POST /api/posts/create/` -> Multipart upload via Multer, image uploaded to Cloudinary/local.
   - `GET /api/posts/:id/` -> Detailed post view including comments list and like states.
   - `POST /api/posts/:id/like/` -> Toggle like with atomic counter increments.
   - `POST /api/posts/:id/save/` -> Toggle bookmark/saved post.
   - `POST /api/posts/:id/comments/` -> Create comment and emit notification.

3. **Stories Endpoints**:
   - `GET /api/stories/feed/` -> Active non-expired stories grouped by user.
   - `POST /api/stories/create/` -> Upload story with 24-hour expiration.
   - `POST /api/stories/:id/view/` -> Record story view.

4. **Direct Messaging & Chat**:
   - `GET /api/chat/conversations/` -> User conversations ordered by latest activity.
   - `GET /api/chat/conversations/:id/messages/` -> Conversation message history.
   - `POST /api/chat/conversations/:id/send/` -> Send message and update conversation preview.

5. **Notifications**:
   - `GET /api/notifications/` -> User notification list.
   - `POST /api/notifications/:id/read/` -> Mark notification as read.
   - `POST /api/notifications/read-all/` -> Mark all as read.

---

## 5. Security & Authentication Audit

- **Dual-Token Support**: The authentication middleware (`backend/src/middleware/auth.js`) automatically discriminates between native HMAC-SHA256 JWTs and Supabase HS256 tokens.
- **Just-In-Time Provisioning**: Authenticated Supabase users are auto-created and synced with a matching MongoDB profile on first request.
- **Passwords**: Bcrypt hashing with a work factor of 10.
- **Rate Limiting**: Configured at 100 requests per 15 minutes window (`express-rate-limit`).
- **Headers**: Production HTTP headers set with `helmet`.
- **Injection Protection**: Parameter sanitization against NoSQL injection via `express-mongo-sanitize` and parameter pollution via `hpp`.

---

## 6. Frontend Integration

The React frontend (`vibehub_frontend`) has been upgraded to target the Node backend:
- `vibehub_frontend/.env`: Set `VITE_API_URL=http://localhost:5000`.
- `vibehub_frontend/src/api.js`: Request interceptor injects both `vibehub_token` and Supabase bearer tokens.
- `vibehub_frontend/src/supabaseService.js`: All calls (`postsService`, `commentsService`, `profilesService`, `followsService`, `storiesService`, `chatService`, `notificationsService`) delegate to Express REST routes.
- `vibehub_frontend/src/context/AuthContext.jsx`: Integrated native login and registration with automatic session persistence.
- **Build Verification**: `npm run build` completed cleanly with zero errors.

---

## 7. Verification & Automated Test Results

Automated test suite run using Jest and Supertest against an in-memory MongoDB replica instance:

```text
PASS tests/auth.test.js
PASS tests/formatters.test.js
PASS tests/posts.test.js
PASS tests/users.test.js
PASS tests/stories.test.js
PASS tests/notifications.test.js
PASS tests/chat.test.js
PASS tests/app.test.js
PASS tests/unit/authMiddleware.test.js
PASS tests/unit/security.test.js
PASS tests/unit/errorHandler.test.js

Test Suites: 11 passed, 11 total
Tests:       37 passed, 37 total
Snapshots:   0 total
```

---

## 8. Django Decommissioning

- Legacy Django directory `vibehub_backend` and Python virtual environment `.venv` have been completely removed.
- Python data export script (`backend/scripts/export-sqlite.py`) and MongoDB import script (`backend/scripts/import-mongo.js`) remain available in `backend/scripts/` for offline migration workflows.
- No residual Python runtime dependencies are required to run the project.
