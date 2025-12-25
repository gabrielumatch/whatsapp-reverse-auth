import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getChats } from "@/lib/data/get-chats";
import { getActiveSessionId } from "@/lib/data/get-active-session";

export default async function ChatsLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  const sessionId = await getActiveSessionId();

  if (sessionId) {
      await queryClient.prefetchInfiniteQuery({
          queryKey: ['chats', sessionId],
          queryFn: () => getChats(sessionId, 20),
          initialPageParam: null,
      });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full overflow-hidden border rounded-lg shadow-sm bg-background">
        <ChatSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
            {children}
        </div>
        </div>
    </HydrationBoundary>
  );
}
