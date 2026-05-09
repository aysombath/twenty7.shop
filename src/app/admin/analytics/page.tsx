import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PerformanceAnalytics } from "@/components/dashboard/performance-analytics"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-12 max-w-[1600px] mx-auto px-4 lg:px-10 pb-20">
        <PerformanceAnalytics />
      </div>
    </DashboardLayout>
  )
}
