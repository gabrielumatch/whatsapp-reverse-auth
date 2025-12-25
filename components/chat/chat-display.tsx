import React, { useEffect, useRef } from "react";
import { Chat, Message } from "@/components/chat/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatBottombar } from "@/components/chat/chat-bottombar";
import {
  IconDotsVertical,
  IconPhone,
  IconVideo,
  IconInfoCircle
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { TextMessage, ImageMessage, VideoMessage, AudioMessage, DocumentMessage } from "./message-types";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatDetails } from "./chat-details";
import { IconChecks, IconCheck } from "@tabler/icons-react";

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
  isMobile,
  isTyping,
  loadMore,
  hasMore
}: ChatDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

    if (topRef.current) {
      observer.observe(topRef.current);
    }

    return () => {
      if (topRef.current) {
        observer.unobserve(topRef.current);
      }
    };
  }, [hasMore, loadMore]);

  useEffect(() => {
    // Only scroll to bottom on initial load
    if (messages.length > 0 && messages.length <= 50) {
        scrollToBottom();
    }
  }, [messages.length]);

  const renderMessageContent = (message: Message) => {
    // Media URL construction
    const mediaSrc = message.media_url ? `/api/media/whatsapp-media/${message.media_url}` : undefined;

    if (!mediaSrc && message.message_type !== 'conversation' && message.message_type !== 'extendedTextMessage') {
        // Fallback for missing media
        return <TextMessage content={`[${message.message_type}]`} />;
    }

    switch (message.message_type) {
        case 'imageMessage':
            return <ImageMessage url={mediaSrc!} caption={message.content} />;
        case 'videoMessage':
            return <VideoMessage url={mediaSrc!} caption={message.content} />;
        case 'audioMessage':
            return <AudioMessage url={mediaSrc!} />;
        case 'documentMessage':
            return <DocumentMessage url={mediaSrc!} caption={message.content} />;
        case 'stickerMessage':
             return <ImageMessage url={mediaSrc!} className="w-32 bg-transparent" />;
        default:
            return <TextMessage content={message.content} />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-4 border-b bg-background z-10">
        <Sheet>
            <SheetTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar>
                    <AvatarImage src={selectedChat.avatar_url || undefined} alt={selectedChat.name} />
                    <AvatarFallback>{selectedChat.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <div className="font-semibold">{selectedChat.name}</div>
                    <div className="text-xs text-muted-foreground">
                    {isTyping ? (
                        <span className="text-primary font-medium animate-pulse">Typing...</span>
                    ) : (
                        <span className="text-muted-foreground">Online</span>
                    )}
                    </div>
                </div>
                </div>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0">
                <ChatDetails chat={selectedChat} />
            </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <IconVideo className="size-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <IconPhone className="size-5 text-muted-foreground" />
          </Button>
          <Sheet>
             <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <IconInfoCircle className="size-5 text-muted-foreground" />
                </Button>
             </SheetTrigger>
             <SheetContent className="w-[400px] sm:w-[540px] p-0">
                <ChatDetails chat={selectedChat} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-muted/20 relative">
         <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)]"></div>
        
        {hasMore && <div ref={topRef} className="h-4 w-full flex justify-center items-center">
            <span className="loading loading-spinner loading-xs opacity-50"></span>
        </div>}

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id || index}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 50, x: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              transition={{
                opacity: { duration: 0.2 },
                layout: {
                  type: "spring",
                  bounce: 0.3,
                  duration: index * 0.05 + 0.2,
                },
              }}
              className={cn(
                "flex max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm z-10 relative",
                !message.is_from_me
                  ? "bg-card border self-start rounded-tl-none"
                  : "bg-primary text-primary-foreground self-end rounded-tr-none"
              )}
            >
              {renderMessageContent(message)}
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
          ))}
          {isTyping && (
             <motion.div
             initial={{ opacity: 0, scale: 0.8, y: 50, x: 0 }}
             animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
             exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
             className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-card border self-start rounded-tl-none shadow-sm z-10 relative"
           >
             <div className="flex gap-1 items-center h-5">
               <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
               <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
             </div>
           </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      <ChatBottombar sendMessage={sendMessage} />
    </div>
  );
}
