import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

export async function GET(req: NextRequest) {
  // Create a dedicated Redis client for this subscription
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const subscriber = new Redis(redisUrl);

  const stream = new ReadableStream({
    async start(controller) {
      const channel = `updates:session-status`;
      
      try {
        await subscriber.subscribe(channel);
        
        subscriber.on("message", (chan, message) => {
            if (chan === channel) {
                // Send SSE event
                const data = `data: ${message}\n\n`;
                controller.enqueue(new TextEncoder().encode(data));
            }
        });

        // Ping
        const keepAlive = setInterval(() => {
            controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        }, 15000);

        req.signal.addEventListener("abort", () => {
            clearInterval(keepAlive);
            subscriber.quit();
        });

      } catch (err) {
        console.error("Redis subscription error:", err);
        controller.error(err);
      }
    },
    cancel() {
        subscriber.quit();
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
