import React from "react";
import { Chat } from "@/components/chat/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatDetails } from "./chat-details";
import { IconPhone, IconVideo, IconInfoCircle } from "@tabler/icons-react";

interface ChatHeaderProps {
  selectedChat: Chat;
  isTyping?: boolean;
}

export function ChatHeader({ selectedChat, isTyping }: ChatHeaderProps) {
  return (
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
  );
}
