"use client";

import { ChatList } from "./chat-list";
import { useWhatsAppChats } from "@/hooks/use-whatsapp-chats";
import { useParams } from "next/navigation";

export function ChatSidebar() {
  const { chats, sessionId, loadMore, hasMore } = useWhatsAppChats();
  const params = useParams();
  const selectedId = params?.chatId as string | undefined;

  return (
    <div className="w-80 border-r flex flex-col shrink-0 overflow-hidden bg-background h-full">
        <div className="flex items-center px-4 py-4 border-b shrink-0">
            <h1 className="text-xl font-bold">Chats</h1>
        </div>
        <ChatList
          items={chats}
          selectedId={selectedId}
          loadMore={loadMore}
          hasMore={hasMore}
          sessionId={sessionId}
          basePath="/protected/chats"
        />
    </div>
  );
}
