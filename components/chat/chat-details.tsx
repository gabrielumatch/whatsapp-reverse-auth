"use client";

import React, { useEffect, useState } from "react";
import { Chat, Message } from "@/components/chat/data";
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs";
import { Lightbox } from "@/components/ui/lightbox";
import { ChatDetailsHeader } from "./details/chat-details-header";
import { ChatMediaGrid } from "./details/chat-media-grid";
import { ChatDocsList } from "./details/chat-docs-list";
import { ChatSearch } from "./details/chat-search";

interface ChatDetailsProps {
  chat: Chat;
}

export function ChatDetails({ chat }: ChatDetailsProps) {
  const [media, setMedia] = useState<Message[]>([]);
  const [docs, setDocs] = useState<Message[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Fetch Media & Docs
  useEffect(() => {
    const fetchMedia = async () => {
      const res = await fetch(`/api/messages?chatId=${chat.id}&type=imageMessage&limit=20`);
      const data = await res.json();
      setMedia(data.reverse());
    };
    const fetchDocs = async () => {
      const res = await fetch(`/api/messages?chatId=${chat.id}&type=documentMessage&limit=20`);
      const data = await res.json();
      setDocs(data.reverse());
    };
    fetchMedia();
    fetchDocs();
  }, [chat.id]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ChatDetailsHeader 
        chat={chat} 
        onAvatarClick={() => chat.avatar_url && setLightboxSrc(chat.avatar_url)} 
      />

      <Tabs defaultValue="media" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 border-b shrink-0">
            <TabsList className="w-full">
            <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
            <TabsTrigger value="docs" className="flex-1">Docs</TabsTrigger>
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="media" className="flex-1 min-h-0 p-0 overflow-hidden">
          <div className="h-full p-4 overflow-y-auto">
            <ChatMediaGrid media={media} onImageClick={setLightboxSrc} />
          </div>
        </TabsContent>

        <TabsContent value="docs" className="flex-1 min-h-0 p-0 overflow-hidden">
          <div className="h-full p-4 overflow-y-auto">
             <ChatDocsList docs={docs} />
          </div>
        </TabsContent>

        <TabsContent value="search" className="flex-1 min-h-0 p-0 flex flex-col overflow-hidden">
            <ChatSearch chatId={chat.id} />
        </TabsContent>
      </Tabs>
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}