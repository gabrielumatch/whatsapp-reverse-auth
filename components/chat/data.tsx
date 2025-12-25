export interface Chat {
    id: string; // uuid
    session_id: string;
    jid: string;
    name: string;
    avatar_url: string | null;
    last_message_at: string;
    last_message_content: string | null;
    unread_count: number;
}
  
export interface Message {
    id: string;
    chat_id: string;
    sender_jid: string;
    content: string;
    message_type: string;
    timestamp: string;
    status: string;
    is_from_me: boolean;
}