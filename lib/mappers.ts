/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapChatToDto(chat: any) {
    return {
        id: chat.id,
        session_id: chat.sessionId || chat.session_id,
        jid: chat.jid,
        name: chat.name,
        avatar_url: chat.avatarUrl || chat.avatar_url,
        last_message_at: chat.lastMessageAt || chat.last_message_at,
        last_message_content: chat.lastMessageContent || chat.last_message_content,
        unread_count: chat.unreadCount || chat.unread_count || 0
    };
}

export function mapMessageToDto(message: any) {
    return {
        id: message.id,
        chat_id: message.chatId || message.chat_id,
        session_id: message.sessionId || message.session_id,
        sender_jid: message.senderJid || message.sender_jid,
        content: message.content,
        caption: message.caption,
        media_url: message.mediaUrl || message.media_url,
        message_type: message.messageType || message.message_type,
        timestamp: message.timestamp,
        status: message.status,
        is_from_me: message.isFromMe || message.is_from_me
    };
}
