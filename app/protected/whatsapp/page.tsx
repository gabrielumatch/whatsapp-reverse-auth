import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Mock data
const accounts = [
  {
    id: "primary_bot",
    name: "Primary Bot",
    status: "connected",
    phone: "+1234567890",
  },
];

export default function WhatsAppAccountsPage() {
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
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {account.name}
              </CardTitle>
              {account.status === "connected" ? (
                <Badge className="bg-green-500 hover:bg-green-600">
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">Disconnected</Badge>
              )}
            </CardHeader>
            <CardHeader className="pt-2">
              <CardTitle className="text-2xl font-bold">
                {account.phone}
              </CardTitle>
              <CardDescription>Session ID: {account.id}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="destructive" className="w-full">
                <IconTrash className="mr-2 h-4 w-4" /> Remove
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
