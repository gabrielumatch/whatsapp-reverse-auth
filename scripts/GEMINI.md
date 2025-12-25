# Bot Service Workflow

This directory contains the logic for the long-running WhatsApp listener.

## Core Components

- `start-bot.ts`: The entry point. Handles environment variables and initializes the connection.
- `lib/whatsapp/bot.ts`: The main logic. Uses **Baileys** to connect to WhatsApp and manages connection events.
- `lib/whatsapp/supabase-auth-state.ts`: A custom adapter that stores WhatsApp session keys in Supabase instead of the local filesystem.

## Connection Handshake (The "Reverse" Part)

1. **Session Initiation**: The Next.js frontend generates a unique `SESSION_ID`.
2. **Bot Execution**: The user runs `SESSION_ID=xyz npm run bot`.
3. **QR Sync**: The bot generates a QR code and upserts it into the `whatsapp_sessions_metadata` table.
4. **Real-time Feedback**: The frontend (listening via Supabase Realtime) displays the QR code.
5. **Authorization**: Once scanned, the bot updates the table status to `connected`, triggering a redirect in the browser.

## Message Processing

The bot listens for `messages.upsert` events.
- **Verification Logic**: (To be implemented) When a user sends a message matching a generated token, the bot identifies the sender's phone number and marks the session as verified in the database.

## Technical Notes

- **Persistence**: Auth states (keys/creds) are stored in the `whatsapp_auth` table in Supabase. This allows the bot to restart without re-scanning the QR code.
- **Logging**: Uses `pino`. Errors like `failed to decrypt message` for `status@broadcast` are common and safe to ignore (they are just WhatsApp Status updates).
- **Environment**: Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or a valid anon key with RLS permissions).

## Running the Bot

To ensure the bot connects to the correct persistent session without needing to re-scan:

1.  **Identify Session ID**: Check the dashboard or database for your connected `session_id`.
2.  **Configure Environment**: Add it to your `.env.local`:
    ```env
    SESSION_ID=your_session_id_here
    ```
3.  **Start Service**:
    ```bash
    npm run bot
    ```
    The bot will automatically restore the session using the keys stored in Supabase.

## Development Loop

When you make changes to `lib/whatsapp/bot.ts`:
1.  **Stop**: `Ctrl + C` in the terminal running the bot.
2.  **Restart**: `npm run bot` to load the new code.
    *   *Note:* The Next.js frontend hot-reloads automatically, but the bot process does not.
