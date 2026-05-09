import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { RoleManagement } from "@/components/dashboard/role-management"
import { validateSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Precision Atelier - Role Architectures",
  description: "Configure system roles and operation rights inside the Precision Atelier workspace.",
}

export default async function RoleManagementPage() {
  const isValid = await validateSession()
  
  if (!isValid) {
    redirect("/login")
  }

  return (
    <DashboardLayout>
      <div className="w-full">
        <RoleManagement />
      </div>
    </DashboardLayout>
  )
}
