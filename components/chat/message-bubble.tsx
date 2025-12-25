import React from "react";
import { Message } from "@/components/chat/data";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { IconCheck, IconChecks } from "@tabler/icons-react";
import { TextMessage, ImageMessage, VideoMessage, AudioMessage, DocumentMessage } from "./message-types";

interface MessageBubbleProps {
    message: Message;
    onImageClick: (url: string) => void;
}

export function MessageBubble({ message, onImageClick }: MessageBubbleProps) {
    const renderContent = () => {
        const mediaSrc = message.media_url ? `/api/media/whatsapp-media/${message.media_url}` : undefined;

        if (!mediaSrc && message.message_type !== 'conversation' && message.message_type !== 'extendedTextMessage') {
            return <TextMessage content={`[${message.message_type}]`} />;
        }

        switch (message.message_type) {
            case 'imageMessage':
                return <ImageMessage url={mediaSrc!} caption={message.content} onClick={() => onImageClick(mediaSrc!)} />;
            case 'videoMessage':
                return <VideoMessage url={mediaSrc!} caption={message.content} />;
            case 'audioMessage':
                return <AudioMessage url={mediaSrc!} />;
            case 'documentMessage':
                return <DocumentMessage url={mediaSrc!} caption={message.content} />;
            case 'stickerMessage':
                return <ImageMessage url={mediaSrc!} className="w-32 bg-transparent" onClick={() => onImageClick(mediaSrc!)} />;
            default:
                return <TextMessage content={message.content} />;
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8, y: 50, x: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{
                opacity: { duration: 0.2 },
                layout: {
                    type: "spring",
                    bounce: 0.3,
                    duration: 0.2, // Simplified duration
                },
            }}
            className={cn(
                "flex max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm z-10 relative",
                !message.is_from_me
                    ? "bg-card border self-start rounded-tl-none"
                    : "bg-primary text-primary-foreground self-end rounded-tr-none"
            )}
        >
            {renderContent()}
            <div
                className={cn(
                    "text-[10px] flex items-center justify-end gap-1",
                    !message.is_from_me
                        ? "text-muted-foreground"
                        : "text-primary-foreground/70"
                )}
            >
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {message.is_from_me && (
                    <span>
                        {message.status === "read" && <IconChecks size={14} />}
                        {message.status === "delivered" && <IconChecks size={14} className="text-gray-300" />}
                        {message.status === "sent" && <IconCheck size={14} />}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
