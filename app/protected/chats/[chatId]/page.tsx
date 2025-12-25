"use client";

import { use, useEffect, useState } from "react";
import { ChatDisplay } from "@/components/chat/chat-display";
import { useWhatsAppMessages } from "@/hooks/use-whatsapp-messages";
import { useWhatsAppChats } from "@/hooks/use-whatsapp-chats";
import { Chat } from "@/components/chat/data";

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { chatId } = use(params);
  return <ChatDisplayWrapper chatId={chatId} />;
}

function ChatDisplayWrapper({ chatId }: { chatId: string }) {
    const { chats, sessionId } = useWhatsAppChats();
    const { messages, loadMore, hasMore } = useWhatsAppMessages(chatId);
    const [chat, setChat] = useState<Chat | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenWidth = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkScreenWidth();
        window.addEventListener("resize", checkScreenWidth);
        return () => window.removeEventListener("resize", checkScreenWidth);
    }, []);

    useEffect(() => {
        if (chats.length > 0) {
            const found = chats.find(c => c.id === chatId);
            if (found) setChat(found);
        }
    }, [chats, chatId]);

    const sendMessage = async (messageContent: string) => {
        if (!chat || !sessionId) return;
    
        const payload = {
            chat_id: chat.id,
            session_id: sessionId,
            content: messageContent,
        };
    
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
    
            if (!res.ok) {
                console.error("Failed to send message");
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    if (!chat) {
        // Fallback or Loading state
        // Ideally we fetch the single chat here if not in list
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <span className="loading loading-spinner loading-md"></span>
            </div>
        );
    }

    return (
        <ChatDisplay
            selectedChat={chat}
            messages={messages}
            sendMessage={sendMessage}
            isMobile={isMobile}
            loadMore={loadMore}
            hasMore={hasMore}
        />
    );
}