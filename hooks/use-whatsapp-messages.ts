import { useEffect, useState } from 'react';
import { Message } from '@/components/chat/data';

export function useWhatsAppMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatId) {
        setMessages([]);
        return;
    }

    setLoading(true);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages?chatId=${chatId}`);
            const data = await res.json();
            setMessages(data);
            setLoading(false);
        } catch (e) {
            console.error(e);
        }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1000); // Poll every 1s

    return () => clearInterval(interval);
  }, [chatId]);

  return { messages, loading };
}
