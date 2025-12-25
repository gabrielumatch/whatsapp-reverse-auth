import { useEffect, useState, useCallback } from 'react';
import { Chat } from '@/components/chat/data';

interface Session {
    id: string;
    status: string;
}

export function useWhatsAppChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // 1. Get Session
  useEffect(() => {
    const fetchSession = async () => {
        try {
            const res = await fetch('/api/sessions');
            const data = (await res.json()) as Session[];
            if (data && data.length > 0) {
                const active = data.find((s) => s.status === 'connected') || data[0];
                setSessionId(active.id);
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };
    fetchSession();
  }, []);

  // 2. Fetch Initial Chats
  const fetchChats = useCallback(async (currentSessionId: string, cursor?: string) => {
      try {
        const url = `/api/chats?sessionId=${currentSessionId}&limit=20` + (cursor ? `&cursor=${cursor}` : '');
        const res = await fetch(url);
        const data = await res.json();
        return data;
      } catch (e) {
        console.error(e);
        return [];
      }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    
    fetchChats(sessionId).then(data => {
        setChats(data);
        setHasMore(data.length === 20);
        setLoading(false);
    });
  }, [sessionId, fetchChats]);

  const loadMore = async () => {
      if (!sessionId || !hasMore || chats.length === 0) return;
      
      const lastChat = chats[chats.length - 1];
      const cursor = lastChat.last_message_at; // Use this as cursor
      
      const moreChats = await fetchChats(sessionId, cursor);
      
      if (moreChats.length < 20) setHasMore(false);
      
      if (moreChats.length > 0) {
          setChats(prev => {
              const existingIds = new Set(prev.map(c => c.id));
              const uniqueMore = moreChats.filter((c: Chat) => !existingIds.has(c.id));
              return [...prev, ...uniqueMore];
          });
      }
  };

  // Realtime subscription (SSE)
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

              setChats(prev => {
                  const map = new Map(prev.map(c => [c.id, c]));
                  map.set(updatedChat.id, updatedChat);
                  
                  return Array.from(map.values()).sort((a, b) => 
                      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
                  );
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
  }, [sessionId]);

  return { chats, sessionId, loading, loadMore, hasMore };
}