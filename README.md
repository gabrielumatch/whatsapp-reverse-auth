# WhatsApp Reverse Auth System

A scalable, self-hosted WhatsApp automation system built with Next.js, Baileys, Docker, and Redis.

## 🏗️ Architecture

*   **Frontend**: Next.js 15 (App Router, Server-Side Hydration, React Query).
*   **Realtime**: Redis Pub/Sub + Server-Sent Events (SSE).
*   **Bot Backend**: Node.js worker using Baileys (Multi-Device).
*   **Database**: PostgreSQL 15 (Prisma ORM).
*   **Queue/Cache**: Redis 7.
*   **Storage**: Local Filesystem (streamed via API).

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   Docker & Docker Compose

### 1. Start Infrastructure
Start Postgres and Redis containers:
```bash
docker-compose up -d
```

### 2. Configure Environment
Create `.env` in the root (see `.env.example`).

### 3. Initialize Database
Apply the Prisma schema and migrations:
```bash
npx prisma generate
npx prisma db push
```

### 4. Run the System
You need two terminals:

**Terminal 1: The Bot** (Connects to WhatsApp)
```bash
npm run bot
```

**Terminal 2: The Frontend** (UI)
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and scan the QR code.

## 📡 API Reference

### 📖 Interactive Documentation
Explore and test the API using the built-in [Scalar UI](http://localhost:3000/api-docs).

### Realtime Streams
*   `GET /api/stream/session-status`: Updates for QR codes and connection state.
*   `GET /api/stream/chats?sessionId=...`: Updates for the chat list.
*   `GET /api/stream/messages?chatId=...`: Updates for a specific conversation.

### REST Endpoints
*   `GET /api/chats`: List chats (Cursor pagination).
*   `GET /api/messages`: List messages (Cursor pagination).
*   `GET /api/search`: Full-text search for chats and messages.
*   `GET /api/media/...`: Secure media streaming.

## 🧪 Testing

Run the full test suite (Unit + Integration):
```bash
npx vitest run
```

## 🛠️ Performance Features
*   **Server-Side Hydration**: Initial chat state is pre-rendered on the server for instant LCP.
*   **Infinite Queries**: Robust pagination for unlimited chat history.
*   **Optimistic Updates**: Immediate UI feedback for session actions.
*   **Batched Inserts**: High-volume message syncing handled via Redis queue.
*   **Media Streaming**: Large files are streamed using Node.js streams.

## 📂 Key Directories
*   `lib/whatsapp/repositories`: Database access layer.
*   `lib/whatsapp/workers`: Message queue processors.
*   `hooks/`: React Query hooks with SSE integration.
*   `app/api/`: Zod-validated API routes.