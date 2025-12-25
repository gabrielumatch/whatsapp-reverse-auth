import React, { useEffect, useRef } from "react";
import { Message, UserData } from "@/components/chat/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatBottombar } from "@/components/chat/chat-bottombar";
import {
  IconCheck,
  IconChecks,
  IconDotsVertical,
  IconPhone,
  IconVideo,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface ChatDisplayProps {
  selectedUser: UserData;
  sendMessage: (newMessage: Message) => void;
  isMobile: boolean;
  isTyping?: boolean;
}

export function ChatDisplay({
  selectedUser,
  sendMessage,
  isMobile,
  isTyping,
}: ChatDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedUser.messages, isTyping]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-4 border-b bg-background z-10">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
            <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-semibold">{selectedUser.name}</div>
            <div className="text-xs text-muted-foreground">
              {isTyping ? (
                 <span className="text-primary font-medium animate-pulse">Typing...</span>
              ) : selectedUser.isOnline ? (
                <span className="text-green-500">Online</span>
              ) : (
                selectedUser.lastSeen
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <IconVideo className="size-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <IconPhone className="size-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <IconDotsVertical className="size-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-muted/20 relative">
         <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)]"></div>
        <AnimatePresence>
          {selectedUser.messages.map((message, index) => (
            <motion.div
              key={index}
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
                message.name === selectedUser.name
                  ? "bg-card border self-start rounded-tl-none"
                  : "bg-primary text-primary-foreground self-end rounded-tr-none"
              )}
            >
              <div>{message.message}</div>
              <div
                className={cn(
                  "text-[10px] flex items-center justify-end gap-1",
                  message.name === selectedUser.name
                    ? "text-muted-foreground"
                    : "text-primary-foreground/70"
                )}
              >
                {message.timestamp}
                {message.name !== selectedUser.name && (
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
      <ChatBottombar sendMessage={sendMessage} isMobile={isMobile} />
    </div>
  );
}
