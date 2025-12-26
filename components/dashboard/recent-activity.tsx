import { getRecentActivity } from "@/lib/data/dashboard";
import { DataTable, RecentActivity } from "@/components/data-table";

export async function RecentActivityTable() {
    const data = await getRecentActivity();
    return <DataTable data={data as RecentActivity[]} />;
}
