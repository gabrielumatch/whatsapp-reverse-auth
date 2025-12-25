import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Message, UserData } from "@/components/chat/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatListProps {
  items: UserData[];
  selectedUser: UserData;
  setSelectedUser: (user: UserData) => void;
}

export function ChatList({ items, selectedUser, setSelectedUser }: ChatListProps) {
  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
      {items.map((item) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
            selectedUser.id === item.id && "bg-muted"
          )}
          onClick={() => setSelectedUser(item)}
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={item.avatar} alt={item.name} />
                  <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="font-semibold">{item.name}</div>
              </div>
              <div
                className={cn(
                  "ml-auto text-xs",
                  selectedUser.id === item.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.messages.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    2m ago
                  </span>
                ) : null}
              </div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.messages.length > 0
                ? item.messages[item.messages.length - 1].message.substring(
                    0,
                    300
                  )
                : <span className="italic">No messages yet</span>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
