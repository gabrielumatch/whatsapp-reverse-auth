"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <Button variant="ghost" onClick={handleLogout}>
      Logout
    </Button>
  );
}
