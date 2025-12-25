"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconLoader } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function AddWhatsAppAccountPage() {
  const [sessionId, setSessionId] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState("disconnected");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setSessionId("session_" + Math.random().toString(36).substring(7));
  }, []);

  const fetchInitialData = async () => {
      console.log("Fetching data for:", sessionId);
      const { data, error } = await supabase
          .from("whatsapp_sessions_metadata")
          .select("*")
          .eq("session_id", sessionId)
          .single();
      
      console.log("Fetch result:", data, error);

      if (data) {
          if (data.qr_code) setQrCode(data.qr_code);
          if (data.status) setStatus(data.status);
      }
  };

  useEffect(() => {
    setSessionId("session_" + Math.random().toString(36).substring(7));
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    fetchInitialData();

    // 1. Subscribe to changes
    console.log("Subscribing to session:", sessionId);
    const channel = supabase
      .channel("whatsapp_metadata")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_sessions_metadata",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("Received payload:", payload);
          const newData = payload.new as any;
          if (newData) {
            if (newData.qr_code) setQrCode(newData.qr_code);
            if (newData.status) setStatus(newData.status);
            
            if (newData.status === 'connected') {
                setTimeout(() => router.push('/protected/whatsapp'), 2000);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase, router]);

  const copyCommand = () => {
      const command = `SESSION_ID=${sessionId} npm run bot`;
      navigator.clipboard.writeText(command);
      alert("Command copied! Run this in your terminal.");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Connect WhatsApp</h1>
        <p className="text-muted-foreground">
          Scan the QR code to link your WhatsApp account.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Session: {sessionId}</CardTitle>
          <CardDescription>
            Waiting for QR Code...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          {status === "connected" ? (
             <div className="flex flex-col items-center text-green-500 gap-2">
                 <div className="text-xl font-bold">Connected!</div>
                 <p>Redirecting...</p>
             </div>
          ) : qrCode ? (
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={qrCode} size={256} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
               <IconLoader className="animate-spin text-muted-foreground" size={48} />
               <p className="text-sm text-muted-foreground">
                   Start the bot service with this session ID to generate a QR code.
               </p>
               <div className="p-2 bg-muted rounded-md font-mono text-xs break-all">
                   SESSION_ID={sessionId} npm run bot
               </div>
               <div className="flex gap-2">
                   <Button onClick={copyCommand} variant="outline" size="sm">
                       Copy Command
                   </Button>
                   <Button onClick={fetchInitialData} variant="secondary" size="sm">
                       Check Status
                   </Button>
               </div>
            </div>
          )}
          
          <div className="text-sm font-medium capitalize">
              Status: {status}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
