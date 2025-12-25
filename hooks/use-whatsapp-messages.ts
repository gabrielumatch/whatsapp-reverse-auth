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

  // Polling for new messages
  useEffect(() => {
    if (!chatId) return;

    const pollMessages = async () => {
        try {
            // Fetch latest 20
            const res = await fetch(`/api/messages?chatId=${chatId}&limit=20`);
            const newBatch = await res.json();
            
            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const uniqueNew = newBatch.filter((m: Message) => !existingIds.has(m.id));
                
                if (uniqueNew.length === 0) {
                    // Check for status updates on existing messages
                    // Simple check: if status changed.
                    // For now, just replace the tail if overlap? 
                    // Let's just append unique. Status updates might require full re-fetch or map.
                    // To handle status updates (sent -> delivered), we should update existing messages if ID matches.
                    return prev.map(m => {
                        const updated = newBatch.find((n: Message) => n.id === m.id);
                        return updated ? updated : m;
                    });
                }
                
                // If we have unique new messages (that are newer than our tail), append them.
                // Note: `newBatch` is sorted Old->New.
                // We only want to append messages that are strictly newer than our last message?
                // Or just merge and sort?
                // Safest: Merge and Sort by timestamp.
                const combined = [...prev, ...uniqueNew].sort((a, b) => 
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
                return combined;
            });
        } catch (e) {
            console.error(e);
        }
    };

    const interval = setInterval(pollMessages, 2000);
    return () => clearInterval(interval);
  }, [chatId]);

  const loadMore = useCallback(async () => {
      if (!chatId || messages.length === 0) return;
      
      const oldestMsg = messages[0];
      try {
          const res = await fetch(`/api/messages?chatId=${chatId}&cursor=${oldestMsg.id}&limit=50`);
          const olderMessages = await res.json();
          
          if (olderMessages.length < 50) setHasMore(false);
          
          if (olderMessages.length > 0) {
              setMessages(prev => [...olderMessages, ...prev]);
          }
      } catch (e) {
          console.error(e);
      }
  }, [chatId, messages]);

  return { messages, loading, loadMore, hasMore };
}
