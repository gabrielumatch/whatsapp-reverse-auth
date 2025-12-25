import React from "react";
import { Message, UserData } from "@/components/chat/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatBottombar } from "@/components/chat/chat-bottombar";
import { IconDotsVertical, IconPhone, IconVideo } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface ChatDisplayProps {
  selectedUser: UserData;
  sendMessage: (newMessage: Message) => void;
  isMobile: boolean;
}

export function ChatDisplay({
  selectedUser,
  sendMessage,
  isMobile,
}: ChatDisplayProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
            <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="font-semibold">{selectedUser.name}</div>
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {selectedUser.messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
              message.name === selectedUser.name
                ? "bg-muted self-start"
                : "bg-primary text-primary-foreground self-end"
            )}
          >
            {message.message}
          </div>
        ))}
      </div>
      <ChatBottombar sendMessage={sendMessage} isMobile={isMobile} />
    </div>
  );
}
