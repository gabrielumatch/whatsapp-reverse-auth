# Project Context: WhatsApp Reverse Auth

## Project Overview
This project implements a "Reverse WhatsApp Auth" system. Instead of the traditional flow where an application sends a code to the user's phone, this system provides an endpoint that generates a unique message/code. The user then sends this message *to* our system (via WhatsApp). We listen for these incoming messages using **Baileys** and authorize the phone number associated with the message.

## Core Flow
1.  **Generation:** An endpoint generates a specific verification message/token for a user session.
2.  **User Action:** The user sends this specific message to our WhatsApp bot number.
3.  **Verification:** The system (using Baileys) listens for incoming messages.
4.  **Authorization:** When the expected message is received, the sender's phone number is authorized/verified.

## Tech Stack (Updated)
-   **Framework:** Next.js (App Router) - Using latest/v15+ conventions.
-   **Database:** PostgreSQL (Self-hosted via Docker).
-   **ORM:** Prisma (replaces Supabase Client for backend logic).
-   **Session Store:** Redis (for Baileys Auth State).
-   **Storage:** MinIO (S3-compatible) for media files.
-   **WhatsApp Integration:** Baileys.
-   **Environment:** Node.js (win32).

## Conventions
-   **Strict Types:** TypeScript for all new code.
-   **Repository Pattern:** Database logic MUST live in `lib/whatsapp/repositories/`. Do not call `prisma` directly in handlers.
-   **Handlers:** Business logic lives in `lib/whatsapp/handlers/`.
-   **Bot Context:** Passed around as `ctx` (contains `sock`, `prisma`, `redis`, `minio`, `repos`).

## Bot Architecture
-   **Entry Point:** `scripts/start-bot.ts` -> `lib/whatsapp/bot.ts`.
-   **Event Loop:** Uses `sock.ev.process` for batched event handling.
-   **Syncing:**
    -   `messaging-history.set`: Initial sync (huge payload).
    -   `messages.upsert`: Real-time messages.
-   **Media:** Automatically downloads to MinIO and saves path to DB.
-   **Outgoing:** Polls `whatsapp_messages` table for `status='sent'` (temporary solution until Redis Pub/Sub).

## Interaction Rules for Gemini
-   Focus on the "Reverse Auth" logic.
-   When discussing WhatsApp integration, assume **Baileys** is the library of choice.
-   **Prisma > Supabase:** Prefer Prisma for all backend/bot database operations. Supabase Client is legacy/frontend-only (if used at all).
-   **Recall:** "Users" are the ones sending messages to be verified. "Admins" view the dashboard.