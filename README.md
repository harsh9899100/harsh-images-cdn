# ImageCDN — Vercel Blob Storage

A Next.js CDN dashboard for managing project-based image uploads using Vercel Blob Storage.

## Features

- 📁 **Project-based organization** — images stored under `real-estate/<project>/` or `portfolio/<project>/`
- ⬆️ **Multi-file upload** with drag-and-drop
- 🖼️ **Lightbox viewer** with one-click CDN URL copy
- 🗑️ **Delete** images directly from the UI
- 🔍 **Search & filter** by category or project name
- 📊 **Stats dashboard** — total images, project count per category
- 🌐 **Edge API routes** — fast globally

## Blob Path Structure

```
real-estate/
  sunset-villa/
    1712345678_photo1.jpg
    1712345679_photo2.jpg
portfolio/
  brand-identity/
    1712345680_logo.png
```

## Deploy to Vercel

### 1. Clone & install
```bash
git clone <your-repo>
cd image-cdn
npm install
```

### 2. Create Vercel Blob store
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Storage** tab
3. Click **Create Blob Store**
4. Copy the `BLOB_READ_WRITE_TOKEN`

### 3. Set environment variable
```bash
# Local development
cp .env.example .env.local
# Edit .env.local and paste your token

# On Vercel (auto-linked if you use the dashboard)
# Project Settings → Environment Variables → BLOB_READ_WRITE_TOKEN
```

### 4. Deploy
```bash
npx vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deployments.

## Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** You need a real `BLOB_READ_WRITE_TOKEN` even locally — Vercel Blob has no local emulator. Use a dev blob store.

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/images` | List all blobs, parsed into `ProjectImage[]` |
| `POST` | `/api/upload` | Upload a single image (multipart/form-data) |
| `DELETE` | `/api/delete` | Delete a blob by URL |

### Upload payload
```
Content-Type: multipart/form-data
Fields: file (File), project (string), category ("real-estate" | "portfolio")
```

## Stack

- **Next.js 15** (App Router)
- **Vercel Blob** (`@vercel/blob`)
- **Tailwind CSS v4**
- **TypeScript**
- All API routes run on the **Edge Runtime**
