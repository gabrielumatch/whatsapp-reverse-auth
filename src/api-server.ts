import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { TokenService } from './token-service';
import { WhatsAppBot } from './whatsapp-bot';

export class ApiServer {
  private fastify = Fastify({ logger: true });
  private tokenService: TokenService;
  private whatsappBot: WhatsAppBot;
  private port: number;
  private host: string;
  private botPhoneNumber: string;

  constructor(
    tokenService: TokenService,
    whatsappBot: WhatsAppBot,
    port: number = 3000,
    host: string = '0.0.0.0',
    botPhoneNumber: string = ''
  ) {
    this.tokenService = tokenService;
    this.whatsappBot = whatsappBot;
    this.port = port;
    this.host = host;
    this.botPhoneNumber = botPhoneNumber;
    this.setupRateLimiting();
    this.setupRoutes();
  }

  private async setupRateLimiting() {
    await this.fastify.register(rateLimit, {
      max: 10, // Maximum 10 requests
      timeWindow: '1 minute', // Per minute per IP
      cache: 10000, // Cache up to 10k IP addresses
    });
  }

  private setupRoutes() {
    // Health check endpoint
    this.fastify.get('/health', async (request, reply) => {
      return {
        status: 'ok',
        whatsappStatus: this.whatsappBot.getConnectionStatus(),
        activeTokens: this.tokenService.getActiveTokenCount(),
      };
    });

    // Generate token endpoint
    this.fastify.post('/generate-token', async (request, reply) => {
      try {
        const token = this.tokenService.generateToken();
        const waLink = this.generateWhatsAppLink(token);

        return {
          success: true,
          token,
          waLink,
          expiresIn: '10 minutes',
          instructions: `Send the token "${token}" to ${this.botPhoneNumber || 'the bot'} via WhatsApp`,
        };
      } catch (error: any) {
        reply.code(500);
        return {
          success: false,
          error: error.message || 'Failed to generate token',
        };
      }
    });

    // Token verification status endpoint
    this.fastify.get('/token/:token/status', async (request, reply) => {
      const { token } = request.params as { token: string };
      
      const isValid = this.tokenService.verifyToken(token);
      
      return {
        token,
        valid: isValid,
      };
    });
  }

  private generateWhatsAppLink(token: string): string {
    const encodedMessage = encodeURIComponent(token);
    
    if (this.botPhoneNumber) {
      // Remove any non-numeric characters from phone number
      const cleanNumber = this.botPhoneNumber.replace(/\D/g, '');
      return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    }
    
    // If no bot phone number is configured, return a generic link
    return `https://wa.me/?text=${encodedMessage}`;
  }

  async start() {
    try {
      await this.fastify.listen({ port: this.port, host: this.host });
      this.fastify.log.info(`API server listening on ${this.host}:${this.port}`);
    } catch (error) {
      this.fastify.log.error(error);
      process.exit(1);
    }
  }

  async stop() {
    await this.fastify.close();
  }
}
