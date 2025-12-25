import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: urlPath } = await params;
    
    if (!urlPath || urlPath.length < 2) {
        return new NextResponse("Invalid path", { status: 400 });
    }

    const relativePath = urlPath.slice(1).join("/");
    const absolutePath = path.join(process.cwd(), 'storage', 'whatsapp-media', relativePath);

    if (!fs.existsSync(absolutePath)) {
        return new NextResponse("Media not found", { status: 404 });
    }

    try {
        const stats = fs.statSync(absolutePath);
        const ext = path.extname(absolutePath).toLowerCase();
        
        const mimeTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg',
            '.pdf': 'application/pdf',
            '.webp': 'image/webp',
        };

        // Create a Web ReadableStream from the Node.js ReadStream
        const nodeStream = fs.createReadStream(absolutePath);
        const stream = new ReadableStream({
            start(controller) {
                nodeStream.on('data', (chunk) => controller.enqueue(chunk));
                nodeStream.on('end', () => controller.close());
                nodeStream.on('error', (err) => controller.error(err));
            },
            cancel() {
                nodeStream.destroy();
            }
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": mimeTypes[ext] || "application/octet-stream",
                "Content-Length": stats.size.toString(),
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });

    } catch (error) {
        console.error("Media server error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
