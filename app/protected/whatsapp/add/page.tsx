"use client";

import { useEffect, useState, Suspense } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconLoader } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";

function AddWhatsAppAccountContent() {
  const [sessionId, setSessionId] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState("disconnected");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paramId = searchParams.get("session_id");
    if (paramId) {
        setSessionId(paramId);
    } else {
        setSessionId("session_" + Math.random().toString(36).substring(7));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!sessionId) return;

    const checkStatus = async () => {
        try {
            const res = await fetch(`/api/session?sessionId=${sessionId}`);
            const data = await res.json();
            
            if (data && data.status) {
                setStatus(data.status);
                if (data.qrCode) setQrCode(data.qrCode);
                
                if (data.status === 'connected') {
                    setTimeout(() => router.push('/protected/whatsapp'), 2000);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000); // Poll every 2s

    return () => clearInterval(interval);
  }, [sessionId, router]);

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

export default function AddWhatsAppAccountPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><IconLoader className="animate-spin" /></div>}>
            <AddWhatsAppAccountContent />
        </Suspense>
    );
}
