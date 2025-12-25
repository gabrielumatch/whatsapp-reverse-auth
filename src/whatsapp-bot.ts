import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  ConnectionState,
  WAMessage,
  proto,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { TokenService } from './token-service';
import { WebhookService } from './webhook-service';

export class WhatsAppBot {
  private sock: any = null;
  private logger = pino({ level: 'info' });
  private tokenService: TokenService;
  private webhookService: WebhookService;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(tokenService: TokenService, webhookService: WebhookService) {
    this.tokenService = tokenService;
    this.webhookService = webhookService;
  }

  async start() {
    await this.connectToWhatsApp();
  }

  async stop() {
    this.shouldReconnect = false;
    if (this.sock) {
      await this.sock.logout();
    }
  }

  private async connectToWhatsApp() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

      this.sock = makeWASocket({
        auth: state,
        logger: this.logger,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: undefined,
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
        this.handleConnectionUpdate(update);
      });
      this.sock.ev.on('messages.upsert', async (m: { messages: WAMessage[]; type: string }) => {
        await this.handleIncomingMessages(m);
      });

      this.logger.info('WhatsApp bot started successfully');
    } catch (error) {
      this.logger.error({ error }, 'Error starting WhatsApp bot');
      await this.handleReconnect();
    }
  }

  private handleConnectionUpdate(update: Partial<ConnectionState>) {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      this.logger.info({ shouldReconnect }, 'Connection closed. Reconnecting');

      if (shouldReconnect && this.shouldReconnect) {
        this.handleReconnect();
      }
    } else if (connection === 'open') {
      this.logger.info('WhatsApp connection opened successfully');
      this.reconnectAttempts = 0;
    }
  }

  private async handleReconnect() {
    if (!this.shouldReconnect) {
      return;
    }

    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached. Please restart the service.');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    this.logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connectToWhatsApp();
    }, delay);
  }

  private async handleIncomingMessages(m: { messages: WAMessage[]; type: string }) {
    const message = m.messages[0];

    if (!message.message || message.key.fromMe) {
      return;
    }

    const messageText = this.extractMessageText(message);
    
    if (!messageText) {
      return;
    }

    this.logger.info(`Received message: ${messageText}`);

    // Check if the message contains a valid token
    const token = messageText.trim();
    
    if (this.tokenService.verifyToken(token)) {
      const phoneNumber = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
      
      this.logger.info(`Token verified for phone: ${phoneNumber}`);
      
      // Mark token as verified
      this.tokenService.markAsVerified(token);
      
      // Send webhook notification
      await this.webhookService.notifyVerification(token, phoneNumber);
      
      // Send confirmation message back to user
      await this.sendConfirmationMessage(message.key.remoteJid!, phoneNumber);
    }
  }

  private extractMessageText(message: WAMessage): string | null {
    const messageContent = message.message;

    if (!messageContent) {
      return null;
    }

    if (messageContent.conversation) {
      return messageContent.conversation;
    }

    if (messageContent.extendedTextMessage?.text) {
      return messageContent.extendedTextMessage.text;
    }

    return null;
  }

  private async sendConfirmationMessage(jid: string, phoneNumber: string) {
    try {
      await this.sock.sendMessage(jid, {
        text: '✅ Verification successful! Your phone number has been verified.',
      });
    } catch (error) {
      this.logger.error({ error }, 'Error sending confirmation message');
    }
  }

  getConnectionStatus(): string {
    return this.sock?.user ? 'connected' : 'disconnected';
  }
}
