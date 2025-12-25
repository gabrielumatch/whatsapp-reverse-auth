import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Create a dedicated Redis client for this subscription
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const subscriber = new Redis(redisUrl);

  const stream = new ReadableStream({
    async start(controller) {
      // Subscribe to the channel
      const channel = `updates:session:${sessionId}`;
      
      try {
        await subscriber.subscribe(channel);
        
        subscriber.on("message", (chan, message) => {
            if (chan === channel) {
                // Send SSE event
                const data = `data: ${message}\n\n`;
                controller.enqueue(new TextEncoder().encode(data));
            }
        });

        // Send a ping to keep connection alive
        const keepAlive = setInterval(() => {
            controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        }, 15000);

        // Cleanup when stream closes
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
