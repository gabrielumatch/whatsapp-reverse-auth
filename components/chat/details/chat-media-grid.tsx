import { Message } from "@/components/chat/data";
import React from "react";

interface ChatMediaGridProps {
  media: Message[];
  onImageClick: (url: string) => void;
}

export function ChatMediaGrid({ media, onImageClick }: ChatMediaGridProps) {
  if (media.length === 0) {
    return <div className="col-span-full text-center text-muted-foreground p-4">No media</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {media.map((m) => {
        const url = m.media_url ? `/api/media/whatsapp-media/${m.media_url}` : undefined;
        if (!url) return null;
        
        return (
            <div key={m.id} className="aspect-square relative cursor-pointer hover:opacity-80" onClick={() => onImageClick(url)}>
            <img 
                src={url} 
                className="object-cover w-full h-full rounded-md"
                alt="media"
            />
            </div>
        );
      })}
    </div>
  );
}
