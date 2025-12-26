import { getDashboardActivity } from "@/lib/data/dashboard";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

export async function ChartWrapper() {
    const data = await getDashboardActivity();
    return <ChartAreaInteractive data={data} />;
}
