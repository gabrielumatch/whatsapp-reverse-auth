# WhatsApp Reverse Auth System

A robust, self-hosted system for authenticating and managing WhatsApp sessions via a "Reverse Auth" flow.

## 🏗️ Architecture

This project has migrated from a serverless-only stack to a scalable Docker-based infrastructure.

*   **Frontend**: Next.js 15 (App Router)
*   **Database**: PostgreSQL 15 (via Prisma ORM)
*   **Session Store**: Redis (for Baileys keys - fast access)
*   **File Storage**: MinIO (S3-compatible, for media)
*   **Bot Engine**: Baileys (running as a Node.js worker)

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   Docker & Docker Compose

### 1. Start Infrastructure
Run the database, cache, and storage containers:
```bash
docker-compose up -d
```

### 2. Environment Setup
Create `.env` (or `.env.local` for Next.js and `.env.docker` for Bot):

```env
# Database (Postgres)
DATABASE_URL="postgresql://whatsapp:whatsapp_password@localhost:5432/whatsapp_db"

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO (Storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minio_user"
MINIO_SECRET_KEY="minio_password"

# Session ID (for the bot worker)
SESSION_ID="my_session_v1"
```

### 3. Initialize Database
Push the Prisma schema to your local Postgres:
```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Bot
Start the worker process that handles WhatsApp connection:
```bash
npm run bot
```
(This runs `scripts/start-bot.ts` using `tsx`).

### 5. Run the Frontend
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## 📂 Project Structure

*   `app/`: Next.js App Router (UI).
*   `components/`: React components (Chat UI, etc.).
*   `lib/whatsapp/`: Core Bot Logic.
    *   `bot.ts`: Main entry point.
    *   `handlers/`: Business logic (messages, media, contacts).
    *   `repositories/`: Database abstraction layer (Prisma).
    *   `redis-auth-state.ts`: Custom Baileys auth adapter for Redis.
*   `prisma/`: Database schema definition.
*   `scripts/`: Standalone scripts (bot runner).

## 🛠️ Features

*   **QR Code Auth**: Scan to pair.
*   **Real-time Sync**: Messages, Contacts, and Profile Pictures synced to DB.
*   **Media Handling**: Images, Videos, Audio automatically downloaded to MinIO.
*   **Sending**: Send messages from the UI (queued via DB polling).
*   **Scalable**: Redis-backed session storage for high performance.