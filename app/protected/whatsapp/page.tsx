"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconPlus, IconTrash, IconLoader } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSessions } from "@/hooks/use-sessions";

export default function WhatsAppAccountsPage() {
  const { sessions, loading, removeSession } = useSessions();

  if (loading) {
      return <div className="p-8 flex justify-center"><IconLoader className="animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">WhatsApp Accounts</h1>
        <Link href="/protected/whatsapp/add">
          <Button>
            <IconPlus className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {account.id}
              </CardTitle>
              {account.status === "connected" ? (
                <Badge className="bg-green-500 hover:bg-green-600">
                  Connected
                </Badge>
              ) : (
                <Badge variant={account.status === "connecting" ? "secondary" : "destructive"}>
                  {account.status}
                </Badge>
              )}
            </CardHeader>
            <CardHeader className="pt-2">
              <CardTitle className="text-xl font-bold truncate">
                {account.phoneNumber ? `+${account.phoneNumber}` : "No Number"}
              </CardTitle>
              <CardDescription className="text-xs truncate" title={account.id}>
                ID: {account.id}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => {
                    if (confirm("Are you sure you want to remove this session?")) {
                        removeSession(account.id);
                    }
                }}
              >
                <IconTrash className="mr-2 h-4 w-4" /> Remove
              </Button>
            </CardFooter>
          </Card>
        ))}
        {sessions.length === 0 && (
            <div className="col-span-full text-center p-8 text-muted-foreground">
                No accounts connected. Click &quot;Add Account&quot; to start.
            </div>
        )}
      </div>
    </div>
  );
}
