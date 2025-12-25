import { useEffect } from 'react';
import { Message } from '@/components/chat/data';
import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';

const PAGE_SIZE = 50;

export function useWhatsAppMessages(chatId: string | null) {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery<Message[], Error, InfiniteData<Message[]>>({
    queryKey: ['messages', chatId],
    queryFn: async ({ pageParam }) => {
      if (!chatId) return [];
      const cursor = pageParam ? `&cursor=${pageParam}` : '';
      const res = await fetch(`/api/messages?chatId=${chatId}&limit=${PAGE_SIZE}${cursor}`);
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: Message[]) => {
      // API returns Newest -> Oldest.
      // So the last element is the oldest.
      if (lastPage.length < PAGE_SIZE) return null;
      return lastPage[lastPage.length - 1]?.id; 
    },
    enabled: !!chatId,
    staleTime: Infinity, 
  });

  // Flatten pages, dedup, and sort Oldest -> Newest for display
  const messages = data ? Array.from(new Map(
      data.pages.flat().map(m => [m.id, m])
  ).values()).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  ) : [];

  // Realtime subscription (SSE)
  useEffect(() => {
    if (!chatId) return;

    const eventSource = new EventSource(`/api/stream/messages?chatId=${chatId}`);

    eventSource.onmessage = (event) => {
        try {
            const newMessage = JSON.parse(event.data) as Message;
            
            queryClient.setQueryData<InfiniteData<Message[]>>(['messages', chatId], (oldData) => {
                if (!oldData) return oldData;

                let updated = false;

                const newPages = oldData.pages.map((page: Message[]) => {
                    const exists = page.find(m => m.id === newMessage.id);
                    if (exists) {
                        updated = true;
                        return page.map(m => m.id === newMessage.id ? newMessage : m);
                    }
                    return page;
                });

                if (!updated) {
                   // Append to the start of the first page (Newest chunk)
                   if (newPages.length > 0) {
                       newPages[0] = [newMessage, ...newPages[0]];
                   } else {
                       newPages[0] = [newMessage];
                   }
                }

                return {
                    ...oldData,
                    pages: newPages
                };
            });

        } catch (e) {
            console.error("Failed to parse SSE message:", e);
        }
    };

    eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
    };

    return () => {
        eventSource.close();
    };
  }, [chatId, queryClient]);

  return { 
    messages, 
    loading: isLoading, 
    loadMore: fetchNextPage, 
    hasMore: hasNextPage,
    isFetchingMore: isFetchingNextPage 
  };
}