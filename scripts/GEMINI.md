# Bot Service Workflow

This directory contains the logic for the long-running WhatsApp listener.

## Core Components

- `start-bot.ts`: The entry point. Initializes Prisma, Redis, MinIO and starts the bot.
- `lib/whatsapp/bot.ts`: The main engine. Handles connection lifecycle and events.
- `lib/whatsapp/redis-auth-state.ts`: Custom adapter storing session keys in Redis.

## Running the Bot

1.  **Infrastructure**: Ensure Docker is running (`docker-compose up -d`).
2.  **Environment**: Ensure `.env.docker` (or `.env`) has `DATABASE_URL`, `REDIS_URL`, etc.
3.  **Start**:
    ```bash
    npm run bot
    ```

## Development Loop

When you make changes to `lib/whatsapp/**/*.ts`:
1.  **Stop**: `Ctrl + C`.
2.  **Restart**: `npm run bot` to load the new code.

## Debugging
-   **Logs**: The bot uses `pino`. Check stdout.
-   **Database**: Use `npx prisma studio` to inspect the DB if needed.