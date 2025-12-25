import { cn, formatRelativeTime } from "@/lib/utils";
import { Chat } from "@/components/chat/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface ChatListItemProps {
    item: Chat;
    isSelected: boolean;
    onClick?: (chat: Chat) => void;
    href?: string;
}

export function ChatListItem({ item, isSelected, onClick, href }: ChatListItemProps) {
    const content = (
        <div className="flex w-full flex-col gap-1">
            <div className="flex items-center">
                <div className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={item.avatar_url || undefined} alt={item.name} />
                        <AvatarFallback>{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="font-semibold truncate max-w-[120px]">{item.name}</div>
                </div>
                <div
                    className={cn(
                        "ml-auto text-xs whitespace-nowrap",
                        isSelected
                            ? "text-foreground"
                            : "text-muted-foreground"
                    )}
                >
                    {item.last_message_at ? formatRelativeTime(item.last_message_at) : ''}
                </div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
                {item.last_message_content || <span className="italic text-[10px]">No messages yet</span>}
            </div>
        </div>
    );

    const className = cn(
        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent shrink-0 w-full",
        isSelected && "bg-muted"
    );

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button
            className={className}
            onClick={() => onClick?.(item)}
        >
            {content}
        </button>
    );
}
