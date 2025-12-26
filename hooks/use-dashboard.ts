import { useQuery } from "@tanstack/react-query";
import { Message } from "@/components/chat/data";

interface DashboardStats {
    activeSessions: number;
    totalMessages: number;
    messagesToday: number;
    authAttemptsToday: number;
    authVerifiedToday: number;
}

interface ActivityData {
    date: string;
    count: number;
}

export interface RecentActivity extends Message {
    chat_name: string;
}

export function useDashboardStats() {
    return useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
        staleTime: 60 * 1000, // 1 minute
    });
}

export function useDashboardActivity() {
    return useQuery<ActivityData[]>({
        queryKey: ['dashboard-activity'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/activity');
            if (!res.ok) throw new Error('Failed to fetch activity');
            return res.json();
        },
        staleTime: 60 * 1000, // 1 minute
    });
}

export function useRecentActivity() {
    return useQuery<RecentActivity[]>({
        queryKey: ['dashboard-recent'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/recent');
            if (!res.ok) throw new Error('Failed to fetch recent activity');
            return res.json();
        },
        staleTime: 10 * 1000, // 10 seconds
    });
}
