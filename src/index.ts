import { TokenService } from './token-service';
import { WebhookService } from './webhook-service';
import { WhatsAppBot } from './whatsapp-bot';
import { ApiServer } from './api-server';

// Configuration from environment variables
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const BOT_PHONE_NUMBER = process.env.BOT_PHONE_NUMBER || '';

async function main() {
  console.log('Starting WhatsApp Reverse Auth Service...');
  console.log(`Port: ${PORT}`);
  console.log(`Host: ${HOST}`);
  console.log(`Webhook URL: ${WEBHOOK_URL || 'Not configured'}`);
  console.log(`Bot Phone Number: ${BOT_PHONE_NUMBER || 'Not configured'}`);

  // Initialize services
  const tokenService = new TokenService();
  const webhookService = new WebhookService(WEBHOOK_URL);
  const whatsappBot = new WhatsAppBot(tokenService, webhookService);
  const apiServer = new ApiServer(tokenService, whatsappBot, PORT, HOST, BOT_PHONE_NUMBER);

  // Start WhatsApp bot
  await whatsappBot.start();

  // Start API server
  await apiServer.start();

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    await apiServer.stop();
    await whatsappBot.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
