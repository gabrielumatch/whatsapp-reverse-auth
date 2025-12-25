import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    transport: isDev
        ? {
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  ignore: 'pid,hostname',
              },
          }
        : undefined,
    // Redact sensitive keys
    redact: ['password', 'secret', 'token', 'key'],
});
