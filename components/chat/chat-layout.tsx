"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChatList } from "@/components/chat/chat-list";
import { ChatDisplay } from "@/components/chat/chat-display";
import { Chat } from "@/components/chat/data";
import { useWhatsAppChats } from "@/hooks/use-whatsapp-chats";
import { useWhatsAppMessages } from "@/hooks/use-whatsapp-messages";
import { createClient } from "@/lib/supabase/client";

export function ChatLayout() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createClient();

  const { chats, sessionId, loading: chatsLoading } = useWhatsAppChats();
  const { messages, loading: messagesLoading } = useWhatsAppMessages(selectedChat?.id || null);

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkScreenWidth();

    // Event listener for screen width changes
    window.addEventListener("resize", checkScreenWidth);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  // Auto-select first chat if available and none selected (optional)
  useEffect(() => {
    if (!selectedChat && chats.length > 0 && window.innerWidth > 768) {
        setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  const sendMessage = async (messageContent: string) => {
    if (!selectedChat || !sessionId) return;

    const payload = {
        chat_id: selectedChat.id,
        session_id: sessionId,
        sender_jid: "me", // Placeholder
        content: messageContent,
        is_from_me: true,
        status: "sent",
        timestamp: new Date().toISOString()
    };

    console.log("Sending payload:", payload);

    const { error } = await supabase.from("whatsapp_messages").insert(payload);

    if (error) {
        console.error("Failed to send message:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className={cn("w-80 border-r flex flex-col shrink-0 overflow-y-auto", isMobile && "w-full", isMobile && selectedChat && "hidden")}>
        <div className="flex items-center px-4 py-4 border-b">
            <h1 className="text-xl font-bold">Chats</h1>
        </div>
        <ChatList
          items={chats}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
        />
      </div>
      <div className={cn("flex-1 flex flex-col overflow-hidden", isMobile && "hidden", isMobile && selectedChat && "flex")}>
        {selectedChat ? (
            <ChatDisplay
            selectedChat={selectedChat}
            messages={messages}
            sendMessage={sendMessage}
            isMobile={isMobile}
            />
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a chat to start messaging
            </div>
        )}
      </div>
    </div>
  );
}