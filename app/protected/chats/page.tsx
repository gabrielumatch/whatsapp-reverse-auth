import { ChatLayout } from "@/components/chat/chat-layout";

export default function ChatsPage() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-4 p-4 pt-0">
        <div className="flex flex-1 flex-col overflow-hidden border rounded-lg shadow-sm bg-background">
            <ChatLayout />
        </div>
    </div>
  );
}