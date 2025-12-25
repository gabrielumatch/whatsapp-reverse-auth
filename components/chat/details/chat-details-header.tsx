import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Chat } from "@/components/chat/data";

interface ChatDetailsHeaderProps {
  chat: Chat;
  onAvatarClick?: () => void;
}

export function ChatDetailsHeader({ chat, onAvatarClick }: ChatDetailsHeaderProps) {
  return (
    <SheetHeader className="p-6 border-b shrink-0 flex flex-col items-center gap-4">
      <Avatar 
          className="w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onAvatarClick}
      >
        <AvatarImage src={chat.avatar_url || undefined} />
        <AvatarFallback>{chat.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-center">
          <SheetTitle className="text-xl font-bold text-center truncate w-full">
              {chat.name}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground truncate w-full text-center">
              {chat.jid}
          </SheetDescription>
      </div>
    </SheetHeader>
  );
}
