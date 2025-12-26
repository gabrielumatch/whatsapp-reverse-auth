"use client";

import { IconActivity, IconCheck, IconLock, IconServer } from "@tabler/icons-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { useDashboardStats } from "@/hooks/use-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export function SectionCards() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
        </div>
    )
  }

  const requests = data?.authAttemptsToday ?? 0;
  const verified = data?.authVerifiedToday ?? 0;
  const rate = requests > 0 ? Math.round((verified / requests) * 100) : 0;

  const stats = [
      {
          title: "Active Sessions",
          value: data?.activeSessions ?? 0,
          icon: IconServer,
          description: "Connected bots"
      },
      {
          title: "Auth Requests",
          value: requests,
          icon: IconLock,
          description: "Challenges generated today"
      },
      {
          title: "Verified Users",
          value: verified,
          icon: IconCheck,
          description: "Successful verifications today"
      },
      {
          title: "Success Rate",
          value: `${rate}%`,
          icon: IconActivity,
          description: "Conversion rate today"
      }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
      ))}
    </div>
  )
}
