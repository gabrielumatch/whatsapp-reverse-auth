import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </Suspense>
  );
}

function LayoutSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <Skeleton className="h-full w-full" />
    </div>
  );
}

async function ProtectedLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return redirect("/auth/login");
  }

  return (
    <SidebarProvider>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AppSidebar user={session.user as any} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 pr-4">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
          <ThemeSwitcher />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
