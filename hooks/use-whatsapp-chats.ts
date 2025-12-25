import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Chat } from '@/components/chat/data';

export function useWhatsAppChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 1. Get the first connected session
    const fetchSession = async () => {
      const { data } = await supabase
        .from('whatsapp_sessions_metadata')
        .select('session_id')
        .eq('status', 'connected')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setSessionId(data.session_id);
      } else {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    // 2. Fetch initial chats
    const fetchChats = async () => {
      const { data } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .eq('session_id', sessionId)
        .order('last_message_at', { ascending: false });
      
      if (data) setChats(data);
      setLoading(false);
    };

    fetchChats();

    // 3. Subscribe to chat updates
    const channel = supabase
      .channel(`chats:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_chats',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setChats((prev) => [payload.new as Chat, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === payload.new.id ? (payload.new as Chat) : chat
              ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { chats, sessionId, loading };
}
