"use client";

import { userData } from "@/components/chat/data";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChatList } from "@/components/chat/chat-list";
import { ChatDisplay } from "@/components/chat/chat-display";
import { Message } from "@/components/chat/data";

export function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState(userData[0]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkScreenWidth();

    // Event listener for screen width changes
    window.addEventListener("resize", checkScreenWidth);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  const sendMessage = (newMessage: Message) => {
    const updatedUser = { ...selectedUser };
    updatedUser.messages.push(newMessage);
    setSelectedUser(updatedUser);

    // Simulate a reply
    setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
            const replyMessage: Message = {
                id: Date.now() + 1,
                name: selectedUser.name,
                avatar: selectedUser.avatar,
                message: "This is a simulated reply to keep the conversation going! 🤖",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: "read"
            };
            const userWithReply = { ...updatedUser }; // Use latest state
            userWithReply.messages.push(replyMessage);
            setSelectedUser(userWithReply);
            setIsTyping(false);
        }, 2000);
    }, 1000);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className={cn("w-80 border-r flex flex-col shrink-0 overflow-y-auto", isMobile && "w-full", isMobile && selectedUser && "hidden")}>
        <div className="flex items-center px-4 py-4 border-b">
            <h1 className="text-xl font-bold">Chats</h1>
        </div>
        <ChatList
          items={userData}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
      </div>
      <div className={cn("flex-1 flex flex-col overflow-hidden", isMobile && "hidden", isMobile && selectedUser && "flex")}>
        <ChatDisplay
          selectedUser={selectedUser}
          sendMessage={sendMessage}
          isMobile={isMobile}
          isTyping={isTyping}
        />
      </div>
    </div>
  );
}