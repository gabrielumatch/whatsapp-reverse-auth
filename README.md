# WhatsApp Reverse Auth

A Node.js/TypeScript microservice that provides reverse authentication via WhatsApp using [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys). Users can verify their phone numbers by sending a unique token to a WhatsApp bot.

## Features

- 🔐 **Token Generation**: API endpoint to generate unique tokens and wa.me links
- 🤖 **WhatsApp Bot**: Listens for incoming messages with verification tokens
- ✅ **Automatic Verification**: Validates tokens and sends phone numbers to configured webhook
- 🔄 **Auto-Reconnect**: Automatic reconnection with exponential backoff
- 🐳 **Docker Support**: Alpine-based Docker image for low memory footprint
- ⚡ **Fastify**: High-performance web framework
- 📊 **Health Monitoring**: Built-in health check endpoint

## Architecture

1. **API Server** (Fastify): Exposes REST endpoints for token generation and status checking
2. **Token Service**: Manages token lifecycle with automatic expiration (10 minutes)
3. **WhatsApp Bot** (Baileys): Maintains WhatsApp connection and processes incoming messages
4. **Webhook Service**: Notifies external systems when verification succeeds

## Requirements

- Node.js 20+ or Docker
- WhatsApp account for bot (will be linked on first run)

## Installation

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/gabrielumatch/whatsapp-reverse-auth.git
cd whatsapp-reverse-auth
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the service:
```bash
docker-compose up -d
```

4. Check logs to scan QR code for WhatsApp authentication:
```bash
docker-compose logs -f
```

Scan the QR code with your WhatsApp mobile app (Linked Devices).

### Using Node.js

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the service:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | API server port | `3000` | No |
| `HOST` | API server host | `0.0.0.0` | No |
| `WEBHOOK_URL` | URL to POST verification data | - | No |
| `BOT_PHONE_NUMBER` | Bot's WhatsApp number (for wa.me links) | - | No |
| `NODE_ENV` | Environment mode | `production` | No |

## API Endpoints

### Generate Token

**POST** `/generate-token`

Generates a unique verification token and wa.me link.

**Response:**
```json
{
  "success": true,
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "waLink": "https://wa.me/1234567890?text=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "expiresIn": "10 minutes",
  "instructions": "Send the token \"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6\" to 1234567890 via WhatsApp"
}
```

### Check Token Status

**GET** `/token/:token/status`

Check if a token is still valid.

**Response:**
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "valid": true
}
```

### Health Check

**GET** `/health`

Check service health and status.

**Response:**
```json
{
  "status": "ok",
  "whatsappStatus": "connected",
  "activeTokens": 3
}
```

## Usage Flow

1. **Generate Token**: Call `POST /generate-token` to create a verification token
2. **User Action**: User clicks the `waLink` or manually sends the token to the bot via WhatsApp
3. **Bot Verification**: Bot receives the message, validates the token
4. **Webhook Notification**: If valid, bot POSTs to configured webhook:
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "phoneNumber": "1234567890",
  "verifiedAt": "2025-12-25T15:30:00.000Z"
}
```
5. **Confirmation**: User receives a confirmation message on WhatsApp

## Webhook Payload

When a token is successfully verified, a POST request is sent to `WEBHOOK_URL`:

```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "phoneNumber": "1234567890",
  "verifiedAt": "2025-12-25T15:30:00.000Z"
}
```

## Docker

### Build Image

```bash
docker build -t whatsapp-reverse-auth .
```

### Run Container

```bash
docker run -d \
  --name whatsapp-reverse-auth \
  -p 3000:3000 \
  -e WEBHOOK_URL=https://your-webhook.com/api/verify \
  -e BOT_PHONE_NUMBER=1234567890 \
  -v whatsapp-auth:/app/auth_info_baileys \
  whatsapp-reverse-auth
```

### Using Docker Compose

```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down

# Restart service
docker-compose restart
```

## Memory Optimization

The service is optimized for low memory usage:

- Alpine-based Docker image (~100MB)
- Production dependencies only in final image
- Memory limit: 512MB (configurable in docker-compose.yml)
- Efficient token cleanup with automatic expiration
- Single-threaded Node.js process

## Auto-Reconnection

The bot implements robust auto-reconnection:

- Exponential backoff strategy (1s, 2s, 4s, 8s... up to 30s)
- Maximum 10 reconnection attempts
- Automatic session restoration from saved credentials
- Graceful handling of network interruptions

## Security Considerations

- Tokens expire after 10 minutes
- Tokens are single-use (deleted after verification)
- No token storage in database (in-memory only)
- Non-root user in Docker container
- HTTPS recommended for webhook endpoint

## Troubleshooting

### QR Code Not Appearing

1. Check logs: `docker-compose logs -f`
2. Ensure WhatsApp Web is logged out on other devices
3. Delete `auth_info_baileys` folder and restart

### Connection Issues

1. Check internet connectivity
2. Verify WhatsApp account is not banned
3. Review logs for specific error messages
4. Wait for auto-reconnection (up to 10 attempts)

### Webhook Not Receiving Data

1. Verify `WEBHOOK_URL` is accessible from container
2. Check webhook endpoint logs
3. Ensure endpoint accepts POST requests with JSON body
4. Test webhook manually with curl

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Clean build artifacts
npm run clean
```

## Project Structure

```
.
├── src/
│   ├── index.ts           # Main entry point
│   ├── api-server.ts      # Fastify API server
│   ├── token-service.ts   # Token management
│   ├── whatsapp-bot.ts    # WhatsApp bot logic
│   └── webhook-service.ts # Webhook notifications
├── Dockerfile             # Multi-stage Alpine-based image
├── docker-compose.yml     # Docker Compose configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── .env.example           # Environment variables template
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please use the GitHub issue tracker.