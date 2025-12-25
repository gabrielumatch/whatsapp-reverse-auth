"use client";

import { userData } from "@/components/chat/data";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChatList } from "@/components/chat/chat-list";
import { ChatDisplay } from "@/components/chat/chat-display";

export function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState(userData[0]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="w-80 border-r flex flex-col shrink-0 overflow-y-auto">
        <div className="flex items-center px-4 py-4 border-b">
            <h1 className="text-xl font-bold">Chats</h1>
        </div>
        <ChatList
          items={userData}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatDisplay
          selectedUser={selectedUser}
          sendMessage={(newMessage) => {
             const updatedUser = { ...selectedUser };
             updatedUser.messages.push(newMessage);
             setSelectedUser(updatedUser);
          }}
          isMobile={false}
        />
      </div>
    </div>
  );
}