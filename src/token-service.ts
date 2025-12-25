import { randomBytes } from 'crypto';

interface TokenData {
  token: string;
  createdAt: Date;
  verified: boolean;
}

export class TokenService {
  private tokens: Map<string, TokenData> = new Map();
  private readonly tokenExpiryMs: number = 10 * 60 * 1000; // 10 minutes

  generateToken(): string {
    const token = randomBytes(16).toString('hex');
    this.tokens.set(token, {
      token,
      createdAt: new Date(),
      verified: false,
    });

    // Auto-cleanup expired tokens
    setTimeout(() => {
      this.tokens.delete(token);
    }, this.tokenExpiryMs);

    return token;
  }

  verifyToken(token: string): boolean {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return false;
    }

    const now = new Date().getTime();
    const createdAt = tokenData.createdAt.getTime();
    
    if (now - createdAt > this.tokenExpiryMs) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  markAsVerified(token: string): void {
    const tokenData = this.tokens.get(token);
    if (tokenData) {
      tokenData.verified = true;
      // Remove token after verification
      setTimeout(() => {
        this.tokens.delete(token);
      }, 5000);
    }
  }

  getActiveTokenCount(): number {
    return this.tokens.size;
  }
}
