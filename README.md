# 📚 BookNook

### Your Community Library, One Book at a Time.

BookNook is a community-driven book library platform where readers can discover books, share their own titles, and manage borrowing and returns. It provides a simple experience for exploring a growing collection and keeping track of every borrowed book.

<p align="center">
  <a href="https://booknook-client-liard.vercel.app/"><strong>🌐 Live Application</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/afiaafia/booknook-server"><strong>⚙️ Backend Repository</strong></a>
  &nbsp;·&nbsp;
  <a href="https://booknook-server-9lg6.onrender.com"><strong>🔗 API Server</strong></a>
</p>

---

## ✨ Features

- **Discover Books** — Browse and search books by title, author, and category.
- **Smart Browsing** — Sort results and navigate through paginated book collections.
- **Book Details** — Explore descriptions, cover images, and available copy counts.
- **Secure Authentication** — Register and sign in using email/password, with Google OAuth support.
- **Book Management** — Add, edit, and remove books owned by your account.
- **Cover Image Upload** — Upload hosted cover images or provide an existing image URL.
- **Borrowing System** — Borrow available copies and track active and returned books.
- **Book Returns** — Return borrowed books and automatically restore available inventory.

## 🛠️ Technology Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,nodejs,express,mongodb,git,vercel&perline=5" alt="Technology stack icons" />
</p>

**Additional tools and libraries:**

- Better Auth — Authentication
- Zod — Schema validation
- pnpm — Package management
- ImgBB — Hosted cover image uploads

## 🚀 Getting Started

Follow these steps to run the client locally.

### Prerequisites

- Node.js
- pnpm
- MongoDB connection
- Running BookNook Express API

### 1. Clone the repository

```bash
git clone https://github.com/afiaafia/booknook-client.git
cd booknook-client
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
DB_NAME=your_database_name

BETTER_AUTH_SECRET=your_strong_random_secret
BETTER_AUTH_URL=http://localhost:3000

NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Google OAuth credentials are optional. Google sign-in requires valid provider credentials and correctly configured callback URLs.

### 4. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Important:** The Express backend runs separately. Clone and configure the [BookNook Server](https://github.com/afiaafia/booknook-server) repository, then start it using `pnpm dev`.

## ⚙️ Environment Variables

### Client — `.env.local`

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string used by Better Auth |
| `DB_NAME` | Yes | MongoDB database name |
| `BETTER_AUTH_SECRET` | Yes | Secret used for authentication |
| `BETTER_AUTH_URL` | Yes | Canonical Next.js application origin |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | No | Browser-facing authentication URL |
| `NEXT_PUBLIC_API_URL` | No | Express API origin; defaults to `http://localhost:5000` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |

### Backend — `booknook-server/.env`

The Express backend requires its own environment configuration. Refer to the [server repository](https://github.com/afiaafia/booknook-server) and its `.env.example` file.

Configure `MONGODB_URI`, `DB_NAME`, `CLIENT_URL`, `BETTER_AUTH_URL`, and `IMGBB_API_KEY` as required by the backend.

**Security note:** Never commit `.env` or `.env.local` files, expose authentication secrets, or use the `NEXT_PUBLIC_` prefix for private credentials.

## 🔐 Google OAuth Setup

To enable Google sign-in:

1. Create OAuth credentials in Google Cloud Console.
2. Configure the authorized redirect URI:

   ```text
   http://localhost:3000/api/auth/callback/google
   ```

3. Add your Google client ID and client secret to `.env.local`.
4. For deployment, configure the corresponding production callback URL and matching application origins.

Google sign-in will remain unavailable until valid credentials and matching origins are configured.

## 📦 Build

Create a production build:

```bash
pnpm build
```

Start the production server locally:

```bash
pnpm start
```

## 🌍 Deployment

The BookNook client is deployed on Vercel, while the Express API runs separately on Render.

| Service | Deployment |
|---|---|
| Client | [booknook-client-liard.vercel.app](https://booknook-client-liard.vercel.app/) |
| Backend API | [booknook-server-9lg6.onrender.com](https://booknook-server-9lg6.onrender.com) |

For a working production setup, configure the correct environment variables, MongoDB access, authentication origins, API URL, and Google OAuth callback URL where applicable.

## 📁 Project Repositories

- **Frontend:** [afiaafia/booknook-client](https://github.com/afiaafia/booknook-client)
- **Backend:** [afiaafia/booknook-server](https://github.com/afiaafia/booknook-server)

---

<p align="center">
  <strong>Built with 📚 for readers and book lovers.</strong>
</p>
