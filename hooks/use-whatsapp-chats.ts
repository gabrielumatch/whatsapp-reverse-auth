import { useEffect, useState } from 'react';
import { Chat } from '@/components/chat/data';

export function useWhatsAppChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Get Session
  useEffect(() => {
    // Ideally we list sessions. For now, fetch the first active one.
    // Or we rely on the user passing it? The UI currently auto-selects.
    // Let's fetch all sessions and pick one.
    const fetchSession = async () => {
        try {
            const res = await fetch('/api/sessions');
            const data = await res.json();
            if (data && data.length > 0) {
                // Prefer connected
                const active = data.find((s: any) => s.status === 'connected') || data[0];
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

  // 2. Fetch Chats (Poll)
  useEffect(() => {
    if (!sessionId) return;

    const fetchChats = async () => {
      try {
        const res = await fetch(`/api/chats?sessionId=${sessionId}`);
        const data = await res.json();
        setChats(data);
        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 3000); // Poll every 3s

    return () => clearInterval(interval);
  }, [sessionId]);

  return { chats, sessionId, loading };
}
