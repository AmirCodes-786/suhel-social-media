# 🚀 VibeHub - Full-Stack Modern Social Media Platform

> A production-ready, high-performance, and fully responsive full-stack social networking platform engineered with **React 19**, **Vite**, **Tailwind CSS v4**, **TanStack Query v5**, **Express.js**, **MongoDB**, **JWT Authentication**, and **Supabase**.

---

## 📌 1. Project Overview & Architecture

**VibeHub** is a production-grade social platform designed for fluid social discovery, media sharing, and real-time interaction. It combines modern frontend engineering with a modular backend to provide high throughput, zero unnecessary refetches, and rich multimedia experiences.

### 🌟 Key Highlights & Architectural Upgrades

1. **Tab-Switch Feed Stability:**
   - Eliminated the common bug where switching browser tabs and returning triggered an unnecessary feed reload/skeleton flash.
   - Built with stable user session IDs and intelligent token-refresh listeners that bypass redundant profile re-fetches.
2. **Real-Duration Video Stories:**
   - Stories dynamically detect video metadata duration (supporting videos of any duration instead of an arbitrary 5-second cutoff).
   - Audio is preserved and played, with an intuitive sound toggle, volume memory, and autoplay policy handling with an unmute pill.
   - Restrictive playback prevents unauthorized downloading (`nodownload`, `noremoteplayback`, disabled PiP, and context-menu prevention).
3. **Custom Glassmorphism Video Player (`VibeVideoPlayer`):**
   - Replaced default browser video controls with a sleek, themed video player.
   - Features custom play/pause overlay, scrubbable progress bar with buffered range indicators, elapsed/total time display, volume slider, 0.5x–2x playback speed control, fullscreen toggle, and keyboard shortcuts (`Space`, `M`, `F`).
4. **Interactive Photo Lightbox (`MediaViewerModal`):**
   - Seamless expand/full-view experience for photos across the feed, profiles, and chat messages.
   - Includes pan-and-drag navigation, multi-level zoom (1x to 4x), double-click zoom toggle, Escape key listener, and body scroll locking.
5. **Zero-Flash System-Wide Dark Mode:**
   - Centralized `ThemeContext` providing immediate `<head>` inline script theme resolution (`localStorage.getItem('vibehub_theme')`).
   - Styled with Tailwind CSS v4 `@custom-variant dark` across Feed, Explore, Profile, Messages, Notifications, Settings, Drawers, and Skeletons.
6. **Zero-Cost Client-Side Stale-While-Revalidate Caching:**
   - Integrated `@tanstack/react-query` v5 with user-isolated queries (`['feed', userId]`, `['stories', userId]`, `['suggestions', userId]`).
   - Configured with `staleTime: 60s`, `gcTime: 10m`, and `refetchOnWindowFocus: false`.
   - Optimistic mutations for likes, bookmarks, and deletions ensure instantaneous UI feedback.

---

## ✨ 2. Complete Feature Set

- 🔐 **Dual Auth Architecture:**
  - Native JWT Authentication (`jsonwebtoken` + `bcryptjs`) with protected Express routes.
  - Supabase Auth integration with seamless Google OAuth support and automatic fallback.
- 📰 **Social Feed & Content Creation:**
  - Create rich posts with text, images, and videos.
  - Custom video playback with glassmorphism controls.
  - Photo expand lightbox on hover/click.
  - Instant optimistic likes and saves (bookmarks) without network delay.
  - Interactive comment drawer and real-time counter updates.
- ⏱️ **24-Hour Ephemeral Stories:**
  - Support for image and video stories with creator avatar rings.
  - Real-duration video playback with native audio and unmute banner.
  - Auto-advance on video completion or timer expiry.
  - Download restrictions applied across the story interface.
- 💬 **Direct Messaging / Chat:**
  - 1-on-1 private messaging with friends and followed creators.
  - Image attachments with lightbox view.
  - Integrated emoji picker with dark mode support.
  - Optimistic message delivery and unread message counters.
- 👤 **Customizable User Profiles:**
  - Profile avatar and cover photo customization with lightbox zoom.
  - Interactive Follow/Unfollow counters and follower/following modal drawers.
  - Dedicated tabs for uploaded posts and bookmarked vibes.
- 🔍 **Live Search & Explore:**
  - Debounced user search matching usernames and full names.
  - Trending vibes compiled by engagement.
- 🔔 **Activity Notifications:**
  - Notifications for likes, comments, follows, and direct messages.
  - One-click "Mark all as read" and unread badges.
- ⚙️ **User Settings:**
  - Visual Theme Switcher (Light Mode & Dark Mode).
  - Profile edit drawer for updating bio, website, location, avatar, and cover.

---

## 🛠️ 3. Technology Stack

### Frontend
- **Framework:** React 19 (Vite 8)
- **Styling:** Tailwind CSS v4 & Custom CSS Design Tokens
- **State & Data Fetching:** `@tanstack/react-query` v5, React Context API
- **Animations:** Framer Motion 12
- **Icons:** Lucide React
- **Media Experience:** Custom HTML5 Video Architecture, Canvas Lightbox
- **3D Graphics:** Three.js (Interactive login background canvas)
- **Routing:** React Router DOM 7
- **HTTP Client:** Axios & Supabase JS SDK

### Backend
- **Runtime:** Node.js (ES Modules)
- **Web Framework:** Express.js 4
- **Database:** MongoDB via Mongoose ODM 8
- **Authentication:** JSON Web Tokens (JWT), Bcrypt.js, Supabase Auth Fallback
- **Media Uploads:** Multer with Cloudinary integration
- **Security:** Helmet, Express Rate Limit, CORS Whitelisting, Mongo Sanitization
- **Testing:** Jest, Supertest, In-Memory MongoDB Server (`mongodb-memory-server`)

---

## 📂 4. Repository Structure

```text
suhel-social-media/
├── backend/
│   ├── src/
│   │   ├── config/             # DB & Cloudinary configs (db.js, cloudinary.js)
│   │   ├── controllers/        # Route controllers (auth, posts, stories, chat, etc.)
│   │   ├── middleware/         # Auth verification, upload, error handling, security
│   │   ├── models/             # Mongoose schemas (User, Post, Story, Message, etc.)
│   │   ├── routes/             # REST API routes
│   │   ├── utils/              # Data formatters, serializers, and helpers
│   │   ├── app.js              # Express app initialization & middleware stack
│   │   └── server.js           # Server bootstrap & MongoDB connection
│   ├── tests/                  # Jest test suites (37 automated tests)
│   └── package.json            # Backend scripts and dependencies
│
├── vibehub_frontend/
│   ├── src/
│   │   ├── assets/             # Brand logos and graphic assets
│   │   ├── components/         # Reusable UI components
│   │   │   ├── VibeVideoPlayer.jsx       # Custom glassmorphism video player
│   │   │   ├── MediaViewerModal.jsx      # High-res photo lightbox with zoom/pan
│   │   │   ├── StoryViewerModal.jsx      # Dynamic duration video/photo story player
│   │   │   ├── PostCard.jsx              # Feed post card with media & optimistic cache
│   │   │   ├── StoriesBar.jsx            # Stories strip with active user rings
│   │   │   ├── Sidebar.jsx               # Responsive navigation sidebar
│   │   │   ├── CreatePostModal.jsx       # Post & Story creator modal
│   │   │   ├── EditProfileDrawer.jsx     # Profile edit drawer
│   │   │   ├── FollowersFollowingModal.jsx# Follower/following list modal
│   │   │   ├── ConfirmationModal.jsx     # Confirmation dialogs
│   │   │   └── FeedSkeleton.jsx          # Shimmer loading skeleton (Dark & Light)
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx           # User session, JWT & Supabase auth state
│   │   │   ├── ThemeContext.jsx          # Dark / Light mode provider & sync
│   │   │   └── QueryProvider.jsx         # TanStack Query client & cache mutation helpers
│   │   ├── pages/              # Application routes
│   │   │   ├── Feed.jsx                  # Main feed with cached posts & stories
│   │   │   ├── Explore.jsx               # Discovery and user search
│   │   │   ├── Profile.jsx               # User profiles with lightbox integration
│   │   │   ├── Messages.jsx              # Real-time direct messaging interface
│   │   │   ├── Notifications.jsx         # User notification center
│   │   │   ├── Settings.jsx              # Settings and visual theme cards
│   │   │   ├── PostDetail.jsx            # Single post permalink view
│   │   │   ├── Login.jsx                 # Login with Three.js backdrop
│   │   │   └── Signup.jsx                # Signup view
│   │   ├── services/           # Axios API services
│   │   ├── supabaseClient.js   # Supabase client instance
│   │   ├── supabaseService.js  # Dual-mode API adapter (REST + Supabase)
│   │   ├── App.jsx             # Router layout & providers
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind v4 variant & theme styling
│   ├── index.html              # HTML shell with zero-flash theme script
│   ├── vite.config.js          # Vite config with manual chunk splitting
│   └── package.json            # Frontend scripts and dependencies
│
└── README.md                   # Full application documentation
```

---

## 📡 5. Backend REST API Reference

All backend API routes are prefixed with `/api`. Protected routes require a valid `Bearer <token>` in the `Authorization` header.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |

### 📰 Posts (`/api/posts`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/posts/feed` | Get customized chronological feed | Yes |
| `GET` | `/api/posts/trending` | Get trending posts by engagement | Yes |
| `GET` | `/api/posts/saved` | Get authenticated user's saved posts | Yes |
| `GET` | `/api/posts/user/:username` | Get posts created by a specific user | Yes |
| `GET` | `/api/posts/:id` | Get single post detail by ID | Yes |
| `POST` | `/api/posts` | Create new post (supports multipart media) | Yes |
| `PUT` | `/api/posts/:id` | Update post caption | Yes |
| `DELETE`| `/api/posts/:id` | Delete post and associated media | Yes |
| `POST` | `/api/posts/:id/like` | Like or unlike a post | Yes |
| `POST` | `/api/posts/:id/save` | Bookmark or unbookmark a post | Yes |
| `POST` | `/api/posts/:id/comments` | Add comment to a post | Yes |
| `DELETE`| `/api/posts/:id/comments/:commentId` | Delete comment from post | Yes |

### ⏱️ Stories (`/api/stories`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/stories/feed` | Get active 24h stories from followed users | Yes |
| `GET` | `/api/stories/user/:userId` | Get active stories of a specific user | Yes |
| `POST` | `/api/stories` | Upload new photo or video story | Yes |
| `DELETE`| `/api/stories/:id` | Delete a story | Yes |

### 👤 Users & Profiles (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/users/profile/:username` | Get public profile data | Yes |
| `PUT` | `/api/users/profile` | Update profile details (bio, website, avatars) | Yes |
| `POST` | `/api/users/:id/follow` | Follow or unfollow a user | Yes |
| `GET` | `/api/users/:username/followers` | Get user's followers | Yes |
| `GET` | `/api/users/:username/following` | Get user's following list | Yes |
| `GET` | `/api/users/search?q=...` | Search users by query | Yes |
| `GET` | `/api/users/suggestions` | Get suggested accounts to follow | Yes |

### 💬 Chat & Direct Messaging (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/chat/conversations` | Get user's conversation threads | Yes |
| `GET` | `/api/chat/conversations/:id/messages` | Get message history for conversation | Yes |
| `POST` | `/api/chat/conversations` | Create or fetch conversation with a user | Yes |
| `POST` | `/api/chat/conversations/:id/messages` | Send direct message (text and/or image) | Yes |
| `PUT` | `/api/chat/conversations/:id/read` | Mark conversation as read | Yes |
| `DELETE`| `/api/chat/messages/:id` | Delete a message | Yes |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/notifications` | Get user's notifications | Yes |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read | Yes |
| `PUT` | `/api/notifications/:id/read` | Mark individual notification as read | Yes |

---

## ⚙️ 6. Environment Variables Configuration

### 1. Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:

```env
# Server Port & Environment
PORT=5000
NODE_ENV=development

# Frontend Client Address (for CORS whitelist)
CLIENT_URL=http://localhost:5173

# MongoDB Connection String (Atlas or Local)
MONGO_URI=mongodb://localhost:27017/vibehub
# Atlas example:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/vibehub?retryWrites=true&w=majority

# JWT Token Secret & Expiration
JWT_SECRET=your-jwt-secret-at-least-32-characters-long
JWT_EXPIRE=7d

# Cloudinary Storage Credentials (Optional: cloud media hosting)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Frontend (`vibehub_frontend/.env`)
Create a `.env` file in the `vibehub_frontend/` directory:

```env
# Backend REST API endpoint
VITE_API_BASE_URL=http://localhost:5000/api

# Supabase Auth & Realtime (Optional fallback)
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🚀 7. Running the Application Locally

### Prerequisites
- **Node.js**: `v18.0.0` or higher (LTS recommended)
- **MongoDB**: Local MongoDB community service running or MongoDB Atlas connection string
- **npm**: `v9.0.0` or higher

### Step 1: Install Dependencies
Open your terminal and install dependencies in both folders:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../vibehub_frontend
npm install
```

### Step 2: Start the Backend Server
```bash
cd backend
npm run dev
```
- The Express server starts on **`http://localhost:5000`**.
- Health check route: `http://localhost:5000/health`.

### Step 3: Start the Frontend Client
In a separate terminal window:
```bash
cd vibehub_frontend
npm run dev
```
- Vite starts the dev server at **`http://localhost:5173`**.
- Open `http://localhost:5173` in your browser to experience VibeHub!

---

## 🧪 8. Automated Testing

The backend includes a comprehensive test suite executed with Jest and Supertest against an isolated in-memory MongoDB server:

```bash
cd backend
npm test
```

Test coverage includes:
- Authentication & JWT validation (`auth.test.js`, `authMiddleware.test.js`)
- Posts, likes, comments, bookmarks, and pagination (`posts.test.js`)
- 24-hour Stories lifecycle (`stories.test.js`)
- User profiles and follow dynamics (`users.test.js`)
- Direct messaging & conversations (`chat.test.js`)
- Notifications dispatch and read state (`notifications.test.js`)
- Security middleware and rate limiting (`security.test.js`)
- Global error handling and formatting (`errorHandler.test.js`)

---

## 📦 9. Production Build & Deployment

### 1. Build the Frontend Bundle
```bash
cd vibehub_frontend
npm run build
```
Vite outputs minified, tree-shaken chunks into `vibehub_frontend/dist/`.

### 2. Frontend Deployment (Vercel / Netlify)
- **Root Directory:** `vibehub_frontend`
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_BASE_URL` pointing to your deployed backend (e.g. `https://api.vibehub.example.com/api`).

### 3. Backend Deployment (Render / Railway / Fly.io)
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node src/server.js`
- **Environment Variables:** Set `NODE_ENV=production`, `PORT=5000`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend domain), and Cloudinary keys.

---

## 🔧 10. Troubleshooting & FAQ

### Q: Why don't feeds reload when I leave and come back to the tab?
**A:** This is intentional. VibeHub uses TanStack Query caching (`staleTime: 60s`, `refetchOnWindowFocus: false`) and stable user references in `AuthContext` to prevent disruptive background refetches and skeleton flashes.

### Q: How do Story videos play their full duration?
**A:** `StoryViewerModal` inspects the media's `onLoadedMetadata` event to extract the exact floating-point video duration and syncs the progress bar to `timeupdate` events, advancing cleanly when the video ends (`onEnded`).

### Q: How is audio handled in Stories?
**A:** Story videos preserve original audio tracks. If browser autoplay restrictions mute the video upon entry, a user-friendly "Tap to Unmute" pill badge appears, respecting the user's audio preference (`vibehub_story_muted`).

### Q: Why can't users download videos directly from the UI?
**A:** All video elements feature `controlsList="nodownload nofullscreen noremoteplayback"`, `disablePictureInPicture`, and context-menu prevention (`onContextMenu={(e) => e.preventDefault()}`) to keep the media experience native and secure.

---

## 📄 License
This project is licensed under the MIT License.
