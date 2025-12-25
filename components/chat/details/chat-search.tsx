"use client";

import React, { useEffect, useState } from "react";
import { Message } from "@/components/chat/data";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";

interface ChatSearchProps {
  chatId: string;
}

export function ChatSearch({ chatId }: ChatSearchProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);

  useEffect(() => {
      if (!search) {
          setSearchResults([]);
          return;
      }
      const delayDebounceFn = setTimeout(async () => {
          setLoading(true);
          const res = await fetch(`/api/messages?chatId=${chatId}&search=${encodeURIComponent(search)}&limit=20`);
          const data = await res.json();
          setSearchResults(data.reverse()); // Show newest first
          setLoading(false);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
  }, [search, chatId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
    </div>
  );
}
