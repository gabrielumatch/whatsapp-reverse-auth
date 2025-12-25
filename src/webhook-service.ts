import pino from 'pino';

export class WebhookService {
  private logger = pino({ level: 'info' });
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async notifyVerification(token: string, phoneNumber: string): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn('No webhook URL configured, skipping notification');
      return;
    }

    try {
      this.logger.info(`Sending webhook notification for phone: ${phoneNumber}`);
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          phoneNumber,
          verifiedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }

      this.logger.info('Webhook notification sent successfully');
    } catch (error) {
      this.logger.error({ error }, 'Error sending webhook notification');
      // Don't throw error to avoid disrupting the main flow
    }
  }
}
