import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CustomerManagement } from "@/components/dashboard/customer-management"

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 font-sans">
        <CustomerManagement />
      </div>
    </DashboardLayout>
  )
}
