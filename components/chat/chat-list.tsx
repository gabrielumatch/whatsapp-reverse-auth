import { Chat } from "@/components/chat/data";
import { useEffect, useRef, useState } from "react";
import { ChatListItem } from "./chat-list-item";
import { Input } from "@/components/ui/input";
import { IconSearch, IconLoader2 } from "@tabler/icons-react";

interface ChatListProps {
  items: Chat[];
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat) => void;
  loadMore: () => void;
  hasMore: boolean;
  sessionId: string | null;
}

interface SearchChat {
    id: string;
    sessionId: string;
    jid: string;
    name: string | null;
    avatarUrl: string | null;
    lastMessageAt: string | null;
    lastMessageContent: string | null;
    unreadCount: number | null;
}

export function ChatList({ items, selectedChat, setSelectedChat, loadMore, hasMore, sessionId }: ChatListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Chat[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const el = bottomRef.current;
    if (!el || !!search) return; // Disable observer while searching

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [hasMore, loadMore, search]);

  // Global Search Logic
  useEffect(() => {
      if (!search || !sessionId) {
          setSearchResults([]);
          return;
      }

      const delayDebounceFn = setTimeout(async () => {
          setIsSearching(true);
          try {
              const res = await fetch(`/api/search?sessionId=${sessionId}&query=${encodeURIComponent(search)}`);
              const data = await res.json();
              // API returns { messages, chats }. We map chats.
              setSearchResults(data.chats.map((c: SearchChat) => ({
                  id: c.id,
                  session_id: c.sessionId,
                  jid: c.jid,
                  name: c.name,
                  avatar_url: c.avatarUrl,
                  last_message_at: c.lastMessageAt,
                  last_message_content: c.lastMessageContent,
                  unread_count: c.unreadCount
              })));
          } catch (e) {
              console.error("Search failed", e);
          } finally {
              setIsSearching(false);
          }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
  }, [search, sessionId]);

  const displayItems = search ? searchResults : items;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b shrink-0">
          <div className="relative">
              {isSearching ? (
                  <IconLoader2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                  <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              )}
              <Input 
                  placeholder="Search chats..." 
                  className="pl-8 h-9" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
          </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-4 pt-2 overflow-y-auto overflow-x-hidden">
        {displayItems.map((item) => (
            <ChatListItem 
                key={item.id} 
                item={item} 
                isSelected={selectedChat?.id === item.id} 
                onClick={setSelectedChat} 
            />
        ))}
        
        {!search && hasMore && (
            <div ref={bottomRef} className="h-8 flex justify-center items-center shrink-0">
                <span className="loading loading-spinner loading-sm opacity-50"></span>
            </div>
        )}

        {search && !isSearching && displayItems.length === 0 && (
            <div className="text-center p-8 text-sm text-muted-foreground">
                No chats found for &quot;{search}&quot;
            </div>
        )}
      </div>
    </div>
  );
}