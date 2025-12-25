# Project Context: WhatsApp Reverse Auth

## Project Overview
This project implements a "Reverse WhatsApp Auth" system. Instead of the traditional flow where an application sends a code to the user's phone, this system provides an endpoint that generates a unique message/code. The user then sends this message *to* our system (via WhatsApp). We listen for these incoming messages using **Baileys** and authorize the phone number associated with the message.

## Core Flow
1.  **Generation:** An endpoint generates a specific verification message/token for a user session.
2.  **User Action:** The user sends this specific message to our WhatsApp bot number.
3.  **Verification:** The system (using Baileys) listens for incoming messages.
4.  **Authorization:** When the expected message is received, the sender's phone number is authorized/verified.

## Tech Stack (Current)
-   **Frontend:** Next.js 15 (App Router).
-   **Database:** PostgreSQL (Self-hosted via Docker).
-   **ORM:** Prisma.
-   **Session Store:** Redis (for Baileys Auth State).
-   **File Storage:** Local Filesystem (`/storage`).
-   **Bot Engine:** Baileys (running as a standalone Node.js worker).
-   **Testing:** Vitest (Unit + Integration).

## Architecture & Patterns
-   **Repository Pattern:** All DB interactions are encapsulated in `lib/whatsapp/repositories/`. No direct Prisma calls in handlers.
-   **Worker Queue:** Incoming messages are pushed to Redis (`queue:messages`) and processed in batches by `MessageProcessor`. This handles high-volume history syncs efficiently.
-   **API Layer:** The Frontend communicates with the Backend via Next.js API Routes (`/api/...`), which poll the Postgres DB.
-   **Component Design:** Chat UI is modularized (`ChatDisplay` -> `ChatHeader`, `MessageBubble`, `ChatDetails`).

## Interaction Rules for Gemini
-   **Strict Types:** TypeScript for everything.
-   **Testing:** Always add tests when creating new logic. Use `vitest`.
-   **Performance:** Use the Redis Queue for high-volume writes. Do not write to DB synchronously in the event loop.
-   **Storage:** Media is stored locally. Use `/api/media/...` proxy to serve it.

## Lessons Learned
-   **History Sync:** WhatsApp sends thousands of messages at once. Synchronous inserts crash the DB. Batching via Redis is mandatory.
-   **Prisma vs RLS:** We moved away from Supabase RLS for the bot logic. The bot uses Prisma (Service Role) directly.
-   **React Components:** Large components (`ChatDisplay`) should be broken down early to avoid "duplicate key" and complexity issues.
-   **Date Handling:** Use `date-fns` for relative time.
