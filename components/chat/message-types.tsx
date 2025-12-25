import React from "react";
import Image from "next/image";
import { IconFile } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface MediaProps {
  url: string;
  caption?: string | null;
  className?: string;
  onClick?: () => void;
}

export const TextMessage = ({ content }: { content: string | null }) => (
  <div className="whitespace-pre-wrap break-words">{content || ""}</div>
);

export const ImageMessage = ({ url, caption, className, onClick }: MediaProps) => (
  <div className={cn("flex flex-col gap-1", className)}>
    <div 
        className={cn("relative aspect-video w-full max-w-sm rounded-md overflow-hidden bg-muted", onClick && "cursor-pointer hover:opacity-90")}
        onClick={onClick}
    >
      <Image 
        src={url} 
        alt={caption || "Image"} 
        fill 
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
    {caption && <div className="text-sm mt-1">{caption}</div>}
  </div>
);

export const VideoMessage = ({ url, caption, className }: MediaProps) => (
  <div className={cn("flex flex-col gap-1", className)}>
    <video controls className="w-full max-w-sm rounded-md bg-black">
      <source src={url} />
      Your browser does not support the video tag.
    </video>
    {caption && <div className="text-sm mt-1">{caption}</div>}
  </div>
);

export const AudioMessage = ({ url, className }: MediaProps) => (
  <div className={cn("flex items-center gap-2 p-2 min-w-[200px]", className)}>
    <audio controls className="h-8 w-full">
      <source src={url} />
    </audio>
  </div>
);

export const DocumentMessage = ({ url, caption, className }: MediaProps) => (
  <a 
    href={url} 
    target="_blank" 
    rel="noopener noreferrer"
    className={cn("flex items-center gap-3 p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors border", className)}
  >
    <div className="p-2 bg-background rounded-full">
      <IconFile className="size-6 text-primary" />
    </div>
    <div className="flex flex-col overflow-hidden">
      <span className="text-sm font-medium truncate max-w-[150px]">
        {caption || "Document"}
      </span>
      <span className="text-xs text-muted-foreground">Click to download</span>
    </div>
  </a>
);
