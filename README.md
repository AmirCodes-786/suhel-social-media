# VibeHub - Modern Social Media Platform

A full-stack social media application built with the **MERN** stack (MongoDB, Express.js, React.js, Node.js).

Formerly migrated from Django to a high-performance Express/Node.js backend with MongoDB.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose ODM
- **Authentication**: Native JWT (`jsonwebtoken` + `bcryptjs`) + Supabase Auth compatibility
- **File Uploads**: Multer with Cloudinary API and local filesystem fallback
- **Security**: Helmet, Express Rate Limit, Mongo Sanitize, HPP, CORS
- **Testing**: Jest, Supertest, In-Memory MongoDB

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18 (Tested on v25.3.0)
- MongoDB running locally on `mongodb://localhost:27017/vibehub` (or a remote MongoDB Atlas URI)

---

### 1. Backend Setup

```bash
cd backend
npm install

# Start development server (with nodemon)
npm run dev

# Or start in production mode
npm start

# Run automated tests
npm test
```

The backend server will run on `http://localhost:5000`. Health check endpoint: `http://localhost:5000/health`.

### 2. Frontend Setup

```bash
cd vibehub_frontend
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build
```

The frontend will run on `http://localhost:5173`.

---

## 🧪 Testing

The backend includes a comprehensive automated test suite (37 tests across 11 test suites) covering:
- Authentication (registration, login, invalid credentials, duplicate prevention)
- Security middleware (rate limiting, helmet headers)
- Dual-auth token verification
- Error handling
- Users and profiles (follow/unfollow, profile edits, search)
- Posts (feed, like toggling, bookmarking, comments)
- Stories (ephemeral feed, 24-hour expiration, views)
- Chat (conversations, direct messaging)
- Notifications (retrieval, mark as read)
- Serializer formatters parity with DRF

To run tests:
```bash
cd backend
npm test
```

---

## 📄 Migration Details

For full details on the architectural changes, API contracts, schema migrations, and decommissioning of the legacy Django backend, see [MIGRATION_REPORT.md](MIGRATION_REPORT.md).
