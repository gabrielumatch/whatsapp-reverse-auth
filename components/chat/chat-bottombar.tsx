import {
  IconMicrophone,
  IconMoodSmile,
  IconPlus,
  IconSend,
} from "@tabler/icons-react";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface ChatBottombarProps {
  sendMessage: (message: string) => void;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏", "🤝", "⭐"];

export function ChatBottombar({
  sendMessage,
}: ChatBottombarProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
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

  const onEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.success(`File selected: ${file.name} (Simulation)`);
      // Reset input
      event.target.value = "";
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.info("Recording started... (Simulation)");
    } else {
      toast.success("Recording saved! (Simulation)");
    }
  };

  return (
    <div className="p-2 flex justify-between w-full items-center gap-2 border-t">
      <div className="flex">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", "shrink-0")}
          onClick={handleFileClick}
        >
          <IconPlus className="text-muted-foreground" size={20} />
        </Button>
      </div>

      <div className="w-full relative flex items-center">
        {isRecording ? (
          <div className="flex-1 h-9 flex items-center px-4 bg-muted rounded-full animate-pulse text-destructive font-medium text-sm">
            Recording...
          </div>
        ) : (
          <Input
            ref={inputRef}
            className="w-full border rounded-full flex items-center h-9 resize-none overflow-hidden bg-background"
            placeholder="Type a message..."
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
          />
        )}
        
        <div className="absolute right-2 top-0.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isRecording}
              >
                <IconMoodSmile className="text-muted-foreground" size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2" side="top" align="end">
              <div className="grid grid-cols-5 gap-2">
                {EMOJIS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex">
        {message.trim() && !isRecording ? (
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
            className={cn(
              "h-9 w-9 shrink-0",
              isRecording && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
          >
            <IconMicrophone size={20} />
          </Button>
        )}
      </div>
    </div>
  );
}
