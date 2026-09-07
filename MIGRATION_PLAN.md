# 🗺️ VibeHub Backend Migration Plan: Django/Python → Node.js/Express/MongoDB (MERN)

## 1. Executive Summary

This document specifies the migration plan to completely replace the Django/Python backend in `vibehub_backend` with a modern, production-ready Node.js + Express + MongoDB backend in `backend/`, ensuring 100% preservation of business logic, database relationships, API compatibility, authentication behavior, and frontend integration.

---

## 2. Django → MERN Architecture Mapping

| Django / Python Component | MERN Equivalent Component | Location / File |
| :--- | :--- | :--- |
| **Project Configuration** | `backend/src/config/index.js`, `.env` | Centralized env configuration via `dotenv` |
| **Server & App Setup** | `backend/src/server.js`, `backend/src/app.js` | Express app, HTTP server, graceful shutdown |
| **Database ORM** | Mongoose (`backend/src/config/db.js`) | MongoDB connection with auto-reconnect, indexing |
| **`users.models.User` & `Profile`** | `User` & `Profile` Mongoose Schemas | `backend/src/models/User.js`, `backend/src/models/Profile.js` |
| **`users.models.Follow`** | `Follow` Mongoose Schema | `backend/src/models/Follow.js` (compound index `[follower, following]`) |
| **`posts.models.Post`** | `Post` Mongoose Schema | `backend/src/models/Post.js` |
| **`posts.models.Like`** | `Like` Mongoose Schema | `backend/src/models/Like.js` (compound index `[user, post]`) |
| **`posts.models.Comment`** | `Comment` Mongoose Schema | `backend/src/models/Comment.js` (self-referencing `parent`) |
| **`posts.models.SavedPost`** | `SavedPost` Mongoose Schema | `backend/src/models/SavedPost.js` (compound index `[user, post]`) |
| **`chat.models.Conversation`** | `Conversation` Mongoose Schema | `backend/src/models/Conversation.js` |
| **`chat.models.Message`** | `Message` Mongoose Schema | `backend/src/models/Message.js` |
| **`notifications.models.Notification`** | `Notification` Mongoose Schema | `backend/src/models/Notification.js` |
| **`stories.models.Story`** | `Story` Mongoose Schema | `backend/src/models/Story.js` (with `expires_at` index) |
| **`stories.models.StoryViewer`** | `StoryViewer` Mongoose Schema | `backend/src/models/StoryViewer.js` (compound index `[story, viewer]`) |
| **`users.authentication.SupabaseAuthentication`** | Express Auth Middleware | `backend/src/middleware/auth.js` (dual support: native JWT + Supabase JWT) |
| **DRF Serializers** | Schema Validators & DTO Formatters | `backend/src/validators/` & `backend/src/utils/formatters.js` |
| **Views / ViewSets** | Express Controllers | `backend/src/controllers/` |
| **Django URLs** | Express Routers | `backend/src/routes/` |
| **File / Media Storage** | Multer + Cloudinary / Local Disk | `backend/src/middleware/upload.js` |
| **Security Middleware** | Helmet, CORS, Express Rate Limit, Mongo Sanitize | `backend/src/middleware/` |
| **Centralized Error Handling** | Error Middleware | `backend/src/middleware/errorHandler.js` |
| **Testing** | Jest + Supertest + `mongodb-memory-server` | `backend/tests/` |

---

## 3. Database Modeling & Relationships (MongoDB)

### 3.1 `User` and `Profile`
- **User Schema**:
  - `_id`: String / UUID (to preserve existing Supabase/Django UUIDs or standard ObjectIds)
  - `username`: String, unique, lowercase, trimmed, indexed
  - `email`: String, unique, lowercase, trimmed, indexed
  - `password`: String (hashed with bcrypt, selected: false)
  - `first_name`: String, default ''
  - `last_name`: String, default ''
  - `createdAt`, `updatedAt`: Timestamps
- **Profile Schema** (One-to-One):
  - `user`: Reference to `User` (`_id`), unique, indexed
  - `bio`: String, max 500, default ''
  - `profile_picture`: String (URL), default null
  - `cover_picture`: String (URL), default null
  - `website`: String, default ''
  - `location`: String, default ''
  - `createdAt`, `updatedAt`: Timestamps

### 3.2 `Follow`
- Fields: `follower` (ref User), `following` (ref User), `createdAt`
- Index: `{ follower: 1, following: 1 }` with `unique: true`

### 3.3 `Post`
- Fields: `author` (ref User), `content` (String), `media` (String), `media_type` (`'text' | 'image' | 'video'`), `createdAt`, `updatedAt`
- Index: `{ createdAt: -1 }`, `{ author: 1, createdAt: -1 }`

### 3.4 `Like`
- Fields: `user` (ref User), `post` (ref Post), `createdAt`
- Index: `{ user: 1, post: 1 }` with `unique: true`

### 3.5 `Comment`
- Fields: `post` (ref Post), `author` (ref User), `content` (String), `parent` (ref Comment, nullable), `createdAt`
- Index: `{ post: 1, parent: 1, createdAt: 1 }`

### 3.6 `SavedPost`
- Fields: `user` (ref User), `post` (ref Post), `createdAt`
- Index: `{ user: 1, post: 1 }` with `unique: true`

### 3.7 `Conversation` & `Message`
- **Conversation**:
  - `participants`: Array of `User` references
  - `createdAt`, `updatedAt`: Timestamps
- **Message**:
  - `conversation`: ref `Conversation`
  - `sender`: ref `User`
  - `content`: String
  - `media`: String
  - `media_type`: `'text' | 'image'`
  - `is_read`: Boolean, default false
  - `createdAt`: Timestamp

### 3.8 `Notification`
- Fields: `recipient` (ref User), `sender` (ref User), `type` (`'follow' | 'like' | 'comment' | 'message' | 'mention'`), `post` (ref Post, optional), `comment` (ref Comment, optional), `is_read` (Boolean), `createdAt`
- Index: `{ recipient: 1, is_read: 1, createdAt: -1 }`

### 3.9 `Story` & `StoryViewer`
- **Story**: `author` (ref User), `media` (String), `media_type` (`'image' | 'video'`), `createdAt`, `expires_at` (TTL index)
- **StoryViewer**: `story` (ref Story), `viewer` (ref User), `createdAt`. Unique index on `{ story: 1, viewer: 1 }`.

---

## 4. API Endpoints Specification

### 4.1 Authentication & Profile (`/api/users` & `/api/auth`)
- `POST /api/auth/register` → Register new user (email, username, password, first_name, last_name)
- `POST /api/auth/login` → Login with email/password, returns JWT + user profile
- `GET /api/users/me/` → Current authenticated user profile + counts
- `PUT/PATCH /api/users/me/` → Update profile + standard fields
- `GET /api/users/search/?q=` → User search by username / first_name / last_name
- `GET /api/users/suggestions/` → Creator suggestions (unfollowed users)
- `GET /api/users/:username/` → User profile by username
- `POST /api/users/:username/follow/` → Toggle follow / unfollow
- `GET /api/users/:username/followers/` → List followers
- `GET /api/users/:username/following/` → List following

### 4.2 Posts (`/api/posts`)
- `GET /api/posts/` → List posts
- `POST /api/posts/` → Create post (multipart file or JSON)
- `GET /api/posts/feed/` → Following feed + self
- `GET /api/posts/trending/` → Trending posts (7-day engagement)
- `GET /api/posts/saved/` → Saved posts of current user
- `GET /api/posts/user/:username/` → Posts by username
- `GET /api/posts/:id/` → Single post detail
- `PUT/PATCH /api/posts/:id/` → Update post (author only)
- `DELETE /api/posts/:id/` → Delete post (author only)
- `POST /api/posts/:id/like/` → Toggle like
- `POST /api/posts/:id/save/` → Toggle save
- `GET /api/posts/:postId/comments/` → Comments list with nested replies
- `POST /api/posts/:postId/comments/` → Create comment or reply

### 4.3 Chat (`/api/chat`)
- `GET /api/chat/conversations/` → User's conversations list with last message and unread count
- `POST /api/chat/conversations/` → Create or retrieve existing 1-on-1 conversation
- `GET /api/chat/conversations/:id/` → Conversation detail
- `DELETE /api/chat/conversations/:id/` → Delete conversation
- `GET /api/chat/conversations/:id/messages/` → Messages in conversation
- `POST /api/chat/conversations/:id/messages/` → Send message + trigger notification
- `POST /api/chat/conversations/:id/read/` → Mark conversation messages read

### 4.4 Notifications (`/api/notifications`)
- `GET /api/notifications/` → List notifications
- `POST /api/notifications/` → Mark all notifications read
- `GET /api/notifications/unread-count/` → Count unread notifications
- `POST /api/notifications/:id/read/` → Mark single notification read

### 4.5 Stories (`/api/stories`)
- `GET /api/stories/` → Story feed grouped by author (self first)
- `POST /api/stories/` → Create story (media required, 24h expiration)
- `POST /api/stories/:id/view/` → Mark story viewed
- `GET /api/stories/:id/viewers/` → Viewers list (author only)

### 4.6 Health & Observability
- `GET /health` → Server status, uptime, MongoDB connection state

---

## 5. Security & Middleware Architecture
- **Helmet**: Secure HTTP response headers
- **CORS**: Configured with credentials and allowed origins from environment
- **Express Rate Limit**: Rate limiting on sensitive endpoints (e.g. `/api/auth/login`)
- **Centralized Error Handler**: Uniform error JSON format, hides stack traces in production
- **Dual Authentication**: Accepts either native Bearer JWT or Supabase JWT tokens
- **Input Validation**: Schema checks for all mutation payloads
- **Cloudinary / Disk Storage**: Safe file uploading with MIME type checking

---

## 6. Migration & Verification Strategy
1. Construct the complete `backend/` application directory with modular code: `config`, `models`, `controllers`, `routes`, `services`, `middleware`, `validators`.
2. Provide database migration scripts in `backend/scripts/` to export SQLite/Postgres data to MongoDB.
3. Write automated unit and integration tests covering auth, users, posts, chat, notifications, stories.
4. Adapt the React frontend's service layer to connect to the Express REST backend, verifying login, feed, profile, post creation, comments, likes, chat, stories, and notifications.
5. Once all tests pass and verification is confirmed, cleanly retire Django backend files.
