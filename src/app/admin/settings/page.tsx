import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SettingsPanel } from "@/components/dashboard/settings-panel"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-12 max-w-[1600px] mx-auto px-4 lg:px-10 pb-20">
        <SettingsPanel />
      </div>
    </DashboardLayout>
  )
}
