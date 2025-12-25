import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface Session {
    id: string; // mapped from session_id
    status: string;
    phoneNumber: string | null;
    updatedAt: string;
}

export function useSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/sessions');
            const data = await res.json();
            setSessions(data);
        } catch (error) {
            console.error("Error fetching sessions:", error);
            toast.error("Failed to load sessions");
        }
        setLoading(false);
    };

    const removeSession = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/sessions?sessionId=${sessionId}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                toast.success("Session removed");
                fetchSessions();
            } else {
                toast.error("Failed to remove session");
            }
        } catch (error) {
            console.error("Error deleting session:", error);
            toast.error("Failed to remove session");
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    return { sessions, loading, removeSession };
}
