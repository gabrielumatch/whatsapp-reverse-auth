import { useEffect, useState, useCallback } from 'react';
import { Message } from '@/components/chat/data';

export function useWhatsAppMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initial Load
  useEffect(() => {
    if (!chatId) {
        setMessages([]);
        return;
    }

    setLoading(true);
    const fetchInitial = async () => {
        try {
            const res = await fetch(`/api/messages?chatId=${chatId}&limit=50`);
            const data = await res.json();
            setMessages(data);
            setHasMore(data.length === 50);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchInitial();
  }, [chatId]);

  // Realtime subscription (SSE)
  useEffect(() => {
    if (!chatId) return;

    const eventSource = new EventSource(`/api/stream/messages?chatId=${chatId}`);

    eventSource.onmessage = (event) => {
        try {
            const newMessage = JSON.parse(event.data) as Message;
            
            setMessages(prev => {
                const existing = prev.find(m => m.id === newMessage.id);
                
                if (existing) {
                    // Update existing message (e.g. status change)
                    return prev.map(m => m.id === newMessage.id ? newMessage : m);
                } else {
                    // Append new message
                    return [...prev, newMessage].sort((a, b) => 
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                }
            });
        } catch (e) {
            console.error("Failed to parse SSE message:", e);
        }
    };

    eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
        // EventSource automatically retries, but we can handle specific errors here
        // or close if fatal.
    };

    return () => {
        eventSource.close();
    };
  }, [chatId]);

  const loadMore = useCallback(async () => {
      if (!chatId || messages.length === 0) return;
      
      const oldestMsg = messages[0];
      try {
          const res = await fetch(`/api/messages?chatId=${chatId}&cursor=${oldestMsg.id}&limit=50`);
          const olderMessages = await res.json();
          
          if (olderMessages.length < 50) setHasMore(false);
          
          if (olderMessages.length > 0) {
              setMessages(prev => {
                  const existingIds = new Set(prev.map(m => m.id));
                  const uniqueOlder = olderMessages.filter((m: Message) => !existingIds.has(m.id));
                  return [...uniqueOlder, ...prev];
              });
          }
      } catch (e) {
          console.error(e);
      }
  }, [chatId, messages]);

  return { messages, loading, loadMore, hasMore };
}
