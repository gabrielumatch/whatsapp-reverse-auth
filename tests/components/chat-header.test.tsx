import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatHeader } from '@/components/chat/chat-header';
import { describe, it, expect, vi } from 'vitest';

// Mock ChatDetails because it fetches data
vi.mock('@/components/chat/chat-details', () => ({
    ChatDetails: () => <div data-testid="chat-details-mock">Details</div>
}));

describe('ChatHeader', () => {
    const mockChat = {
        id: '1',
        session_id: 's1',
        jid: '123@s.whatsapp.net',
        name: 'Alice',
        avatar_url: 'http://pic.url',
        last_message_at: '',
        last_message_content: '',
        unread_count: 0
    };

    it('renders chat name', () => {
        render(<ChatHeader selectedChat={mockChat} />);
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('shows typing indicator when isTyping is true', () => {
        render(<ChatHeader selectedChat={mockChat} isTyping={true} />);
        expect(screen.getByText('Typing...')).toBeInTheDocument();
    });

    it('shows online status when not typing', () => {
        render(<ChatHeader selectedChat={mockChat} isTyping={false} />);
        expect(screen.getByText('Online')).toBeInTheDocument();
    });
});
