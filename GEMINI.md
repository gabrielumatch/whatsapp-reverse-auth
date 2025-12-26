# Project Context: WhatsApp Reverse Auth

## Project Overview
This project implements a "Reverse WhatsApp Auth" system. Instead of the traditional flow where an application sends a code to the user's phone, this system provides an endpoint that generates a unique message/code. The user then sends this message *to* our system (via WhatsApp). We listen for these incoming messages using **Baileys** and authorize the phone number associated with the message.

## Core Flow
1.  **Generation:** An endpoint (`POST /api/auth/challenge`) generates a unique OTP token.
2.  **User Action:** The user sends this specific token (e.g. "Auth Token: A1B2") to our WhatsApp bot number.
3.  **Verification:** The system (using Baileys) detects the token pattern, verifies it against Redis, and marks it as verified.
4.  **Authorization:** The system triggers a webhook (if configured) and the client polling the status (`GET /api/auth/challenge`) receives confirmation.

## Tech Stack (Current)
-   **Frontend:** Next.js 15 (App Router), React Query, Tailwind CSS.
-   **Database:** PostgreSQL (Self-hosted via Docker).
-   **ORM:** Prisma.
-   **Session Store:** Redis (for Baileys Auth State + Realtime Pub/Sub + OTP Challenges).
-   **File Storage:** Local Filesystem (`/storage`).
-   **Bot Engine:** Baileys (running as a standalone Node.js worker).
-   **Validation:** Zod.
-   **Logging:** Pino (Structured logging).
-   **Docs:** Scalar (OpenAPI 3.0).
-   **Testing:** Vitest (Unit + Integration).

## Architecture & Patterns
-   **Repository Pattern:** All DB interactions are encapsulated in `lib/whatsapp/repositories/`. No direct Prisma calls in handlers.
-   **Worker Queue:** Incoming messages are pushed to Redis (`queue:messages`) and processed in batches by `MessageProcessor`.
-   **Realtime Architecture:** 
    -   **Bot:** Publishes events to Redis channels (`updates:session-status`, `updates:chat:...`).
    -   **API:** Streams these events via SSE endpoints (`/api/stream/...`).
    -   **Frontend:** Uses `EventSource` to listen for updates and injects them directly into the **React Query Cache**.
-   **Auth Challenge Manager:** `ChallengeManager` handles OTP lifecycle (Generate -> Store in Redis -> Verify) decoupled from the database.
-   **Server-Side Hydration:** Initial data for Chats and Messages is fetched on the server and dehydrated to the client, ensuring zero layout shift.
-   **API Layer:** 
    -   Standardized error handling via `apiHandler`.
    -   Strict validation via **Zod** schemas.
    -   Centralized DTO mappers.

## Interaction Rules for Gemini
-   **Strict Types:** TypeScript for everything.
-   **Testing:** Always add tests when creating new logic. Use `vitest`.
-   **Performance:** Use the Redis Queue for high-volume writes. Do not write to DB synchronously in the event loop. Use SSR Hydration for critical UI.
-   **Logging:** Use `logger` from `@/lib/logger` instead of `console`.

## Lessons Learned
-   **History Sync:** WhatsApp sends thousands of messages at once. Synchronous inserts crash the DB. Batching via Redis is mandatory.
-   **React Query + SSE:** Ideally suited for chat. Infinite Queries handle history, while SSE handles live updates by mutating the cache.
-   **Pagination:** WhatsApp API returns messages in DESC (newest first) or ASC (oldest first). Ensure the React Query `getNextPageParam` logic matches the sort order.
-   **SSR:** Prefetching infinite queries requires careful handling of page params on the server.
