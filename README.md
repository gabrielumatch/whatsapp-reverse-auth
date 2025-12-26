# WhatsApp Reverse Auth 🚀

**The free, open-source alternative for secure phone verification.**

Traditional SMS-based verification is expensive, localized, and prone to delivery failures. **WhatsApp Reverse Auth** flips the script: instead of sending a code *to* the user, the user sends a unique token *to* your bot. This creates a highly reliable, zero-cost (per message), and globally accessible verification flow for your applications.

Built for scale and self-hosting, this system provides a complete infrastructure to manage WhatsApp sessions, verify incoming authentication challenges in real-time, and notify your backend via secure webhooks.

## ✨ Key Features

*   **Zero-Cost Verification**: Eliminate SMS API fees by using the user's existing WhatsApp connection.
*   **Global Reach**: Works wherever WhatsApp is available, bypassing local carrier restrictions.
*   **Real-time Response**: Built on Redis Pub/Sub and SSE for instant verification feedback.
*   **Developer Friendly**: Fully documented API with Scalar UI and Zod validation.
*   **Scalable Architecture**: Batched processing and Redis queuing to handle high-volume syncs.
*   **Secure & Private**: Self-hosted solution where you own your data and session keys.

## 🏗️ Architecture

*   **Frontend**: Next.js 16 (App Router, Server-Side Hydration, React Query).
*   **Realtime**: Redis Pub/Sub + Server-Sent Events (SSE).
*   **Bot Backend**: Node.js worker using Baileys (Multi-Device).
*   **Database**: PostgreSQL 15 (Prisma ORM).
*   **Queue/Cache**: Redis 7.
*   **Storage**: Local Filesystem (streamed via API).

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
*   **Node.js 20+** (LTS recommended)
*   **Docker & Docker Compose**
*   **npm** or **pnpm**

### 2. Start Infrastructure
Launch the database and cache containers:
```bash
docker-compose up -d
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

**Crucial Variables:**
| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (defaults to local docker) |
| `REDIS_URL` | Redis connection string (defaults to local docker) |
| `SESSION_ID` | The unique ID for your bot session (e.g., `prod_v1`) |
| `AUTH_SECRET` | Secret key for session encryption (Auth.js) |
| `AUTH_PREFIXES` | Comma-separated list of prefixes for auth messages (default: `Auth Token:`) |
| `MESSAGE_BATCH_SIZE` | How many messages to sync at once (default: 100) |

### 4. Database Initialization
Generate the Prisma client and push the schema to your database:
```bash
npx prisma generate
npx prisma db push
```

### 5. Running the Application
You need to run the bot engine and the frontend web server simultaneously.

**Terminal 1: The Bot Engine**
```bash
npm run bot
```
*Wait for the QR code to appear in the terminal and scan it with your WhatsApp mobile app.*

**Terminal 2: The Web Dashboard**
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

## 📡 API Reference

### 📖 Interactive Documentation
Explore, test, and integrate the API using the built-in [Scalar UI](http://localhost:3000/api-docs).

### Core Auth Flow
1.  **Generate Challenge**: `POST /api/auth/challenge`
2.  **User Action**: Redirect user to the returned `whatsapp_url`.
3.  **Poll Status**: `GET /api/auth/challenge?token=...`
4.  **Verification**: The bot auto-verifies when it receives the "Auth Token: XXX" message.

## 🧪 Testing
We maintain high test coverage for reliability.
```bash
# Run all tests (Unit + Integration)
npm test

# Run tests in UI mode
npx vitest --ui
```

## 🛠️ Performance & Scalability
*   **PPR (Partial Prerendering)**: Used for instant layout delivery.
*   **SSE (Server-Sent Events)**: Provides real-time UI updates without database polling.
*   **Batched Inserts**: Message synchronization is offloaded to a Redis queue to prevent DB bottlenecks.
*   **Streamed Media**: Large images/videos are served via Node.js streams to minimize memory footprint.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License
Distributed under the MIT License.
