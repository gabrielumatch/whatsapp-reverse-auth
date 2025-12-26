import { IconActivity, IconCheck, IconLock, IconServer } from "@tabler/icons-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getActiveSessionsCount, getAuthAttemptsTodayCount, getAuthVerifiedTodayCount } from "@/lib/data/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
    title: string;
    icon: React.ElementType;
    value: number | string;
    description: string;
}

// Generic Stat Card UI
function StatCard({ title, icon: Icon, value, description }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

export function StatCardSkeleton() {
    return <Skeleton className="h-32 rounded-xl" />;
}

export async function ActiveSessionsCard() {
    const count = await getActiveSessionsCount();
    return <StatCard title="Active Sessions" icon={IconServer} value={count} description="Connected bots" />;
}

export async function AuthRequestsCard() {
    const count = await getAuthAttemptsTodayCount();
    return <StatCard title="Auth Requests" icon={IconLock} value={count} description="Challenges generated today" />;
}

export async function VerifiedUsersCard() {
    const count = await getAuthVerifiedTodayCount();
    return <StatCard title="Verified Users" icon={IconCheck} value={count} description="Successful verifications today" />;
}

export async function SuccessRateCard() {
    const [requests, verified] = await Promise.all([
        getAuthAttemptsTodayCount(),
        getAuthVerifiedTodayCount()
    ]);
    const rate = requests > 0 ? Math.round((verified / requests) * 100) : 0;
    return <StatCard title="Success Rate" icon={IconActivity} value={`${rate}%`} description="Conversion rate today" />;
}
