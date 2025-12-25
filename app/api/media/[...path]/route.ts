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

    // Example path: whatsapp-media/session_id/msg_id.jpg
    // We only care about session_id/msg_id.jpg
    const relativePath = urlPath.slice(1).join("/");
    const absolutePath = path.join(process.cwd(), 'storage', 'whatsapp-media', relativePath);

    if (!fs.existsSync(absolutePath)) {
        return new NextResponse("Media not found", { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(absolutePath);
        const ext = path.extname(absolutePath).toLowerCase();
        
        const mimeTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg',
            '.pdf': 'application/pdf',
        };

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": mimeTypes[ext] || "application/octet-stream",
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });

    } catch (error) {
        console.error("Media server error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
