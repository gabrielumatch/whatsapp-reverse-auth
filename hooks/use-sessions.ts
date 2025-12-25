import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface Session {
    session_id: string;
    status: string;
    phone_number: string | null;
    updated_at: string;
}

export function useSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from("whatsapp_sessions_metadata")
            .select("*")
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("Error fetching sessions:", error);
            toast.error("Failed to load sessions");
        } else {
            setSessions(data || []);
        }
        setLoading(false);
    };

    const removeSession = async (sessionId: string) => {
        const { error } = await supabase
            .from("whatsapp_sessions_metadata")
            .delete()
            .eq("session_id", sessionId);

        if (error) {
            console.error("Error deleting session:", error);
            toast.error("Failed to remove session");
        } else {
            toast.success("Session removed");
            fetchSessions();
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    return { sessions, loading, removeSession };
}
