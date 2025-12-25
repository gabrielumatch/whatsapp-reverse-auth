import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getMessages } from "@/lib/data/get-messages";
import { ChatDisplayWrapper } from "@/components/chat/chat-display-wrapper";
import { getChat } from "@/lib/data/get-chat";
import { Metadata } from "next";

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export async function generateMetadata({ params }: ChatPageProps): Promise<Metadata> {
    const { chatId } = await params;
    const chat = await getChat(chatId);
    
    return {
        title: "WRA - " + (chat?.name || "WRA - Chat"),
    };
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
