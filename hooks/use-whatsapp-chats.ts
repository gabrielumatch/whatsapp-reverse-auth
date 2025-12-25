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

  // 3. Poll for updates (Head only)
  useEffect(() => {
      if (!sessionId) return;
      
      const interval = setInterval(async () => {
          // Fetch latest 20 to check for new messages/chats
          const latest = await fetchChats(sessionId);
          
          setChats(prev => {
              // Create a map of existing chats for quick lookup
              const existingMap = new Map(prev.map(c => [c.id, c]));
              
              // Update/Add latest chats
              latest.forEach((chat: Chat) => {
                  existingMap.set(chat.id, chat);
              });
              
              // Convert back to array and sort
              // Note: This effectively keeps ALL loaded chats but updates the top ones.
              return Array.from(existingMap.values()).sort((a, b) => 
                  new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
          });
      }, 3000);

      return () => clearInterval(interval);
  }, [sessionId, fetchChats]);

  return { chats, sessionId, loading, loadMore, hasMore };
}