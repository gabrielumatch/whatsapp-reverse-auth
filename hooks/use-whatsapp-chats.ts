import { useEffect, useState } from 'react';
import { Chat } from '@/components/chat/data';
import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';

interface Session {
    id: string;
    status: string;
}

const PAGE_SIZE = 20;

export function useWhatsAppChats() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 1. Get Session (Connection Info)
  useEffect(() => {
    const fetchSession = async () => {
        try {
            const res = await fetch('/api/sessions');
            const data = (await res.json()) as Session[];
            if (data && data.length > 0) {
                const active = data.find((s) => s.status === 'connected') || data[0];
                setSessionId(active.id);
            }
        } catch (e) {
            console.error("Session fetch error:", e);
        }
    };
    fetchSession();
  }, []);

  // 2. Fetch Infinite Chats
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading
  } = useInfiniteQuery<Chat[], Error, InfiniteData<Chat[]>>({
    queryKey: ['chats', sessionId],
    queryFn: async ({ pageParam }) => {
      if (!sessionId) return [];
      const cursor = pageParam ? `&cursor=${pageParam}` : '';
      const url = `/api/chats?sessionId=${sessionId}&limit=${PAGE_SIZE}${cursor}`;
      const res = await fetch(url);
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: Chat[]) => {
      if (lastPage.length < PAGE_SIZE) return null;
      // The API returns chats sorted by last_message_at DESC.
      // So the last item is the oldest.
      return lastPage[lastPage.length - 1]?.last_message_at;
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // Consider chats fresh for 30s
  });

  const chats = data ? data.pages.flat() : [];

  // 3. Realtime subscription (SSE)
  useEffect(() => {
      if (!sessionId) return;

      const eventSource = new EventSource(`/api/stream/chats?sessionId=${sessionId}`);

      eventSource.onmessage = (event) => {
          try {
              // Raw Prisma object (camelCase)
              const rawChat = JSON.parse(event.data);
              
              // Map to Frontend Interface (snake_case)
              const updatedChat: Chat = {
                  id: rawChat.id,
                  session_id: rawChat.sessionId,
                  jid: rawChat.jid,
                  name: rawChat.name,
                  avatar_url: rawChat.avatarUrl,
                  unread_count: rawChat.unreadCount,
                  last_message_content: rawChat.lastMessageContent,
                  last_message_at: rawChat.lastMessageAt
              };

              queryClient.setQueryData<InfiniteData<Chat[]>>(['chats', sessionId], (oldData) => {
                  if (!oldData) return oldData;

                  let updated = false;

                  const newPages = oldData.pages.map((page: Chat[]) => {
                      const exists = page.find(c => c.id === updatedChat.id);
                      if (exists) {
                          updated = true;
                          return page.map(c => c.id === updatedChat.id ? updatedChat : c);
                      }
                      return page;
                  });

                  if (!updated) {
                      // Prepend to the first page (newest chunk)
                      if (newPages.length > 0) {
                          newPages[0] = [updatedChat, ...newPages[0]];
                      } else {
                          newPages[0] = [updatedChat];
                      }
                  }

                  // Re-sort the entire flattened dataset and put it into pages?
                  // For chats, we strictly want DESC order by last_message_at.
                  // Since updates happen at the top, we just need to ensure the flattened view 
                  // used in the UI stays sorted.
                  return {
                      ...oldData,
                      pages: newPages
                  };
              });

          } catch (e) {
              console.error("Failed to parse SSE chat update:", e);
          }
      };

      eventSource.onerror = (err) => {
          console.error("SSE Chat Error:", err);
      };

      return () => {
          eventSource.close();
      };
  }, [sessionId, queryClient]);

  return { 
    chats: chats.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    ), 
    sessionId, 
    loading: isLoading, 
    loadMore: fetchNextPage, 
    hasMore: hasNextPage 
  };
}
