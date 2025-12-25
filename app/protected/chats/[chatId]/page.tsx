import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getMessages } from "@/lib/data/get-messages";
import { ChatDisplayWrapper } from "@/components/chat/chat-display-wrapper";

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchInfiniteQuery({
      queryKey: ['messages', chatId],
      queryFn: () => getMessages(chatId, 50),
      initialPageParam: null,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
        <ChatDisplayWrapper chatId={chatId} />
    </HydrationBoundary>
  );
}