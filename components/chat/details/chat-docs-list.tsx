import { Message } from "@/components/chat/data";
import { DocumentMessage } from "../message-types";
import React from "react";

interface ChatDocsListProps {
  docs: Message[];
}

export function ChatDocsList({ docs }: ChatDocsListProps) {
  if (docs.length === 0) {
    return <div className="text-center text-muted-foreground p-4">No documents</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {docs.map((m) => (
          <DocumentMessage 
              key={m.id}
              url={m.media_url ? `/api/media/whatsapp-media/${m.media_url}` : '#'}
              caption={m.content}
          />
      ))}
    </div>
  );
}
