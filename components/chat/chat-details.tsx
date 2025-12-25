import React, { useEffect, useState } from "react";
import { Chat, Message } from "@/components/chat/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs";
import { DocumentMessage } from "./message-types";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Lightbox } from "@/components/ui/lightbox";

interface ChatDetailsProps {
  chat: Chat;
}

export function ChatDetails({ chat }: ChatDetailsProps) {
  const [media, setMedia] = useState<Message[]>([]);
  const [docs, setDocs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Fetch Media
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

  // Search
  useEffect(() => {
      if (!search) {
          setSearchResults([]);
          return;
      }
      const delayDebounceFn = setTimeout(async () => {
          setLoading(true);
          const res = await fetch(`/api/messages?chatId=${chat.id}&search=${encodeURIComponent(search)}&limit=20`);
          const data = await res.json();
          setSearchResults(data.reverse());
          setLoading(false);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
  }, [search, chat.id]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <SheetHeader className="p-6 border-b shrink-0 flex flex-col items-center gap-4">
        <Avatar 
            className="w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => chat.avatar_url && setLightboxSrc(chat.avatar_url)}
        >
          <AvatarImage src={chat.avatar_url || undefined} />
          <AvatarFallback>{chat.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center">
            <SheetTitle className="text-xl font-bold text-center truncate w-full">
                {chat.name}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground truncate w-full text-center">
                {chat.jid}
            </SheetDescription>
        </div>
      </SheetHeader>

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
            <div className="grid grid-cols-3 gap-2">
              {media.map((m) => {
                const url = m.media_url ? `/api/media/whatsapp-media/${m.media_url}` : '';
                return (
                    <div key={m.id} className="aspect-square relative cursor-pointer hover:opacity-80" onClick={() => setLightboxSrc(url)}>
                    <img 
                        src={url} 
                        className="object-cover w-full h-full rounded-md"
                        alt="media"
                    />
                    </div>
                );
              })}
              {media.length === 0 && <div className="col-span-full text-center text-muted-foreground p-4">No media</div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="flex-1 min-h-0 p-0 overflow-hidden">
          <div className="h-full p-4 overflow-y-auto">
             <div className="flex flex-col gap-2">
                {docs.map((m) => (
                    <DocumentMessage 
                        key={m.id}
                        url={m.media_url ? `/api/media/whatsapp-media/${m.media_url}` : '#'}
                        caption={m.content}
                    />
                ))}
                {docs.length === 0 && <div className="text-center text-muted-foreground p-4">No documents</div>}
             </div>
          </div>
        </TabsContent>

        <TabsContent value="search" className="flex-1 min-h-0 p-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b shrink-0">
                <div className="relative">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search in conversation..." 
                        className="pl-8" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col">
                    {loading && <p className="text-center p-4 text-sm">Searching...</p>}
                    {searchResults.map((m) => (
                        <div key={m.id} className="p-3 border-b hover:bg-muted/50 cursor-pointer">
                            <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {new Date(m.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                    {!loading && search && searchResults.length === 0 && (
                        <p className="text-center p-4 text-muted-foreground">No results found</p>
                    )}
                </div>
            </div>
        </TabsContent>
      </Tabs>
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}