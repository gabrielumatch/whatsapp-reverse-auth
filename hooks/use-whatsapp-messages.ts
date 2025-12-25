import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message } from '@/components/chat/data';

export function useWhatsAppMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!chatId) {
        setMessages([]);
        return;
    }

    setLoading(true);

    // 1. Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });
      
      if (data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    // 2. Subscribe to new messages
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  return { messages, loading };
}
