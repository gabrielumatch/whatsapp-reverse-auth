import { useEffect, useState } from 'react';
import { Chat } from '@/components/chat/data';

interface Session {
    id: string;
    status: string;
}

export function useWhatsAppChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Get Session
  useEffect(() => {
    const fetchSession = async () => {
        try {
            const res = await fetch('/api/sessions');
            const data = (await res.json()) as Session[];
            if (data && data.length > 0) {
                // Prefer connected
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