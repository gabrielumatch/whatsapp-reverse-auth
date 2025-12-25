import { cn } from "@/lib/utils";
import { Chat } from "@/components/chat/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatListProps {
  items: Chat[];
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat) => void;
}

export function ChatList({ items, selectedChat, setSelectedChat }: ChatListProps) {
  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
      {items.map((item) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
            selectedChat?.id === item.id && "bg-muted"
          )}
          onClick={() => setSelectedChat(item)}
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={item.avatar_url || ""} alt={item.name} />
                  <AvatarFallback>{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="font-semibold">{item.name}</div>
              </div>
              <div
                className={cn(
                  "ml-auto text-xs",
                  selectedChat?.id === item.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                 {item.last_message_at ? new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.last_message_content || <span className="italic">No messages yet</span>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
