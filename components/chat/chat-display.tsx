import React, { useEffect, useRef } from "react";
import { Chat, Message } from "@/components/chat/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatBottombar } from "@/components/chat/chat-bottombar";
import {
  IconPhone,
  IconVideo,
  IconInfoCircle,
} from "@tabler/icons-react";
import { AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatDetails } from "./chat-details";
import { Lightbox } from "@/components/ui/lightbox";
import { ChatHeader } from "./chat-header";
import { MessageBubble } from "./message-bubble";

interface ChatDisplayProps {
  selectedChat: Chat;
  messages: Message[];
  sendMessage: (message: string) => void;
  isMobile: boolean;
  isTyping?: boolean;
  loadMore: () => void;
  hasMore: boolean;
}

export function ChatDisplay({
  selectedChat,
  messages,
  sendMessage,
  isTyping,
  loadMore,
  hasMore
}: ChatDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const el = topRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [hasMore, loadMore]);

  useEffect(() => {
    // Only scroll to bottom on initial load
    if (messages.length > 0 && messages.length <= 50) {
        scrollToBottom();
    }
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full w-full">
      <ChatHeader selectedChat={selectedChat} isTyping={isTyping} />

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-muted/20 relative">
         <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)]"></div>
        
        {hasMore && <div ref={topRef} className="h-4 w-full flex justify-center items-center">
            <span className="loading loading-spinner loading-xs opacity-50"></span>
        </div>}

        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble 
                key={message.id || index} 
                message={message} 
                onImageClick={setLightboxSrc} 
            />
          ))}
          {isTyping && (
             <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-card border self-start rounded-tl-none shadow-sm z-10 relative">
               <div className="flex gap-1 items-center h-5">
                 <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                 <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                 <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
               </div>
             </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      <ChatBottombar sendMessage={sendMessage} />
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
