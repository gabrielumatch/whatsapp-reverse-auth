# WhatsApp Reverse Auth System

A scalable, self-hosted WhatsApp automation system built with Next.js, Baileys, Docker, and Redis.

## 🏗️ Architecture

*   **Frontend**: Next.js 15 (App Router, API Routes).
*   **Bot Backend**: Node.js worker using Baileys.
*   **Database**: PostgreSQL 15.
*   **Queue/Cache**: Redis 7.
*   **Storage**: Local Filesystem (served via API proxy).

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
Create `.env` in the root:
```env
# Database
DATABASE_URL="postgresql://whatsapp:whatsapp_password@localhost:5432/whatsapp_db"

# Redis
REDIS_URL="redis://localhost:6379"

# Bot Session
SESSION_ID="my_session_v1"

# Performance Tuning
MESSAGE_BATCH_SIZE="100"
MESSAGE_POLL_INTERVAL_MS="500"
```

### 3. Initialize Database
Apply the Prisma schema:
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

## 🧪 Testing

Run the full test suite (Unit + Integration):
```bash
npx vitest run
```

## 📂 Key Directories
*   `lib/whatsapp/repositories`: Database access.
*   `lib/whatsapp/workers`: Message queue processing.
*   `components/chat`: UI components (Bubble, Header, Sidebar).
*   `storage/`: Where media files are saved.

## 🛠️ Troubleshooting
*   **"Stream Errored"**: Normal during first pair. The bot auto-restarts.
*   **"Bad Decrypt"**: Session corruption. Delete the session from DB and restart.
*   **Empty Chat List**: Ensure the bot completed the initial history sync.
