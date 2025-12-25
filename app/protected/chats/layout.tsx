import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full overflow-hidden border rounded-lg shadow-sm bg-background">
      <ChatSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
