import {
  IconMicrophone,
  IconPaperclip,
  IconPlus,
  IconSend,
  IconMoodSmile,
} from "@tabler/icons-react";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Message, loggedInUserData } from "@/components/chat/data";

interface ChatBottombarProps {
  sendMessage: (newMessage: Message) => void;
  isMobile: boolean;
}

export function ChatBottombar({
  sendMessage,
  isMobile,
}: ChatBottombarProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: message.length + 1,
        name: loggedInUserData.name,
        avatar: loggedInUserData.avatar,
        message: message.trim(),
      };
      sendMessage(newMessage);
      setMessage("");

      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-2 flex justify-between w-full items-center gap-2">
      <div className="flex">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0")}
        >
          <IconPlus className="text-muted-foreground" size={20} />
        </Button>
      </div>

      <div className="w-full relative">
        <Input
          ref={inputRef}
          className="w-full border rounded-full flex items-center h-9 resize-none overflow-hidden bg-background"
          placeholder="Type a message..."
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
        />
        <div className="absolute right-2 top-0.5">
           <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
             <IconMoodSmile className="text-muted-foreground" size={20} />
          </Button>
        </div>
      </div>

      <div className="flex">
        {message.trim() ? (
          <Button
            className="h-9 w-9 shrink-0"
            variant="default"
            size="icon"
            onClick={handleSend}
          >
            <IconSend size={18} />
          </Button>
        ) : (
          <Button
            className="h-9 w-9 shrink-0"
            variant="ghost"
            size="icon"
          >
            <IconMicrophone className="text-muted-foreground" size={20} />
          </Button>
        )}
      </div>
    </div>
  );
}
