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
  
    content: string | null;
  
    caption: string | null;
  
    media_url: string | null;
  
    message_type: string | null;
  
    timestamp: string;
  
    status: string;
  
    is_from_me: boolean;
  
}
  

  

  
export const loggedInUserData = {
  
    id: "me",
  
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Admin",
  
    name: "Admin",
  
};
  