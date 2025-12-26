import { Suspense } from "react";
import { ChartWrapper } from "@/components/dashboard/chart-wrapper";
import { RecentActivityTable } from "@/components/dashboard/recent-activity";
import { 
    ActiveSessionsCard, 
    AuthRequestsCard, 
    VerifiedUsersCard, 
    SuccessRateCard,
    StatCardSkeleton 
} from "@/components/dashboard/cards/stat-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { connection } from "next/server";

export default async function ProtectedPage() {
  await connection();
  
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        
        {/* Top 4 Cards - Loading Individually */}
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
            <Suspense fallback={<StatCardSkeleton />}>
                <ActiveSessionsCard />
            </Suspense>
            <Suspense fallback={<StatCardSkeleton />}>
                <AuthRequestsCard />
            </Suspense>
            <Suspense fallback={<StatCardSkeleton />}>
                <VerifiedUsersCard />
            </Suspense>
            <Suspense fallback={<StatCardSkeleton />}>
                <SuccessRateCard />
            </Suspense>
        </div>

        <div className="px-4 lg:px-6">
            <Suspense fallback={<ChartSkeleton />}>
                <ChartWrapper />
            </Suspense>
        </div>
        <div className="px-4 lg:px-6">
            <Suspense fallback={<TableSkeleton />}>
                <RecentActivityTable />
            </Suspense>
        </div>
      </div>
    </div>
  )
}

function ChartSkeleton() {
    return <Skeleton className="w-full h-[250px] rounded-xl" />;
}

function TableSkeleton() {
    return <Skeleton className="w-full h-[300px] rounded-xl" />;
}
