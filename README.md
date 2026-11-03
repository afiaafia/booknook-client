# BookNook

BookNook is a community book library for discovering titles, sharing books, and tracking borrowing and returns.

**Live site:** Not deployed yet. Placeholder: `https://your-booknook-deployment.example`

## Features

- Browse and search books by title, author, and category, with sorting and pagination.
- View book details, descriptions, cover images, and copy availability.
- Register and sign in with email/password; Google OAuth is supported when valid provider credentials are configured.
- Add books with a hosted cover image upload or an existing image URL.
- Edit and remove books owned by the signed-in user.
- Borrow available copies and track active and returned books.
- Return books and restore available inventory.

## Local Development

Install dependencies with `pnpm install` in this directory. Configure the environment variables below, then start the client with `pnpm dev`. The Express API runs separately from `booknook-server` with `pnpm dev`.

## Environment Variables

Set these for the Next.js client/server process in `booknook-client/.env.local`:

| Variable                      | Required | Purpose                                                                                      |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                 | Yes      | MongoDB connection string for Better Auth.                                                   |
| `DB_NAME`                     | Yes      | Database name used by Better Auth.                                                           |
| `BETTER_AUTH_SECRET`          | Yes      | Secret used by Better Auth; generate a strong random value and keep it server-side.          |
| `BETTER_AUTH_URL`             | Yes      | Canonical Next.js origin, such as `http://localhost:3000`; must match the server's value.    |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | No       | Browser URL for Better Auth; defaults to `http://localhost:3000`.                            |
| `NEXT_PUBLIC_API_URL`         | No       | Express API origin; defaults to `http://localhost:5000`. A trailing `/api` is also accepted. |
| `GOOGLE_CLIENT_ID`            | Optional | Google OAuth client ID.                                                                      |
| `GOOGLE_CLIENT_SECRET`        | Optional | Google OAuth client secret.                                                                  |

Set these for Express in `booknook-server/.env` (see its `.env.example`): `MONGODB_URI`, `DB_NAME`, `CLIENT_URL`, `BETTER_AUTH_URL`, and `IMGBB_API_KEY`. The ImgBB key is optional for URL-only cover entry, but required for uploads. Never use a `NEXT_PUBLIC_` prefix for secrets.

For Google OAuth, configure the provider credentials in Google Cloud and allow the callback URL `http://localhost:3000/api/auth/callback/google` (replace the origin for deployment). OAuth is unavailable until valid credentials and matching deployed origins are configured.

## Build and Deployment

Run `pnpm build` for a production client build. Deployment is not configured yet. A production deployment needs the Next.js app and Express API reachable at their configured origins, MongoDB access with transaction support, Better Auth secrets and URLs configured, and ImgBB credentials if upload is enabled. Configure Google OAuth callback origins separately for each deployed environment.
