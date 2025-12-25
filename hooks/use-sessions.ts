import { useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Session {
    id: string; // mapped from session_id
    status: string;
    phoneNumber: string | null;
    qrCode?: string | null;
    updatedAt: string;
}

export function useSessions() {
    const queryClient = useQueryClient();

    // 1. Fetch Sessions
    const { data: sessions = [], isLoading } = useQuery<Session[]>({
        queryKey: ['sessions'],
        queryFn: async () => {
            const res = await fetch('/api/sessions');
            if (!res.ok) throw new Error("Failed to fetch sessions");
            return res.json();
        },
        staleTime: Infinity, // Rely on SSE for updates
    });

    // 2. Remove Session Mutation
    const { mutate: removeSession } = useMutation({
        mutationFn: async (sessionId: string) => {
            const res = await fetch(`/api/sessions?sessionId=${sessionId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Failed to remove session");
        },
        onSuccess: (_, sessionId) => {
            toast.success("Session removed");
            // Optimistic update or refetch
            queryClient.setQueryData<Session[]>(['sessions'], (old) => 
                old?.filter(s => s.id !== sessionId) || []
            );
        },
        onError: () => {
            toast.error("Failed to remove session");
        }
    });

    // 3. Realtime Updates
    useEffect(() => {
        const eventSource = new EventSource('/api/stream/session-status');

        eventSource.onmessage = (event) => {
            try {
                const update = JSON.parse(event.data) as Partial<Session> & { id: string };
                
                queryClient.setQueryData<Session[]>(['sessions'], (old) => {
                    if (!old) return old;
                    
                    const exists = old.find(s => s.id === update.id);
                    if (exists) {
                        return old.map(s => s.id === update.id ? { ...s, ...update } : s);
                    } else {
                        // If it's a new session we don't know about, maybe refetch or append?
                        // For this app, sessions are pre-created usually. 
                        // But let's assume we can append if it has minimal fields.
                        if (update.status) {
                             return [...old, update as Session];
                        }
                        return old;
                    }
                });
            } catch (e) {
                console.error("Failed to parse SSE session update:", e);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [queryClient]);

    return { sessions, loading: isLoading, removeSession };
}